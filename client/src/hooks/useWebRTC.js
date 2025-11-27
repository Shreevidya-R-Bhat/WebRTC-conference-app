import { useRef, useCallback } from 'react';
import { ICE_SERVERS } from '../utils/webrtcConfig';

export function useWebRTC(localStream, sendMessage, myPeerId) {
  const peerConnections = useRef({});

  const createPeerConnection = useCallback((peerId) => {
    console.log('🔗 Creating peer connection for:', peerId);
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    // Add local tracks
    if (localStream) {
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
        console.log('➕ Added local track:', track.kind, 'to peer:', peerId);
      });
    }

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('🧊 Sending ICE candidate to:', peerId);
        sendMessage({
          type: 'ice-candidate',
          targetPeerId: peerId,
          candidate: event.candidate,
          senderPeerId: myPeerId
        });
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      console.log(`🔄 Connection state with ${peerId}:`, pc.connectionState);
    };

    // Handle ICE connection state
    pc.oniceconnectionstatechange = () => {
      console.log(`❄️ ICE state with ${peerId}:`, pc.iceConnectionState);
    };

    peerConnections.current[peerId] = pc;
    return pc;
  }, [localStream, sendMessage, myPeerId]);

  const createOffer = useCallback(async (peerId) => {
    console.log('📞 Creating offer for:', peerId);
    const pc = createPeerConnection(peerId);
    
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      console.log('📤 Sending offer to:', peerId);
      sendMessage({
        type: 'offer',
        targetPeerId: peerId,
        offer: offer,
        senderPeerId: myPeerId
      });
    } catch (error) {
      console.error('❌ Error creating offer:', error);
    }
  }, [createPeerConnection, sendMessage, myPeerId]);

  const handleOffer = useCallback(async (offer, senderPeerId) => {
    console.log('📥 Handling offer from:', senderPeerId);
    const pc = createPeerConnection(senderPeerId);
    
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      
      console.log('📤 Sending answer to:', senderPeerId);
      sendMessage({
        type: 'answer',
        targetPeerId: senderPeerId,
        answer: answer,
        senderPeerId: myPeerId
      });
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
      console.error('❌ Peer connection not found for:', senderPeerId);
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
      console.error('❌ Peer connection not found for:', senderPeerId);
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
