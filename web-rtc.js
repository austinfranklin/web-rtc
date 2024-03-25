// Define constants
const configuration = {'iceServers': [{'urls': 'stun:stun.l.google.com:19302'}]};
const constraints = {'video': false, 'audio': true};

//----------

// setup for signaling
// Server-side code
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

// Event listener for WebSocket connections
wss.on('connection', ws => {
  // Event listener for incoming messages from clients
  ws.on('message', message => {
    // Broadcast the message to all connected clients
    wss.clients.forEach(client => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });
});

// Client-side code
const signalingChannel = new WebSocket('ws://localhost:8080');

// Function to send messages over the signaling channel
function sendMessage(message) {
  signalingChannel.send(JSON.stringify(message));
}

// Event listener for incoming messages from the signaling channel
signalingChannel.addEventListener('message', event => {
  const message = JSON.parse(event.data);
  // Handle incoming messages here
});

// Example usage: sending an offer
const offer = /* Your offer object */
sendMessage({ type: 'offer', offer });

//----------

// Function to establish peer connection and start streaming audio
async function startAudioStream() {
  try {
    // Get user media (microphone audio)
    const stream = await navigator.mediaDevices.getUserMedia(constraints);

    // Set up peer connection
    const peerConnection = new RTCPeerConnection(configuration);

    // Add local audio track to peer connection
    stream.getAudioTracks().forEach(track => {
      peerConnection.addTrack(track, stream);
    });

    // Listen for incoming audio tracks from remote peer
    peerConnection.addEventListener('track', event => {
      // Play remote audio stream
      const audioElement = document.getElementById('remoteAudio');
      if (!audioElement.srcObject) {
        audioElement.srcObject = new MediaStream();
      }
      audioElement.srcObject.addTrack(event.track);
    });

    // Create offer and set local description
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    
    // Send offer to remote peer
    signalingChannel.send({'offer': offer});

    // Listen for answer from remote peer
    signalingChannel.addEventListener('message', async message => {
      if (message.answer) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(message.answer));
      }
    });

    // Listen for ICE candidates and send them to remote peer
    peerConnection.addEventListener('icecandidate', event => {
      if (event.candidate) {
        signalingChannel.send({'iceCandidate': event.candidate});
      }
    });

  } catch (error) {
    console.error('Error starting audio stream:', error);
  }
}

// Function to handle incoming ICE candidates from remote peer
signalingChannel.addEventListener('message', async message => {
  if (message.iceCandidate) {
    try {
      await peerConnection.addIceCandidate(new RTCIceCandidate(message.iceCandidate));
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
    }
  }
});

// Function to handle incoming call from remote peer
async function handleIncomingCall() {
  try {
    // Get user media (microphone audio)
    const stream = await navigator.mediaDevices.getUserMedia(constraints);

    // Set up peer connection
    const peerConnection = new RTCPeerConnection(configuration);

    // Add local audio track to peer connection
    stream.getAudioTracks().forEach(track => {
      peerConnection.addTrack(track, stream);
    });

    // Listen for incoming offer from remote peer
    signalingChannel.addEventListener('message', async message => {
      if (message.offer) {
        // Set remote description from offer
        await peerConnection.setRemoteDescription(new RTCSessionDescription(message.offer));

        // Create answer and set local description
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        // Send answer to remote peer
        signalingChannel.send({'answer': answer});

        // Listen for ICE candidates and send them to remote peer
        peerConnection.addEventListener('icecandidate', event => {
          if (event.candidate) {
            signalingChannel.send({'iceCandidate': event.candidate});
          }
        });
      }
    });

    // Listen for incoming audio tracks from remote peer
    peerConnection.addEventListener('track', event => {
      // Play remote audio stream
      const audioElement = document.getElementById('audio');
      if (!audioElement.srcObject) {
        audioElement.srcObject = new MediaStream();
      }
      audioElement.srcObject.addTrack(event.track);
    });

  } catch (error) {
    console.error('Error handling incoming call:', error);
  }
}

//----------

// Call function to start audio streaming when user initiates action
document.getElementById('startButton').addEventListener('click', startAudioStream);

// Call function to handle incoming call when received from remote peer
handleIncomingCall();
