import { useState, useRef, useEffect } from 'react';
import './ChatBox.css';

export function ChatBox({ messages, onSendMessage, username }) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (input.trim()) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  return (
    <div className="chat-box">
      <div className="chat-header">💬 Chat</div>
      <div className="chat-messages">
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: '#999', marginTop: '20px' }}>
            <p>No messages yet</p>
            <small>Send a message to start chatting</small>
          </div>
        )}
        {messages.map((msg, idx) => (
          <div key={idx} className="chat-message">
            <strong>{msg.username}:</strong>
            <div style={{ marginTop: '4px', color: '#1a1a1a', fontWeight: '500' }}>
              {msg.message}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSend} className="chat-input-form">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}
