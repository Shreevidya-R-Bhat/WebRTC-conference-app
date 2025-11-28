import { useRef, useCallback } from 'react';
import { ICE_SERVERS } from '../utils/webrtcConfig';

export function useWebRTC(localStream, sendMessage, myPeerId, onRemoteStream) {
  const peerConnections = useRef({});

  console.log('🆔 useWebRTC initialized with myPeerId:', myPeerId);

  const createPeerConnection = useCallback((peerId) => {
    console.log('🔗 Creating peer connection for:', peerId);
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    // Add local tracks
    if (localStream) {
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
        console.log('➕ Added track:', track.kind, 'to peer:', peerId);
      });
    }

    // ✅ CRITICAL FIX: Set up ontrack handler HERE, not later
    pc.ontrack = (event) => {
      console.log('🎥 RECEIVED remote stream from:', peerId);
      console.log('   Stream ID:', event.streams[0].id);
      console.log('   Track count:', event.streams[0].getTracks().length);
      
      // Call the callback to update state in Room.jsx
      if (onRemoteStream) {
        onRemoteStream(peerId, event.streams[0]);
      }
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const message = {
          type: 'ice-candidate',
          targetPeerId: peerId,
          candidate: event.candidate,
          senderPeerId: myPeerId
        };
        
        console.log('🧊 SENDING ICE candidate:', message);
        console.log('   senderPeerId:', message.senderPeerId);
        
        sendMessage(message);
      }
    };

    // Handle connection state
    pc.onconnectionstatechange = () => {
      console.log(`🔄 Connection with ${peerId}:`, pc.connectionState);
    };

    peerConnections.current[peerId] = pc;
    return pc;
  }, [localStream, sendMessage, myPeerId, onRemoteStream]);

  const createOffer = useCallback(async (peerId) => {
    console.log('📞 Creating offer for:', peerId);
    console.log('   My peerId:', myPeerId);
    
    const pc = createPeerConnection(peerId);
    
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      const message = {
        type: 'offer',
        targetPeerId: peerId,
        offer: offer,
        senderPeerId: myPeerId
      };
      
      console.log('📤 SENDING offer:', message);
      console.log('   senderPeerId:', message.senderPeerId);
      
      sendMessage(message);
    } catch (error) {
      console.error('❌ Error creating offer:', error);
    }
  }, [createPeerConnection, sendMessage, myPeerId]);

  const handleOffer = useCallback(async (offer, senderPeerId) => {
    console.log('📥 Handling offer from:', senderPeerId);
    console.log('   My peerId:', myPeerId);
    
    const pc = createPeerConnection(senderPeerId);
    
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      
      const message = {
        type: 'answer',
        targetPeerId: senderPeerId,
        answer: answer,
        senderPeerId: myPeerId
      };
      
      console.log('📤 SENDING answer:', message);
      console.log('   senderPeerId:', message.senderPeerId);
      
      sendMessage(message);
    } catch (error) {
      console.error('❌ Error handling offer:', error);
    }
  }, [createPeerConnection, sendMessage, myPeerId]);

  const handleAnswer = useCallback(async (answer, senderPeerId) => {
    console.log('📥 Handling answer from:', senderPeerId);
    const pc = peerConnections.current[senderPeerId];
    if (pc) {
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        console.log('✅ Answer applied');
      } catch (error) {
        console.error('❌ Error handling answer:', error);
      }
    } else {
      console.error('❌ No peer connection found for:', senderPeerId);
    }
  }, []);

  const handleIceCandidate = useCallback(async (candidate, senderPeerId) => {
    console.log('🧊 Handling ICE candidate from:', senderPeerId);
    const pc = peerConnections.current[senderPeerId];
    if (pc) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
        console.log('✅ ICE candidate added');
      } catch (error) {
        console.error('❌ Error adding ICE candidate:', error);
      }
    } else {
      console.error('❌ No peer connection found for:', senderPeerId);
    }
  }, []);

  const removePeer = useCallback((peerId) => {
    console.log('🗑️ Removing peer:', peerId);
    const pc = peerConnections.current[peerId];
    if (pc) {
      pc.close();
      delete peerConnections.current[peerId];
    }
  }, []);

  const closeAllConnections = useCallback(() => {
    console.log('🛑 Closing all connections');
    Object.keys(peerConnections.current).forEach(peerId => {
      removePeer(peerId);
    });
  }, [removePeer]);

  return {
    peerConnections: peerConnections.current,
    createOffer,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    removePeer,
    closeAllConnections
  };
}
