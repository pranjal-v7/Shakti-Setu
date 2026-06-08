const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Lawyer = require('../models/Lawyer');
const Consultation = require('../models/Consultation');
const Message = require('../models/Message');

let io;

// Track online users: Map<odId, Set<socketId>>
const onlineUsers = new Map();

function getOnlineKey(type, id) {
    return `${type}:${id}`;
}

function initializeSocket(server) {
    io = new Server(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
        },
    });

    // JWT Authentication middleware
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) return next(new Error('Authentication required'));

            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

            if (decoded.type === 'user') {
                const user = await User.findById(decoded.userId).select('-password');
                if (!user) return next(new Error('Invalid token'));
                socket.chatActor = { type: 'user', id: user._id.toString(), name: user.name };
            } else if (decoded.type === 'lawyer') {
                const lawyer = await Lawyer.findById(decoded.lawyerId).select('-password');
                if (!lawyer) return next(new Error('Invalid token'));
                socket.chatActor = { type: 'lawyer', id: lawyer._id.toString(), name: lawyer.name };
            } else {
                return next(new Error('Invalid token type'));
            }

            next();
        } catch (err) {
            next(new Error('Authentication failed'));
        }
    });

    io.on('connection', (socket) => {
        const actor = socket.chatActor;
        const onlineKey = getOnlineKey(actor.type, actor.id);

        // Track this connection
        if (!onlineUsers.has(onlineKey)) {
            onlineUsers.set(onlineKey, new Set());
        }
        onlineUsers.get(onlineKey).add(socket.id);

        console.log(`[Socket] ${actor.type} ${actor.name} connected (${socket.id})`);

        // Join a chat room (consultation)
        socket.on('joinChat', async (consultationId) => {
            try {
                const consultation = await Consultation.findById(consultationId);
                if (!consultation || consultation.status !== 'accepted') return;

                const isUser = actor.type === 'user';
                const partyId = isUser ? consultation.user?.toString() : consultation.lawyer?.toString();
                if (partyId !== actor.id) return;

                const room = `chat:${consultationId}`;
                socket.join(room);

                // Notify others in the room that this user is online
                socket.to(room).emit('userOnline', {
                    type: actor.type,
                    id: actor.id,
                    name: actor.name,
                });

                // Check if the other party is online
                const otherType = isUser ? 'lawyer' : 'user';
                const otherId = isUser ? consultation.lawyer?.toString() : consultation.user?.toString();
                const otherKey = getOnlineKey(otherType, otherId);
                const otherOnline = onlineUsers.has(otherKey) && onlineUsers.get(otherKey).size > 0;

                socket.emit('otherPartyStatus', {
                    type: otherType,
                    id: otherId,
                    online: otherOnline,
                });

                // Mark unread messages as delivered
                await Message.updateMany(
                    {
                        consultation: consultationId,
                        senderType: { $ne: actor.type },
                        status: 'sent',
                    },
                    { status: 'delivered' }
                );

                console.log(`[Socket] ${actor.name} joined room ${room}`);
            } catch (err) {
                console.error('[Socket] joinChat error:', err.message);
            }
        });

        // Leave a chat room
        socket.on('leaveChat', (consultationId) => {
            const room = `chat:${consultationId}`;
            socket.leave(room);
            socket.to(room).emit('userOffline', {
                type: actor.type,
                id: actor.id,
            });
        });

        // Typing indicators
        socket.on('typing', (consultationId) => {
            const room = `chat:${consultationId}`;
            socket.to(room).emit('userTyping', {
                type: actor.type,
                id: actor.id,
                name: actor.name,
            });
        });

        socket.on('stopTyping', (consultationId) => {
            const room = `chat:${consultationId}`;
            socket.to(room).emit('userStopTyping', {
                type: actor.type,
                id: actor.id,
            });
        });

        // Mark messages as delivered
        socket.on('markDelivered', async ({ consultationId, messageIds }) => {
            try {
                await Message.updateMany(
                    { _id: { $in: messageIds }, status: 'sent' },
                    { status: 'delivered' }
                );
                const room = `chat:${consultationId}`;
                socket.to(room).emit('messagesDelivered', { messageIds });
            } catch (err) {
                console.error('[Socket] markDelivered error:', err.message);
            }
        });

        // Handle disconnect
        socket.on('disconnect', () => {
            const set = onlineUsers.get(onlineKey);
            if (set) {
                set.delete(socket.id);
                if (set.size === 0) {
                    onlineUsers.delete(onlineKey);
                    // Notify all rooms this socket was in
                    for (const room of socket.rooms) {
                        if (room.startsWith('chat:')) {
                            io.to(room).emit('userOffline', {
                                type: actor.type,
                                id: actor.id,
                            });
                        }
                    }
                }
            }
            console.log(`[Socket] ${actor.name} disconnected (${socket.id})`);
        });
    });

    return io;
}

function getIO() {
    return io;
}

module.exports = { initializeSocket, getIO };
