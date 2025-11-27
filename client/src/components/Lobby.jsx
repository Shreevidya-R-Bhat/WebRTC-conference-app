import { useState } from 'react';
import './Lobby.css';

export function Lobby({ onJoinRoom }) {
  const [roomId, setRoomId] = useState('');
  const [username, setUsername] = useState('');

  const handleJoin = (e) => {
    e.preventDefault();
    if (roomId.trim() && username.trim()) {
      onJoinRoom(roomId.trim(), username.trim());
    }
  };

  const generateRoomId = () => {
    const id = Math.random().toString(36).substring(2, 9);
    setRoomId(id);
  };

  return (
    <div className="lobby-container">
      <div className="lobby-card">
        <h1>🎥 WebRTC Conference</h1>
        <form onSubmit={handleJoin}>
          <input
            type="text"
            placeholder="Enter your name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            required
          />
          <button type="button" onClick={generateRoomId}>
            Generate Room ID
          </button>
          <button type="submit" className="join-btn">
            Join Room
          </button>
        </form>
      </div>
    </div>
  );
}
