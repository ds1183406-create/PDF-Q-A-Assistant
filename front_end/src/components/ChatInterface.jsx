import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, FileText, Table, Image, Paperclip, EyeOff, Eye } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import axios from 'axios'

const ChatInterface = ({ onFileUpload, uploadedFile }) => {
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showSources, setShowSources] = useState(false)
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleFileUpload = async (file) => {
    if (!file || file.size > 20 * 1024 * 1024) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await axios.post('http://localhost:8000/upload?session_id=default', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      onFileUpload(response.data)
      
      const uploadMessage = {
        id: Date.now(),
        type: 'system',
        content: `📄 Uploaded: ${file.name} (${response.data.pages} pages)`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, uploadMessage])
    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      setUploading(false)
    }
  }

  const onDrop = (acceptedFiles) => {
    if (acceptedFiles[0]) handleFileUpload(acceptedFiles[0])
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false,
    noClick: true
  })

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      const response = await axios.post('http://localhost:8000/chat', {
        message: inputMessage,
        session_id: 'default'
      })

      const aiMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: response.data.response,
        sources: response.data.sources,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const renderMarkdown = (text) => {
    return text
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '<em>$1</em>')
      .replace(/^\* (.+)$/gm, '• $1')
      .replace(/\n/g, '<br>')
  }

  const getSourceIcon = (type) => {
    switch (type) {
      case 'table': return <Table size={14} />
      case 'image': return <Image size={14} />
      default: return <FileText size={14} />
    }
  }

  return (
    <div className="chat-interface" {...getRootProps()}>
      <input {...getInputProps()} />
      
      <div className="chat-header">
        <h1>PDF Q&A Assistant</h1>
      </div>
      
      <div className="messages-container">
        {messages.length === 0 && (
          <div className="welcome-message">
            <div className="welcome-icon">
              <Bot size={48} />
            </div>
            <h2>How can I help you today?</h2>
            <p>Upload a PDF document and ask me questions about its content</p>
            
            <div className="upload-suggestion">
              <FileText size={20} />
              <span>Drag and drop a PDF file here or use the attachment button</span>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id} className={`message ${message.type}`}>
            <div className="message-avatar">
              {message.type === 'user' ? <User size={20} /> : <Bot size={20} />}
            </div>
            
            <div className="message-content">
              <div className="message-text">
                {message.type === 'assistant' ? 
                  <div dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }} /> :
                  message.content
                }
              </div>
              
              {message.sources && message.sources.length > 0 && showSources && (
                <div className="sources">
                  <div className="sources-header">
                    <h4>Sources:</h4>
                    <button 
                      className="toggle-sources-btn"
                      onClick={() => setShowSources(!showSources)}
                      title="Hide sources"
                    >
                      <EyeOff size={16} />
                    </button>
                  </div>
                  {message.sources.map((source, index) => (
                    <div key={index} className="source-item">
                      <div className="source-header">
                        {getSourceIcon(source.type)}
                        <span>Page {source.page} • {source.type}</span>
                      </div>
                      <div className="source-content">
                        {source.content}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {message.sources && message.sources.length > 0 && !showSources && (
                <div className="sources-hidden">
                  <button 
                    className="show-sources-btn"
                    onClick={() => setShowSources(true)}
                  >
                    <Eye size={16} />
                    <span>Show sources ({message.sources.length})</span>
                  </button>
                </div>
              )}
              
              <div className="message-time">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="message assistant loading">
            <div className="message-avatar">
              <Bot size={20} />
            </div>
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="input-container">
        <div className="input-wrapper">
          <button 
            className="attach-button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Paperclip size={20} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={(e) => e.target.files[0] && handleFileUpload(e.target.files[0])}
            style={{ display: 'none' }}
          />
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={uploadedFile ? "Ask a question about your PDF..." : "Upload a PDF first, then ask questions..."}
            disabled={isLoading || uploading}
          />
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading || !uploadedFile}
            className="send-button"
          >
            <Send size={18} />
          </button>
        </div>
        {isDragActive && (
          <div className="drag-overlay">
            <FileText size={48} />
            <p>Drop your PDF here</p>
          </div>
        )}
      </div>

      <style>{`
        .chat-interface {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background: white;
          position: relative;
        }

        .chat-header {
          padding: 1rem 2rem;
          border-bottom: 1px solid #e5e5e5;
          background: white;
        }

        .chat-header h1 {
          font-size: 1.5rem;
          font-weight: 600;
          color: #333;
        }

        .messages-container {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .welcome-message {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 4rem 2rem;
          color: #666;
        }

        .welcome-icon {
          margin-bottom: 1rem;
          color: #10a37f;
        }

        .welcome-message h2 {
          font-size: 2rem;
          font-weight: 600;
          color: #333;
          margin-bottom: 0.5rem;
        }

        .welcome-message p {
          font-size: 1.1rem;
          margin-bottom: 2rem;
        }

        .upload-suggestion {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem 1.5rem;
          background: #f7f7f8;
          border-radius: 8px;
          color: #666;
          font-size: 0.9rem;
        }

        .chat-bubble {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          max-width: 80%;
        }

        .user-bubble {
          align-self: flex-end;
          flex-direction: row-reverse;
        }

        .bot-bubble {
          align-self: flex-start;
        }

        .chat-bubble .avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .user-bubble .avatar {
          background: #3498db;
        }

        .bot-bubble .avatar {
          background: #95a5a6;
        }

        .chat-bubble .message-text {
          background: #3498db;
          color: white;
          padding: 0.75rem 1rem;
          border-radius: 18px;
          font-size: 0.9rem;
        }

        .bot-bubble .message-text {
          background: #ecf0f1;
          color: #2c3e50;
        }

        .simple-text {
          color: #7f8c8d;
          font-size: 0.9rem;
          margin-left: 1rem;
        }

        .message {
          display: flex;
          gap: 0.75rem;
          max-width: 85%;
        }

        .message.user {
          align-self: flex-end;
          flex-direction: row-reverse;
        }

        .message-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .message.user .message-avatar {
          background: #667eea;
          color: white;
        }

        .message.assistant .message-avatar {
          background: #f1f5f9;
          color: #64748b;
        }

        .message-content {
          flex: 1;
        }

        .message-text {
          background: #f8fafc;
          padding: 0.75rem 1rem;
          border-radius: 12px;
          line-height: 1.5;
        }

        .message-text ul {
          margin: 0.5rem 0;
          padding-left: 1.2rem;
        }

        .message-text li {
          margin-bottom: 0.3rem;
        }

        .message-text strong {
          font-weight: 600;
          color: #2d3748;
        }

        .message.user .message-text {
          background: #667eea;
          color: white;
        }

        .sources {
          margin-top: 0.75rem;
          padding: 0.75rem;
          background: #f8f9fa;
          border-radius: 8px;
          border: 1px solid #e9ecef;
        }

        .sources-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.5rem;
        }

        .sources h4 {
          margin: 0;
          font-size: 0.875rem;
          color: #495057;
          font-weight: 600;
        }

        .toggle-sources-btn {
          background: none;
          border: none;
          color: #6c757d;
          cursor: pointer;
          padding: 0.25rem;
          border-radius: 4px;
          display: flex;
          align-items: center;
        }

        .toggle-sources-btn:hover {
          background: #e9ecef;
          color: #495057;
        }

        .sources-hidden {
          margin-top: 0.75rem;
        }

        .show-sources-btn {
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          color: #6c757d;
          cursor: pointer;
          padding: 0.5rem 0.75rem;
          border-radius: 6px;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          transition: all 0.2s;
        }

        .show-sources-btn:hover {
          background: #e9ecef;
          border-color: #adb5bd;
        }

        .source-item {
          margin-bottom: 0.5rem;
          padding: 0.5rem;
          background: white;
          border-radius: 6px;
          border: 1px solid #dee2e6;
        }

        .source-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.75rem;
          color: #6c757d;
          font-weight: 500;
          margin-bottom: 0.25rem;
        }

        .source-content {
          font-size: 0.875rem;
          color: #495057;
          line-height: 1.4;
        }

        .message-time {
          font-size: 0.75rem;
          color: #94a3b8;
          margin-top: 0.5rem;
        }

        .message.user .message-time {
          text-align: right;
        }

        .typing-indicator {
          display: flex;
          gap: 4px;
          padding: 1rem;
        }

        .typing-indicator span {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #cbd5e0;
          animation: typing 1.4s infinite ease-in-out;
        }

        .typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
        .typing-indicator span:nth-child(2) { animation-delay: -0.16s; }

        @keyframes typing {
          0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
          40% { transform: scale(1); opacity: 1; }
        }

        .input-container {
          padding: 1rem 2rem 2rem;
          background: white;
          position: relative;
        }

        .input-container::before {
          content: "";
          display: block;
          font-weight: 600;
          color: #2c3e50;
          margin-bottom: 1rem;
          font-size: 1.1rem;
        }

        .answers-section {
          background: white;
          padding: 1rem;
          margin-bottom: 1rem;
        }

        .sources-section {
          background: white;
          padding: 1rem;
        }

        .section-title {
          font-weight: 600;
          color: #2c3e50;
          margin-bottom: 1rem;
          font-size: 1.1rem;
        }

        .input-wrapper {
          display: flex;
          align-items: center;
          background: #f7f7f8;
          border: 1px solid #d1d5db;
          border-radius: 12px;
          padding: 0.75rem;
          gap: 0.5rem;
          max-width: 800px;
          margin: 0 auto;
        }

        .attach-button {
          background: none;
          border: none;
          color: #666;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .attach-button:hover {
          background: #e5e5e5;
        }

        .input-wrapper input {
          flex: 1;
          border: none;
          outline: none;
          padding: 0.5rem;
          font-size: 0.95rem;
          background: transparent;
        }

        .input-wrapper input::placeholder {
          color: #bdc3c7;
        }

        .send-button {
          background: #10a37f;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 0.5rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.2s;
        }

        .send-button:hover:not(:disabled) {
          background: #0d8f6b;
        }

        .send-button:disabled {
          background: #d1d5db;
          cursor: not-allowed;
        }

        .drag-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(16, 163, 127, 0.1);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #10a37f;
          font-size: 1.2rem;
          font-weight: 600;
          z-index: 10;
        }

        .bottom-section {
          background: #f8f9fa;
          padding: 1rem;
        }

        .bottom-section ul {
          margin: 0;
          padding-left: 1.2rem;
          color: #5a6c7d;
          font-size: 0.9rem;
        }

        .bottom-section li {
          margin-bottom: 0.5rem;
        }

        .bottom-section a {
          color: #3498db;
          text-decoration: none;
        }

        @media (max-width: 768px) {
          .message {
            max-width: 95%;
          }
          
          .messages-container {
            padding: 0.75rem;
          }
          
          .input-container {
            padding: 0.75rem;
          }
        }
      `}</style>
    </div>
  )
}

export default ChatInterface