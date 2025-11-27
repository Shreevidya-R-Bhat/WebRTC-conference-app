Real-Time Conferencing App (WebRTC + WebSocket + React + Node.js)

A lightweight, modern real-time video conferencing application built using WebRTC, WebSockets, React, and Node.js.
This project also collects and visualizes important WebRTC performance stats (bitrate, packet loss, latency, jitter, frame rate) and includes a small analysis report in the repository.

 Features

 Peer-to-Peer Video Conferencing via WebRTC
 Real-time Signaling using WebSockets (Socket.IO or ws)
 Live Audio/Video Streams from camera + microphone
 WebRTC Stats Dashboard (bitrate, fps, packets sent/received, RTT, jitter)
 Room-based Meeting System
 Media Controls (mute/unmute, camera on/off)
 Mini Performance Report included in repo
 React Frontend + Node.js Backend

 Tech Stack

Frontend (React)

React + Vite
WebRTC APIs (getUserMedia, RTCPeerConnection, RTCDataChannel)
Socket.IO client or WebSocket client
Chart.js or Recharts (for stats UI)
TailwindCSS / CSS Modules (your choice)


Backend (Node.js)

Node.js + Express
WebSocket Server (Socket.IO or ws)
Optional: Redis for scaling signaling
Optional: PM2 / Docker for deployment


 Architecture Overview
User A <—WebRTC—> User B
      \           /
       \         /
         WebSocket Server
      (signaling: SDP, ICE)


WebRTC handles the media stream,
WebSockets handle the signaling.

 
 WebRTC Stats Tracked

You will collect and plot:

 Bitrate (kbps)
 Packets Sent / Received
 RTT (Latency)
 Jitter
 Video Frame Rate
 Resolution (width × height)


Stats are fetched using:

peerConnection.getStats()


 Mini Report

A compact report is included at:

stats-report/WebRTC_Stats_Report.md

Includes:

Setup
Methodology
Collected stats
Graphs
Observations & bottlenecks
Possible improvements