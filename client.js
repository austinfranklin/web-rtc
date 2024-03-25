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