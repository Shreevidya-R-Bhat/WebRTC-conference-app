const { v4: uuidv4 } = require('uuid');
const { broadcastToRoom, clients } = require('./server');

function handleSignaling(ws, data, clientsMap, wss) {
  const { type } = data;

  switch (type) {
    case 'join-room':
      handleJoinRoom(ws, data, clientsMap);
      break;
    
    case 'offer':
      handleOffer(data, clientsMap);
      break;
    
    case 'answer':
      handleAnswer(data, clientsMap);
      break;
    
    case 'ice-candidate':
      handleIceCandidate(data, clientsMap);
      break;
    
    case 'chat':
      handleChat(data, clientsMap);
      break;
    
    case 'leave':
      handleLeave(data, clientsMap);
      break;
    
    default:
      console.log('Unknown message type:', type);
  }
}

function handleJoinRoom(ws, data, clientsMap) {
  const { roomId, peerId, username } = data;
  
  // Store client info
  clientsMap.set(peerId, {
    ws,
    roomId,
    peerId,
    username: username || 'Anonymous'
  });

  // Get existing peers in room
  const existingPeers = [];
  clientsMap.forEach((clientData, clientId) => {
    if (clientData.roomId === roomId && clientData.peerId !== peerId) {
      existingPeers.push({
        peerId: clientData.peerId,
        username: clientData.username
      });
    }
  });

  // Send existing peers to new user
  ws.send(JSON.stringify({
    type: 'room-joined',
    peers: existingPeers,
    yourPeerId: peerId
  }));

  // Notify existing peers about new peer
  broadcastToRoom(roomId, {
    type: 'peer-joined',
    peerId: peerId,
    username: username || 'Anonymous'
  }, peerId);

  console.log(`Peer ${peerId} joined room ${roomId}`);
}

function handleOffer(data, clientsMap) {
  const { targetPeerId, offer, senderPeerId } = data;
  
  const targetClient = clientsMap.get(targetPeerId);
  if (targetClient && targetClient.ws.readyState === 1) {
    targetClient.ws.send(JSON.stringify({
      type: 'offer',
      offer,
      senderPeerId
    }));
  }
}

function handleAnswer(data, clientsMap) {
  const { targetPeerId, answer, senderPeerId } = data;
  
  const targetClient = clientsMap.get(targetPeerId);
  if (targetClient && targetClient.ws.readyState === 1) {
    targetClient.ws.send(JSON.stringify({
      type: 'answer',
      answer,
      senderPeerId
    }));
  }
}

function handleIceCandidate(data, clientsMap) {
  const { targetPeerId, candidate, senderPeerId } = data;
  
  const targetClient = clientsMap.get(targetPeerId);
  if (targetClient && targetClient.ws.readyState === 1) {
    targetClient.ws.send(JSON.stringify({
      type: 'ice-candidate',
      candidate,
      senderPeerId
    }));
  }
}

function handleChat(data, clientsMap) {
  const { roomId, message, senderPeerId, username } = data;
  
  // Broadcast to ALL users in the room (including sender)
  clientsMap.forEach((clientData, clientId) => {
    if (clientData.roomId === roomId && clientData.ws.readyState === 1) {
      clientData.ws.send(JSON.stringify({
        type: 'chat',
        message,
        senderPeerId,
        username,
        timestamp: Date.now()
      }));
    }
  });
}


function handleLeave(data, clientsMap) {
  const { peerId, roomId } = data;
  
  clientsMap.delete(peerId);
  
  broadcastToRoom(roomId, {
    type: 'peer-left',
    peerId
  }, peerId);
}

module.exports = { handleSignaling };
