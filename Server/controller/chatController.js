const path = require('path');
const multer = require('multer');
const Message = require('../models/Message');
const Consultation = require('../models/Consultation');
const { getIO } = require('../socket/socketServer');

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/jpg',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed. Allowed: PDF, JPG, PNG, DOCX'), false);
    }
  }
});

exports.uploadMiddleware = upload.single('file');

// Get messages for a consultation
const getConsultationForChat = async (consultationId, chatActor) => {
  const consultation = await Consultation.findById(consultationId);
  if (!consultation) return { err: 'NOT_FOUND' };
  if (consultation.status !== 'accepted') return { err: 'CHAT_NOT_AVAILABLE' };
  const isUser = chatActor.type === 'user';
  const partyId = isUser ? consultation.user?.toString() : consultation.lawyer?.toString();
  if (partyId !== chatActor.id) return { err: 'FORBIDDEN' };
  return { consultation };
};

exports.getMessages = async (req, res) => {
  try {
    const { consultationId } = req.params;
    const { consultation, err } = await getConsultationForChat(consultationId, req.chatActor);
    if (err) {
      if (err === 'NOT_FOUND') return res.status(404).json({ message: 'Consultation not found' });
      if (err === 'CHAT_NOT_AVAILABLE') return res.status(400).json({ message: 'Chat is not available for this consultation' });
      return res.status(403).json({ message: 'Access denied' });
    }

    const messages = await Message.find({ consultation: consultationId })
      .sort({ createdAt: 1 });

    res.json({
      success: true,
      messages,
      consultation: {
        id: consultation._id,
        subject: consultation.subject,
        user: consultation.user,
        lawyer: consultation.lawyer,
      }
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { consultationId } = req.params;
    const { content } = req.body;
    if (!content || typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({ message: 'Message content is required' });
    }
    const trimmed = content.trim().slice(0, 2000);

    const { consultation, err } = await getConsultationForChat(consultationId, req.chatActor);
    if (err) {
      if (err === 'NOT_FOUND') return res.status(404).json({ message: 'Consultation not found' });
      if (err === 'CHAT_NOT_AVAILABLE') return res.status(400).json({ message: 'Chat is not available for this consultation' });
      return res.status(403).json({ message: 'Access denied' });
    }

    const message = new Message({
      consultation: consultationId,
      senderType: req.chatActor.type,
      senderId: req.chatActor.id,
      content: trimmed,
      messageType: 'text',
      status: 'sent',
    });
    await message.save();

    const messageData = {
      _id: message._id,
      consultation: message.consultation,
      senderType: message.senderType,
      senderId: message.senderId,
      content: message.content,
      messageType: message.messageType,
      status: message.status,
      createdAt: message.createdAt,
    };

    // Emit via Socket.IO
    const io = getIO();
    if (io) {
      io.to(`chat:${consultationId}`).emit('receiveMessage', messageData);
    }

    res.status(201).json({ success: true, message: messageData });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.uploadFile = async (req, res) => {
  try {
    const { consultationId } = req.params;

    const { consultation, err } = await getConsultationForChat(consultationId, req.chatActor);
    if (err) {
      if (err === 'NOT_FOUND') return res.status(404).json({ message: 'Consultation not found' });
      if (err === 'CHAT_NOT_AVAILABLE') return res.status(400).json({ message: 'Chat is not available for this consultation' });
      return res.status(403).json({ message: 'Access denied' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    const message = new Message({
      consultation: consultationId,
      senderType: req.chatActor.type,
      senderId: req.chatActor.id,
      content: req.body.caption || '',
      messageType: 'file',
      status: 'sent',
      fileName: req.file.originalname,
      fileUrl: fileUrl,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
    });
    await message.save();

    const messageData = {
      _id: message._id,
      consultation: message.consultation,
      senderType: message.senderType,
      senderId: message.senderId,
      content: message.content,
      messageType: message.messageType,
      status: message.status,
      fileName: message.fileName,
      fileUrl: message.fileUrl,
      fileType: message.fileType,
      fileSize: message.fileSize,
      createdAt: message.createdAt,
    };

    // Emit via Socket.IO
    const io = getIO();
    if (io) {
      io.to(`chat:${consultationId}`).emit('receiveMessage', messageData);
    }

    res.status(201).json({ success: true, message: messageData });
  } catch (error) {
    console.error('Upload file error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
