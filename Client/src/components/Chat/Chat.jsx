import { useEffect, useState, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getUserConsultations, getLawyerConsultations } from "../../store/slices/consultationSlice";
import { chatAPI } from "../../services/api";
import { connectSocket, getSocket, disconnectSocket } from "../../services/socket";
import GlassCard from "../common/GlassCard";
import {
  MessageCircle, Send, ArrowLeft, AlertCircle,
  Paperclip, X, FileText, Image, File, Download,
  Check, CheckCheck, Loader,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8000';

const Chat = () => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { isAuthenticated: isLawyerAuthenticated } = useSelector((state) => state.lawyer);
  const { consultations } = useSelector((state) => state.consultation);

  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState(null);
  const [otherTyping, setOtherTyping] = useState(false);
  const [otherOnline, setOtherOnline] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null); // null or 0-100
  const [selectedFile, setSelectedFile] = useState(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const isLawyerRef = useRef(false);

  const isUser = isAuthenticated && !isLawyerAuthenticated;
  const isLawyer = isLawyerAuthenticated;

  // Keep ref in sync so async callbacks always have the latest value
  isLawyerRef.current = isLawyer;

  const acceptedList = (consultations || []).filter((c) => c.status === "accepted");

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Connect socket on mount
  useEffect(() => {
    if (!isUser && !isLawyer) return;
    const token = isLawyer
      ? localStorage.getItem("lawyerToken")
      : localStorage.getItem("token");
    if (token) {
      connectSocket(token);
    }
    return () => {
      disconnectSocket();
    };
  }, [isUser, isLawyer]);

  // Load consultation list
  useEffect(() => {
    if (!isUser && !isLawyer) return;
    if (isUser) dispatch(getUserConsultations());
    if (isLawyer) dispatch(getLawyerConsultations("accepted"));
  }, [dispatch, isUser, isLawyer]);

  // Fetch initial messages and setup socket listeners for selected consultation
  useEffect(() => {
    if (!selectedConsultation) {
      setMessages([]);
      setChatError(null);
      setOtherTyping(false);
      setOtherOnline(false);
      return;
    }

    const cid = selectedConsultation._id || selectedConsultation.id;
    const socket = getSocket();

    // Fetch existing messages via REST
    const fetchMessages = async () => {
      try {
        const res = await chatAPI.getMessages(cid, isLawyerRef.current);
        setMessages(res.data.messages || []);
        setChatError(null);
      } catch (e) {
        if (e.response?.status === 400 && e.response?.data?.message?.toLowerCase().includes("not available")) {
          setChatError("This chat is no longer available.");
          setSelectedConsultation(null);
          setMessages([]);
          refreshList();
        } else {
          setChatError(e.response?.data?.message || "Failed to load messages");
        }
      }
    };
    fetchMessages();

    // Join socket room
    if (socket) {
      socket.emit("joinChat", cid);

      const onMessage = (msg) => {
        setMessages((prev) => {
          // Prevent duplicates
          if (prev.some((m) => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
      };

      const onTyping = (data) => {
        const actorType = isUser ? "user" : "lawyer";
        if (data.type !== actorType) setOtherTyping(true);
      };

      const onStopTyping = (data) => {
        const actorType = isUser ? "user" : "lawyer";
        if (data.type !== actorType) setOtherTyping(false);
      };

      const onUserOnline = (data) => {
        const actorType = isUser ? "user" : "lawyer";
        if (data.type !== actorType) setOtherOnline(true);
      };

      const onUserOffline = (data) => {
        const actorType = isUser ? "user" : "lawyer";
        if (data.type !== actorType) setOtherOnline(false);
      };

      const onOtherStatus = (data) => {
        setOtherOnline(data.online);
      };

      const onDelivered = ({ messageIds }) => {
        setMessages((prev) =>
          prev.map((m) =>
            messageIds.includes(m._id) ? { ...m, status: "delivered" } : m
          )
        );
      };

      socket.on("receiveMessage", onMessage);
      socket.on("userTyping", onTyping);
      socket.on("userStopTyping", onStopTyping);
      socket.on("userOnline", onUserOnline);
      socket.on("userOffline", onUserOffline);
      socket.on("otherPartyStatus", onOtherStatus);
      socket.on("messagesDelivered", onDelivered);

      return () => {
        socket.emit("leaveChat", cid);
        socket.off("receiveMessage", onMessage);
        socket.off("userTyping", onTyping);
        socket.off("userStopTyping", onStopTyping);
        socket.off("userOnline", onUserOnline);
        socket.off("userOffline", onUserOffline);
        socket.off("otherPartyStatus", onOtherStatus);
        socket.off("messagesDelivered", onDelivered);
      };
    }
  }, [selectedConsultation?._id || selectedConsultation?.id, isLawyer]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, otherTyping]);

  const refreshList = () => {
    if (isUser) dispatch(getUserConsultations());
    if (isLawyer) dispatch(getLawyerConsultations("accepted"));
  };

  // Typing indicator
  const handleInputChange = useCallback((e) => {
    setInputValue(e.target.value);
    const socket = getSocket();
    const cid = selectedConsultation?._id || selectedConsultation?.id;
    if (socket && cid) {
      socket.emit("typing", cid);
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("stopTyping", cid);
      }, 1500);
    }
  }, [selectedConsultation]);

  const handleSend = async () => {
    const text = inputValue.trim();
    if (!text || !selectedConsultation || sending) return;
    const cid = selectedConsultation._id || selectedConsultation.id;
    const socket = getSocket();
    setSending(true);
    setInputValue("");
    if (socket) socket.emit("stopTyping", cid);
    try {
      await chatAPI.sendMessage(cid, text, isLawyerRef.current);
      // Message will arrive via socket "receiveMessage" event
    } catch (e) {
      setChatError(e.response?.data?.message || "Failed to send message");
      setInputValue(text);
    } finally {
      setSending(false);
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setChatError("File too large. Max 10MB.");
      return;
    }
    setSelectedFile(file);
    setChatError(null);
  };

  const cancelFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileUpload = async () => {
    if (!selectedFile || !selectedConsultation) return;
    const cid = selectedConsultation._id || selectedConsultation.id;
    setUploadProgress(0);
    setSending(true);
    try {
      await chatAPI.uploadFile(cid, selectedFile, isLawyerRef.current, (pct) => {
        setUploadProgress(pct);
      });
      // Message will arrive via socket "receiveMessage" event
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (e) {
      setChatError(e.response?.data?.message || "Failed to upload file");
    } finally {
      setUploadProgress(null);
      setSending(false);
    }
  };

  const otherPartyName = selectedConsultation
    ? isUser
      ? selectedConsultation.lawyer?.name || "Lawyer"
      : selectedConsultation.user?.name || "User"
    : "";

  if (!isAuthenticated && !isLawyerAuthenticated) {
    return (
      <div className="page-container center-content">
        <GlassCard style={{ maxWidth: "400px", textAlign: "center", padding: "2rem" }}>
          <MessageCircle size={48} color="var(--text-muted)" style={{ marginBottom: "1rem" }} />
          <p style={{ color: "var(--text-muted)" }}>Please log in to use chat.</p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ maxWidth: "900px", margin: "0 auto" }}>
      <div style={{ marginBottom: "1rem" }}>
        <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <MessageCircle size={26} color="#a855f7" />
          Chat
        </h2>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
          {isUser
            ? "Chat with lawyers who have accepted your consultation request."
            : "Chat with users whose consultation requests you have accepted."}
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: selectedConsultation ? "260px 1fr" : "1fr", gap: "1rem", minHeight: "480px" }}>
        {/* Conversations List */}
        <GlassCard style={{ padding: "0.5rem", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "0.75rem", borderBottom: "1px solid var(--border-color)", fontWeight: "600", fontSize: "0.9rem" }}>
            {acceptedList.length === 0 ? "No active chats" : "Conversations"}
          </div>
          <div style={{ overflowY: "auto", flex: 1 }}>
            {acceptedList.map((c) => {
              const name = isUser ? c.lawyer?.name || "Lawyer" : c.user?.name || "User";
              const sub = c.subject || "";
              const cid = c._id || c.id;
              const isSelected = (selectedConsultation?._id || selectedConsultation?.id) === cid;
              return (
                <button
                  key={cid}
                  onClick={() => setSelectedConsultation(c)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    textAlign: "left",
                    background: isSelected ? "rgba(168, 85, 247, 0.2)" : "transparent",
                    border: "none",
                    borderBottom: "1px solid var(--border-color)",
                    color: "inherit",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                    transition: "background 0.2s",
                  }}
                >
                  <div style={{ fontWeight: 500 }}>{name}</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sub}</div>
                </button>
              );
            })}
          </div>
        </GlassCard>

        {/* Chat Panel */}
        {selectedConsultation ? (
          <GlassCard style={{ display: "flex", flexDirection: "column", padding: 0, minHeight: "480px" }}>
            {/* Header */}
            <div style={{ padding: "12px 1rem", borderBottom: "1px solid var(--border-color)", display: "flex", alignItems: "center", gap: "10px" }}>
              <button
                onClick={() => setSelectedConsultation(null)}
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "4px", display: "flex" }}
                aria-label="Back to list"
              >
                <ArrowLeft size={20} />
              </button>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontWeight: 600 }}>{otherPartyName}</span>
                  {/* Online indicator */}
                  <span
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: otherOnline ? "#22c55e" : "#6b7280",
                      display: "inline-block",
                      boxShadow: otherOnline ? "0 0 6px #22c55e" : "none",
                      transition: "all 0.3s",
                    }}
                    title={otherOnline ? "Online" : "Offline"}
                  />
                </div>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  {otherTyping ? (
                    <span style={{ color: "#a855f7", fontStyle: "italic" }}>typing...</span>
                  ) : (
                    selectedConsultation.subject
                  )}
                </span>
              </div>
            </div>

            {chatError && (
              <div style={{ padding: "10px 1rem", background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "8px" }}>
                <AlertCircle size={18} />
                {chatError}
                <button onClick={() => setChatError(null)} style={{ marginLeft: "auto", background: "none", border: "none", color: "#ef4444", cursor: "pointer" }}>
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Messages */}
            <div style={{ flex: 1, overflowY: "auto", padding: "1rem", display: "flex", flexDirection: "column", gap: "10px" }}>
              {messages.length === 0 && !chatError && (
                <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", textAlign: "center", marginTop: "1rem" }}>No messages yet. Say hello! 👋</p>
              )}
              {messages.map((m) => {
                const isMe = (m.senderType === "user" && isUser) || (m.senderType === "lawyer" && isLawyer);
                return (
                  <div
                    key={m._id}
                    style={{
                      alignSelf: isMe ? "flex-end" : "flex-start",
                      maxWidth: "80%",
                      padding: m.messageType === "file" ? "8px" : "10px 14px",
                      borderRadius: "12px",
                      background: isMe ? "rgba(168, 85, 247, 0.25)" : "rgba(255,255,255,0.06)",
                      border: `1px solid ${isMe ? "rgba(168, 85, 247, 0.4)" : "var(--border-color)"}`,
                      fontSize: "0.95rem",
                    }}
                  >
                    {/* File message */}
                    {m.messageType === "file" && (
                      <FilePreview
                        fileName={m.fileName}
                        fileUrl={`${API_BASE}${m.fileUrl}`}
                        fileType={m.fileType}
                        fileSize={m.fileSize}
                      />
                    )}

                    {/* Text content */}
                    {m.content && (
                      <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", padding: m.messageType === "file" ? "4px 6px 0" : 0 }}>{m.content}</div>
                    )}

                    {/* Timestamp + status */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "4px", marginTop: "4px" }}>
                      <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      {isMe && <MessageStatus status={m.status} />}
                    </div>
                  </div>
                );
              })}

              {/* Typing indicator */}
              {otherTyping && (
                <div
                  style={{
                    alignSelf: "flex-start",
                    padding: "10px 16px",
                    borderRadius: "12px",
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid var(--border-color)",
                    display: "flex",
                    gap: "4px",
                    alignItems: "center",
                  }}
                >
                  <span className="typing-dot" style={{ animationDelay: "0ms" }} />
                  <span className="typing-dot" style={{ animationDelay: "200ms" }} />
                  <span className="typing-dot" style={{ animationDelay: "400ms" }} />
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* File preview bar */}
            {selectedFile && (
              <div style={{
                padding: "8px 1rem",
                borderTop: "1px solid var(--border-color)",
                background: "rgba(168, 85, 247, 0.08)",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}>
                <FileIcon mimeType={selectedFile.type} />
                <div style={{ flex: 1, overflow: "hidden" }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {selectedFile.name}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    {formatFileSize(selectedFile.size)}
                  </div>
                </div>
                {uploadProgress !== null ? (
                  <div style={{ width: "80px" }}>
                    <div style={{ height: "4px", background: "rgba(255,255,255,0.1)", borderRadius: "2px", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${uploadProgress}%`, background: "#a855f7", borderRadius: "2px", transition: "width 0.3s" }} />
                    </div>
                    <div style={{ fontSize: "0.7rem", textAlign: "center", color: "var(--text-muted)", marginTop: "2px" }}>{uploadProgress}%</div>
                  </div>
                ) : (
                  <>
                    <button onClick={cancelFile} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "4px" }} title="Cancel">
                      <X size={18} />
                    </button>
                    <button
                      onClick={handleFileUpload}
                      disabled={sending}
                      style={{
                        padding: "8px 16px",
                        background: "#a855f7",
                        border: "none",
                        borderRadius: "8px",
                        color: "white",
                        cursor: "pointer",
                        fontSize: "0.85rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <Send size={14} /> Upload
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Input area */}
            <div style={{ padding: "12px 1rem", borderTop: "1px solid var(--border-color)", display: "flex", gap: "8px", alignItems: "center" }}>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                style={{ display: "none" }}
              />
              <button
                onClick={handleFileSelect}
                disabled={!!chatError || uploadProgress !== null}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: chatError ? "not-allowed" : "pointer",
                  padding: "6px",
                  display: "flex",
                  borderRadius: "8px",
                  transition: "color 0.2s",
                }}
                title="Attach file (PDF, JPG, PNG, DOCX – max 10MB)"
              >
                <Paperclip size={20} />
              </button>
              <input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                placeholder="Type a message..."
                disabled={!!chatError}
                style={{
                  flex: 1,
                  padding: "12px 14px",
                  background: "rgba(0,0,0,0.2)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "10px",
                  color: "inherit",
                  fontSize: "0.95rem",
                }}
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || sending || !!chatError}
                style={{
                  padding: "12px 20px",
                  background: inputValue.trim() && !sending && !chatError ? "#a855f7" : "rgba(168, 85, 247, 0.3)",
                  border: "none",
                  borderRadius: "10px",
                  color: "white",
                  cursor: inputValue.trim() && !sending && !chatError ? "pointer" : "not-allowed",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "0.9rem",
                  transition: "background 0.2s",
                }}
              >
                <Send size={18} />
                {sending ? "..." : "Send"}
              </button>
            </div>
          </GlassCard>
        ) : (
          <GlassCard style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "480px" }}>
            <div style={{ textAlign: "center", color: "var(--text-muted)" }}>
              <MessageCircle size={48} style={{ marginBottom: "0.5rem" }} />
              <p>Select a conversation to start chatting.</p>
            </div>
          </GlassCard>
        )}
      </div>

      {/* Typing animation CSS */}
      <style>{`
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-6px); opacity: 1; }
        }
        .typing-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #a855f7;
          display: inline-block;
          animation: typingBounce 1.4s infinite;
        }
      `}</style>
    </div>
  );
};

// ─── Helper Components ───────────────────────────────────────

function MessageStatus({ status }) {
  if (status === "delivered" || status === "read") {
    return <CheckCheck size={14} color={status === "read" ? "#3b82f6" : "#9ca3af"} />;
  }
  return <Check size={14} color="#9ca3af" />;
}

function FileIcon({ mimeType }) {
  if (mimeType?.startsWith("image/")) return <Image size={20} color="#3b82f6" />;
  if (mimeType === "application/pdf") return <FileText size={20} color="#ef4444" />;
  return <File size={20} color="#f59e0b" />;
}

function FilePreview({ fileName, fileUrl, fileType, fileSize }) {
  const isImage = fileType?.startsWith("image/");

  return (
    <div style={{ borderRadius: "8px", overflow: "hidden" }}>
      {isImage ? (
        <a href={fileUrl} target="_blank" rel="noopener noreferrer">
          <img
            src={fileUrl}
            alt={fileName}
            style={{
              maxWidth: "100%",
              maxHeight: "200px",
              borderRadius: "8px",
              display: "block",
              objectFit: "cover",
            }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        </a>
      ) : (
        <a
          href={fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "10px",
            background: "rgba(0,0,0,0.15)",
            borderRadius: "8px",
            textDecoration: "none",
            color: "inherit",
          }}
        >
          <FileIcon mimeType={fileType} />
          <div style={{ flex: 1, overflow: "hidden" }}>
            <div style={{ fontSize: "0.85rem", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {fileName}
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              {formatFileSize(fileSize)}
            </div>
          </div>
          <Download size={18} color="var(--text-muted)" />
        </a>
      )}
    </div>
  );
}

function formatFileSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export default Chat;
