export function parseStats(stats) {
  const report = {
    timestamp: new Date().toISOString(),
    inbound: {},
    outbound: {},
    connection: {}
  };

  stats.forEach(stat => {
    // Inbound RTP (receiving)
    if (stat.type === 'inbound-rtp' && stat.kind === 'video') {
      report.inbound = {
        bytesReceived: stat.bytesReceived,
        packetsReceived: stat.packetsReceived,
        packetsLost: stat.packetsLost,
        jitter: stat.jitter,
        frameWidth: stat.frameWidth,
        frameHeight: stat.frameHeight,
        framesPerSecond: stat.framesPerSecond,
        bitrate: calculateBitrate(stat)
      };
    }

    // Outbound RTP (sending)
    if (stat.type === 'outbound-rtp' && stat.kind === 'video') {
      report.outbound = {
        bytesSent: stat.bytesSent,
        packetsSent: stat.packetsSent,
        frameWidth: stat.frameWidth,
        frameHeight: stat.frameHeight,
        framesPerSecond: stat.framesPerSecond,
        bitrate: calculateBitrate(stat)
      };
    }

    // Candidate pair (connection quality)
    if (stat.type === 'candidate-pair' && stat.state === 'succeeded') {
      report.connection = {
        currentRTT: stat.currentRoundTripTime,
        availableOutgoingBitrate: stat.availableOutgoingBitrate,
        availableIncomingBitrate: stat.availableIncomingBitrate
      };
    }

    // Codec info
    if (stat.type === 'codec') {
      report.codec = {
        mimeType: stat.mimeType,
        clockRate: stat.clockRate,
        payloadType: stat.payloadType
      };
    }
  });

  return report;
}

function calculateBitrate(stat) {
  if (!stat.timestamp) return 0;
  
  // This requires storing previous stats - simplified version
  const bytes = stat.bytesReceived || stat.bytesSent || 0;
  return Math.round((bytes * 8) / 1000); // kbps
}

export function exportToCSV(statsArray) {
  const headers = [
    'Timestamp',
    'Inbound Bitrate (kbps)',
    'Outbound Bitrate (kbps)',
    'RTT (ms)',
    'Packets Lost',
    'Jitter',
    'Resolution',
    'FPS',
    'Codec'
  ];

  const rows = statsArray.map(stat => [
    stat.timestamp,
    stat.inbound.bitrate || 0,
    stat.outbound.bitrate || 0,
    (stat.connection.currentRTT * 1000).toFixed(2),
    stat.inbound.packetsLost || 0,
    stat.inbound.jitter || 0,
    `${stat.inbound.frameWidth}x${stat.inbound.frameHeight}`,
    stat.inbound.framesPerSecond || 0,
    stat.codec?.mimeType || 'N/A'
  ]);

  return [headers, ...rows].map(row => row.join(',')).join('\n');
}
