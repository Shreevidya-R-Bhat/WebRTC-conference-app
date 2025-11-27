import { useStats } from '../hooks/useStats';
import { exportToCSV } from '../utils/statsParser';
import './StatsPanel.css';

export function StatsPanel({ peerConnection, onClose }) {
  const { stats, statsHistory, exportStats } = useStats(peerConnection, true);

  const downloadCSV = () => {
    const csv = exportToCSV(statsHistory);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `webrtc-stats-${Date.now()}.csv`;
    a.click();
  };

  const downloadJSON = () => {
    const { json } = exportStats();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `webrtc-stats-${Date.now()}.json`;
    a.click();
  };

  if (!peerConnection) {
    return (
      <div className="stats-panel">
        <div className="stats-header">
          <h3>📊 WebRTC Statistics</h3>
          {onClose && <button onClick={onClose} className="close-btn">✕</button>}
        </div>
        <div className="stats-empty">
          <p>⏳ Waiting for peer connection...</p>
          <small>Connect with another user to see stats</small>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="stats-panel">
        <div className="stats-header">
          <h3>📊 WebRTC Statistics</h3>
          {onClose && <button onClick={onClose} className="close-btn">✕</button>}
        </div>
        <div className="stats-empty">
          <p>⏳ Collecting stats...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="stats-panel">
      <div className="stats-header">
        <h3>📊 WebRTC Statistics</h3>
        {onClose && <button onClick={onClose} className="close-btn">✕</button>}
      </div>
      
      <div className="stats-section">
        <h4>📥 Inbound (Receiving)</h4>
        <p><strong>Bitrate:</strong> {stats.inbound.bitrate || 0} kbps</p>
        <p><strong>Packets Lost:</strong> {stats.inbound.packetsLost || 0}</p>
        <p><strong>Jitter:</strong> {stats.inbound.jitter?.toFixed(3) || 0} ms</p>
        <p><strong>Resolution:</strong> {stats.inbound.frameWidth || 0}x{stats.inbound.frameHeight || 0}</p>
        <p><strong>FPS:</strong> {stats.inbound.framesPerSecond || 0}</p>
      </div>

      <div className="stats-section">
        <h4>📤 Outbound (Sending)</h4>
        <p><strong>Bitrate:</strong> {stats.outbound.bitrate || 0} kbps</p>
        <p><strong>Resolution:</strong> {stats.outbound.frameWidth || 0}x{stats.outbound.frameHeight || 0}</p>
        <p><strong>FPS:</strong> {stats.outbound.framesPerSecond || 0}</p>
      </div>

      <div className="stats-section">
        <h4>🔗 Connection</h4>
        <p><strong>RTT:</strong> {stats.connection.currentRTT ? (stats.connection.currentRTT * 1000).toFixed(2) : 0} ms</p>
      </div>

      <div className="stats-section">
        <h4>🎬 Codec</h4>
        <p>{stats.codec?.mimeType || 'N/A'}</p>
      </div>

      <div className="stats-actions">
        <button onClick={downloadJSON}>💾 JSON</button>
        <button onClick={downloadCSV}>📄 CSV</button>
      </div>
      
      <div className="stats-info">
        <small>📊 {statsHistory.length} samples collected</small>
      </div>
    </div>
  );
}
