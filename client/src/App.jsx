import { useState } from 'react';
import { Lobby } from './components/Lobby';
import { Room } from './components/Room';
import './App.css';

function App() {
  const [joined, setJoined] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [username, setUsername] = useState('');

  const handleJoinRoom = (room, name) => {
    setRoomId(room);
    setUsername(name);
    setJoined(true);
  };

  const handleLeave = () => {
    setJoined(false);
    setRoomId('');
    setUsername('');
  };

  return (
    <div className="app">
      {!joined ? (
        <Lobby onJoinRoom={handleJoinRoom} />
      ) : (
        <Room
          roomId={roomId}
          username={username}
          onLeave={handleLeave}
        />
      )}
    </div>
  );
}

export default App;
