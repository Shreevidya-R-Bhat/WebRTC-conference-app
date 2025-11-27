import './Controls.css';

export function Controls({
  isAudioEnabled,
  isVideoEnabled,
  onToggleAudio,
  onToggleVideo,
  onLeave
}) {
  return (
    <div className="controls">
      <button
        onClick={onToggleAudio}
        className={isAudioEnabled ? 'active' : 'inactive'}
      >
        {isAudioEnabled ? '🎤 Mute' : '🔇 Unmute'}
      </button>
      <button
        onClick={onToggleVideo}
        className={isVideoEnabled ? 'active' : 'inactive'}
      >
        {isVideoEnabled ? '📹 Stop Video' : '📷 Start Video'}
      </button>
      <button onClick={onLeave} className="leave-btn">
        📞 Leave
      </button>
    </div>
  );
}
