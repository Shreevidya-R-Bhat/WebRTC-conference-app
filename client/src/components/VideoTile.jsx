import { useEffect, useRef } from 'react';
import './VideoTile.css';

export function VideoTile({ stream, username, isLocal, isMuted }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className={`video-tile ${isLocal ? 'local' : 'remote'}`}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        className="video-element"
      />
      <div className="video-label">
        {isLocal ? `${username} (You)` : username || 'Guest'}
        {isMuted && ' 🔇'}
      </div>
    </div>
  );
}
