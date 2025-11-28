const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Store clients: WebSocket -> client info
const clients = new Map();

console.log('🚀 Starting WebRTC signaling server...');

wss.on('connection', (ws) => {
  console.log('🔌 New WebSocket connection');

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log(`📨 ${data.type} from ${data.peerId || 'unknown'}`);
      handleMessage(ws, data);
    } catch (error) {
      console.error('❌ Parse error:', error.message);
    }
  });

  ws.on('close', () => {
    const client = clients.get(ws);
    if (client) {
      console.log(`👋 ${client.username} left room ${client.roomId}`);
      
      // Notify others
      broadcastToRoom(client.roomId, {
        type: 'peer-left',
        peerId: client.peerId
      }, client.peerId);
      
      clients.delete(ws);
    }
    console.log(`📊 Active: ${clients.size}`);
  });

  ws.on('error', (err) => {
    console.error('❌ WebSocket error:', err.message);
  });
});

function handleMessage(ws, data) {
  // LOG THE SENDER PROPERLY
  const sender = data.senderPeerId || data.peerId || 'unknown';
  console.log(`📨 ${data.type} from ${sender}`);
  
  switch (data.type) {
    case 'join-room':
      const { roomId, peerId, username } = data;
      
      // Store client
      clients.set(ws, { peerId, roomId, username });
      console.log(`✅ ${username} joined ${roomId}`);
      
      // Get existing peers
      const peers = [];
      clients.forEach((client, clientWs) => {
        if (client.roomId === roomId && client.peerId !== peerId) {
          peers.push({ peerId: client.peerId, username: client.username });
        }
      });
      
      console.log(`   👥 ${peers.length} peers already in room`);
      
      // Send existing peers to new user
      ws.send(JSON.stringify({
        type: 'room-joined',
        peers,
        yourPeerId: peerId
      }));
      
      // Notify others about new peer
      broadcastToRoom(roomId, {
        type: 'peer-joined',
        peerId,
        username
      }, peerId);
      break;

    case 'offer':
      console.log(`   📞 Forwarding offer from ${data.senderPeerId} to ${data.targetPeerId}`);
      forwardTo(data.targetPeerId, {
        type: 'offer',
        offer: data.offer,
        senderPeerId: data.senderPeerId
      });
      break;

    case 'answer':
      console.log(`   ✅ Forwarding answer from ${data.senderPeerId} to ${data.targetPeerId}`);
      forwardTo(data.targetPeerId, {
        type: 'answer',
        answer: data.answer,
        senderPeerId: data.senderPeerId
      });
      break;

    case 'ice-candidate':
      console.log(`   🧊 Forwarding ICE from ${data.senderPeerId} to ${data.targetPeerId}`);
      forwardTo(data.targetPeerId, {
        type: 'ice-candidate',
        candidate: data.candidate,
        senderPeerId: data.senderPeerId
      });
      break;

    case 'chat':
      console.log(`💬 ${data.username}: ${data.message}`);
      broadcastToRoom(data.roomId, {
        type: 'chat',
        message: data.message,
        username: data.username,
        senderPeerId: data.senderPeerId,
        timestamp: Date.now()
      });
      break;
  }
}


function forwardTo(peerId, message) {
  clients.forEach((client, ws) => {
    if (client.peerId === peerId && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  });
}

function broadcastToRoom(roomId, message, excludePeerId = null) {
  let count = 0;
  clients.forEach((client, ws) => {
    if (client.roomId === roomId && 
        client.peerId !== excludePeerId && 
        ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
      count++;
    }
  });
  if (count > 0) console.log(`   📢 Sent to ${count} peers`);
}

app.get('/health', (req, res) => {
  res.json({ status: 'ok', connections: clients.size });
});

const PORT = 8080;
server.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
