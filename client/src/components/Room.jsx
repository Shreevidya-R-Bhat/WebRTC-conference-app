import { useState, useEffect, useRef, useCallback } from 'react';
import { VideoTile } from './VideoTile';
import { ChatBox } from './ChatBox';
import { StatsPanel } from './StatsPanel';
import { Controls } from './Controls';
import { useWebSocket } from '../hooks/useWebSocket';
import { useWebRTC } from '../hooks/useWebRTC';
import { MEDIA_CONSTRAINTS } from '../utils/webrtcConfig';
import './Room.css';

export function Room({ roomId, username, onLeave }) {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});
  const [peers, setPeers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [showStats, setShowStats] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [activePeerConnection, setActivePeerConnection] = useState(null);
  
  const myPeerId = useRef(`peer_${Math.random().toString(36).substring(2, 11)}`);
  const hasJoinedRef = useRef(false);

  console.log('CLIENT myPeerId.current', myPeerId.current);

  const { sendMessage, onMessage } = useWebSocket('ws://localhost:8080');

  // Get local media
  useEffect(() => {
    let mounted = true;
    
    navigator.mediaDevices.getUserMedia(MEDIA_CONSTRAINTS)
      .then(stream => {
        if (mounted) {
          console.log('✅ Got local stream');
          setLocalStream(stream);
        }
      })
      .catch(err => {
        console.error('❌ Media error:', err);
        alert('Cannot access camera/microphone');
      });

    return () => {
      mounted = false;
      if (localStream) {
        localStream.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // Callback to handle remote streams
  const handleRemoteStream = useCallback((peerId, stream) => {
    console.log('📺 Adding remote stream to UI for:', peerId);
    setRemoteStreams(prev => {
      const updated = { ...prev, [peerId]: stream };
      console.log('   Total remote streams:', Object.keys(updated).length);
      return updated;
    });
  }, []);

  const {
    peerConnections,
    createOffer,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    removePeer,
    closeAllConnections
  } = useWebRTC(localStream, sendMessage, myPeerId.current, handleRemoteStream);



  // Handle WebSocket messages
  useEffect(() => {
    return onMessage((data) => {
      console.log('📨', data.type);

      switch (data.type) {
        case 'room-joined':
          console.log('👥', data.peers.length, 'peers in room');
          data.peers.forEach(peer => createOffer(peer.peerId));
          break;

        case 'peer-joined':
          console.log('👤 New:', data.username);
          setPeers(prev => [...prev, data]);
          break;

        case 'offer':
          handleOffer(data.offer, data.senderPeerId);
          break;

        case 'answer':
          handleAnswer(data.answer, data.senderPeerId);
          break;

        case 'ice-candidate':
          handleIceCandidate(data.candidate, data.senderPeerId);
          break;

        case 'peer-left':
          console.log('👋', data.peerId);
          removePeer(data.peerId);
          setRemoteStreams(prev => {
            const updated = { ...prev };
            delete updated[data.peerId];
            return updated;
          });
          setPeers(prev => prev.filter(p => p.peerId !== data.peerId));
          break;

        case 'chat':
          console.log('💬', data.username, ':', data.message);
          setMessages(prev => [...prev, data]);
          break;
      }
    });
  }, [onMessage, createOffer, handleOffer, handleAnswer, handleIceCandidate, removePeer]);

  // Join room once when ready
  useEffect(() => {
    if (localStream && sendMessage && !hasJoinedRef.current) {
      // Wait a bit for WebSocket to be ready
      const timer = setTimeout(() => {
        console.log('🚀 Joining room:', roomId);
        const success = sendMessage({
          type: 'join-room',
          roomId,
          peerId: myPeerId.current,
          username
        });
        
        if (success) {
          hasJoinedRef.current = true;
          console.log('✅ Join message sent');
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [localStream, sendMessage, roomId, username]);


  const toggleAudio = () => {
    if (localStream) {
      const track = localStream.getAudioTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        setIsAudioEnabled(track.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const track = localStream.getVideoTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        setIsVideoEnabled(track.enabled);
      }
    }
  };

  const handleLeaveRoom = () => {
    sendMessage({ type: 'leave', peerId: myPeerId.current, roomId });
    closeAllConnections();
    if (localStream) {
      localStream.getTracks().forEach(t => t.stop());
    }
    onLeave();
  };

  const sendChatMessage = (message) => {
    sendMessage({
      type: 'chat',
      roomId,
      message,
      username,
      senderPeerId: myPeerId.current
    });
  };

  return (
    <div className="room-container">
      <div className="room-header">
        <h2>Room: {roomId}</h2>
        <button onClick={() => setShowStats(!showStats)}>
          {showStats ? '❌ Hide Stats' : '📊 Show Stats'}
        </button>
      </div>

      <div className="video-grid">
        {/* Your own video - always shows */}
        <VideoTile
          stream={localStream}
          username={username + " (You)"}
          isLocal={true}
          isMuted={!isAudioEnabled}
        />
        
        {/* Other users' videos - dynamically added */}
        {Object.entries(remoteStreams).map(([peerId, stream]) => {
          const peer = peers.find(p => p.peerId === peerId);
          console.log('Rendering remote video for:', peerId, peer?.username);
          return (
            <VideoTile
              key={peerId}
              stream={stream}
              username={peer?.username || 'Guest'}
              isLocal={false}
              isMuted={false}
            />
          );
        })}
      </div>


      <Controls
        isAudioEnabled={isAudioEnabled}
        isVideoEnabled={isVideoEnabled}
        onToggleAudio={toggleAudio}
        onToggleVideo={toggleVideo}
        onLeave={handleLeaveRoom}
      />

      <ChatBox
        messages={messages}
        onSendMessage={sendChatMessage}
        username={username}
      />

      {showStats && <StatsPanel peerConnection={activePeerConnection} />}
    </div>
  );
}
