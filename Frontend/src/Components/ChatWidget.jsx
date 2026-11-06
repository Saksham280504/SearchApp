import { useState, useRef, useEffect } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import { API_BASE_URL } from "../../redux/config";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function ChatWidget() {
  const { user } = useSelector((s) => s.auth);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ message: input })
      });

      if (!res.ok) throw new Error("Failed to connect to chat agent.");

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      
      let assistantMessage = { role: "assistant", content: "" };
      setMessages(prev => [...prev, assistantMessage]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunkStr = decoder.decode(value, { stream: true });
        const lines = chunkStr.split('\n').filter(line => line.startsWith('data: '));
        
        for (const line of lines) {
          const text = line.replace('data: ', '');
          if (text.trim() === '[DONE]') break;
          
          if (text.trim().startsWith('[ERROR]')) {
            if (text.includes("Failed to connect to local Ollama agent")) {
              assistantMessage.content = "⚠️ **Offline Mode**\n\nI am currently running in offline mode because the local Ollama AI service hasn't started yet or is still setting up. Please wait for the setup to complete to use the advanced AI features.";
            } else {
              assistantMessage.content += `\n\n**Error**: ${text.replace('[ERROR]', '')}`;
            }
          } else {
            // Restore newlines that were escaped for SSE
            assistantMessage.content += text.replace(/\\n/g, "\n");
          }

          setMessages(prev => {
            const newMsgs = [...prev];
            newMsgs[newMsgs.length - 1] = { ...assistantMessage };
            return newMsgs;
          });
        }
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", content: `**Error**: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null; // Require login

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: "fixed", bottom: 30, right: 30, zIndex: 9999,
          width: 60, height: 60, borderRadius: "50%",
          background: "linear-gradient(135deg, #003087, #0a6a8b)",
          color: "#fff", border: "none", cursor: "pointer",
          boxShadow: "0 8px 30px rgba(0,48,135,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 28, transition: "transform 0.2s",
          transform: isOpen ? "scale(0)" : "scale(1)"
        }}
      >
        ✨
      </button>

      {/* Chat Panel */}
      <div style={{
        position: "fixed", bottom: 30, right: 30, zIndex: 10000,
        width: 380, height: 600, maxHeight: "80vh",
        background: "#fff", borderRadius: 20,
        boxShadow: "0 12px 40px rgba(0,0,0,0.15)",
        display: "flex", flexDirection: "column", overflow: "hidden",
        transform: isOpen ? "translateY(0) scale(1)" : "translateY(20px) scale(0.9)",
        opacity: isOpen ? 1 : 0, pointerEvents: isOpen ? "auto" : "none",
        transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        transformOrigin: "bottom right"
      }}>
        
        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, #003087, #0a6a8b)",
          padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between",
          color: "#fff"
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
              <span>✨</span> SearchApp Agent
            </h3>
            <p style={{ margin: "4px 0 0", fontSize: 12, opacity: 0.8 }}>Powered by Ollama RAG</p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            style={{
              background: "rgba(255,255,255,0.2)", border: "none",
              width: 28, height: 28, borderRadius: "50%",
              color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", fontSize: 18
            }}
          >
            ×
          </button>
        </div>

        {/* Message Area */}
        <div style={{ flex: 1, overflowY: "auto", padding: 20, background: "#f8fafc", display: "flex", flexDirection: "column", gap: 16 }}>
          {messages.length === 0 ? (
            <div style={{ textAlign: "center", color: "#64748b", margin: "auto" }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>👋</div>
              <p style={{ margin: "0 0 16px", fontWeight: 600 }}>Hello {user.name}!</p>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5 }}>
                I can answer questions based on the uploaded compound datasets. Try asking:
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16 }}>
                {[
                  "What compounds were found at SBW1?",
                  "Which station has the highest caffeine levels?",
                  "Tell me about dataset 'Varanasi HRMS'."
                ].map(q => (
                  <button key={q} onClick={() => setInput(q)} style={{
                    background: "#fff", border: "1px solid #e2e8f0", padding: "10px 14px",
                    borderRadius: 12, fontSize: 12, color: "#0f172a", textAlign: "left", cursor: "pointer",
                    transition: "border-color 0.2s"
                  }}>
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: m.role === "user" ? "flex-end" : "flex-start" }}>
                <div className="markdown-body" style={{
                  maxWidth: "85%", padding: "12px 16px", borderRadius: 16,
                  borderBottomRightRadius: m.role === "user" ? 4 : 16,
                  borderBottomLeftRadius: m.role === "assistant" ? 4 : 16,
                  background: m.role === "user" ? "linear-gradient(135deg, #003087, #0a6a8b)" : "#f8fafc",
                  color: m.role === "user" ? "#fff" : "#1e293b",
                  boxShadow: m.role === "assistant" ? "0 4px 12px rgba(0,0,0,0.05)" : "none",
                  border: m.role === "assistant" ? "1px solid #e2e8f0" : "none",
                  fontSize: 14, lineHeight: 1.6,
                  wordBreak: "break-word"
                }}>
                  {m.role === "user" ? (
                    m.content
                  ) : (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {m.content}
                    </ReactMarkdown>
                  )}
                </div>
              </div>
            ))
          )}
          {loading && (
            <div style={{ display: "flex", alignItems: "flex-start" }}>
              <div style={{ padding: "12px 16px", borderRadius: 16, borderBottomLeftRadius: 4, background: "#fff", border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", gap: 4 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#94a3b8", animation: "bounce 1.4s infinite ease-in-out both" }} />
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#94a3b8", animation: "bounce 1.4s infinite ease-in-out both", animationDelay: "0.16s" }} />
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#94a3b8", animation: "bounce 1.4s infinite ease-in-out both", animationDelay: "0.32s" }} />
                </div>
                <style>{`@keyframes bounce { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }`}</style>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div style={{ padding: 16, background: "#fff", borderTop: "1px solid #e2e8f0" }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8 }}>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask a question..."
              disabled={loading}
              style={{
                flex: 1, padding: "12px 16px", borderRadius: 24,
                border: "1px solid #e2e8f0", background: "#f8fafc",
                fontSize: 14, outline: "none"
              }}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              style={{
                width: 44, height: 44, borderRadius: "50%",
                background: input.trim() && !loading ? "#003087" : "#cbd5e1",
                color: "#fff", border: "none", display: "flex", alignItems: "center", justifyContent: "center",
                cursor: input.trim() && !loading ? "pointer" : "default", transition: "background 0.2s"
              }}
            >
              ↑
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
