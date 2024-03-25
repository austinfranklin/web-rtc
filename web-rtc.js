
// // Put variables in global scope to make them available to the browser console.
// const audio = document.querySelector('audio');

// const constraints = window.constraints = {
//   audio: true,
//   video: false
// };

// function handleSuccess(stream) {
//   const audioTracks = stream.getAudioTracks();
//   console.log('Got stream with constraints:', constraints);
//   console.log('Using audio device: ' + audioTracks[0].label);
//   stream.oninactive = function() {
//     console.log('Stream ended');
//   };
//   window.stream = stream; // make variable available to browser console
//   audio.srcObject = stream;
// }

// function handleError(error) {
//   const errorMessage = 'navigator.MediaDevices.getUserMedia error: ' + error.message + ' ' + error.name;
//   document.getElementById('errorMsg').innerText = errorMessage;
//   console.log(errorMessage);
// }

// navigator.mediaDevices.getUserMedia(constraints).then(handleSuccess).catch(handleError);

// // all the above works!









// set up an asynchronous communication channel that will be
// used during the peer connection setup
const signalingChannel = new SignalingChannel('1234567890');
signalingChannel.addEventListener('message', message => {
    // new message from remote client received
});

// send an asynchronous message to the remote client
signalingChannel.send('Hello!');

async function makeCall() {
    const configuration = {'iceServers': [{'urls': 'stun:stun.l.google.com:19302'}]}
    const peerConnection = new RTCPeerConnection(configuration);
    signalingChannel.addEventListener('message', async message => {
        if (message.answer) {
            const remoteDesc = new RTCSessionDescription(message.answer);
            await peerConnection.setRemoteDescription(remoteDesc);
        }
    });
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    signalingChannel.send({'offer': offer});
}

// on the receiving end
const peerConnection = new RTCPeerConnection(configuration);
signalingChannel.addEventListener('message', async message => {
    if (message.offer) {
        peerConnection.setRemoteDescription(new RTCSessionDescription(message.offer));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        signalingChannel.send({'answer': answer});
    }
});

// listen for local ICE candidates on the local RTCPeerConnection
peerConnection.addEventListener('icecandidate', event => {
    if (event.candidate) {
        signalingChannel.send({'new-ice-candidate': event.candidate});
    }
});

// listen for remote ICE candidates and add them to the local RTCPeerConnection
signalingChannel.addEventListener('message', async message => {
    if (message.iceCandidate) {
        try {
            await peerConnection.addIceCandidate(message.iceCandidate);
        } catch (e) {
            console.error('Error adding received ice candidate', e);
        }
    }
});

// listen for connectionstatechange on the local RTCPeerConnection
peerConnection.addEventListener('connectionstatechange', event => {
    if (peerConnection.connectionState === 'connected') {
        // peers connected!
    }
});



















const startButton = document.getElementById('startButton');
const callButton = document.getElementById('callButton');
const hangupButton = document.getElementById('hangupButton');
callButton.disabled = true;
hangupButton.disabled = true;
startButton.onclick = start;
callButton.onclick = call;
hangupButton.onclick = hangup;

const audio1 = document.querySelector('audio#audio1');
const audio2 = document.querySelector('audio#audio2');
const audio3 = document.querySelector('audio#audio3');

let localStream;
let pc1Local;
let pc1Remote;
let pc2Local;
let pc2Remote;
const offerOptions = {
  offerToReceiveAudio: 1,
  offerToReceiveVideo: 1
};

function gotStream(stream) {
  console.log('Received local stream');
  audio1.srcObject = stream;
  localStream = stream;
  callButton.disabled = false;
}

function start() {
  console.log('Requesting local stream');
  startButton.disabled = true;
  navigator.mediaDevices
      .getUserMedia({
        audio: true,
        video: false
      })
      .then(gotStream)
      .catch(e => console.log('getUserMedia() error: ', e));
}

function call() {
  callButton.disabled = true;
  hangupButton.disabled = false;
  console.log('Starting calls');
  const audioTracks = localStream.getAudioTracks();
  const videoTracks = localStream.getVideoTracks();
  if (audioTracks.length > 0) {
    console.log(`Using audio device: ${audioTracks[0].label}`);
  }
  if (videoTracks.length > 0) {
    console.log(`Using video device: ${videoTracks[0].label}`);
  }
  // Create an RTCPeerConnection via the polyfill.
  const servers = null;
  pc1Local = new RTCPeerConnection(servers);
  pc1Remote = new RTCPeerConnection(servers);
  pc1Remote.ontrack = gotRemoteStream1;
  pc1Local.onicecandidate = iceCallback1Local;
  pc1Remote.onicecandidate = iceCallback1Remote;
  console.log('pc1: created local and remote peer connection objects');

  pc2Local = new RTCPeerConnection(servers);
  pc2Remote = new RTCPeerConnection(servers);
  pc2Remote.ontrack = gotRemoteStream2;
  pc2Local.onicecandidate = iceCallback2Local;
  pc2Remote.onicecandidate = iceCallback2Remote;
  console.log('pc2: created local and remote peer connection objects');

  localStream.getTracks().forEach(track => pc1Local.addTrack(track, localStream));
  console.log('Adding local stream to pc1Local');
  pc1Local
      .createOffer(offerOptions)
      .then(gotDescription1Local, onCreateSessionDescriptionError);

  localStream.getTracks().forEach(track => pc2Local.addTrack(track, localStream));
  console.log('Adding local stream to pc2Local');
  pc2Local.createOffer(offerOptions)
      .then(gotDescription2Local, onCreateSessionDescriptionError);
}

function onCreateSessionDescriptionError(error) {
  console.log(`Failed to create session description: ${error.toString()}`);
}

function gotDescription1Local(desc) {
  pc1Local.setLocalDescription(desc);
  console.log(`Offer from pc1Local\n${desc.sdp}`);
  pc1Remote.setRemoteDescription(desc);
  // Since the 'remote' side has no media stream we need
  // to pass in the right constraints in order for it to
  // accept the incoming offer of audio and video.
  pc1Remote.createAnswer().then(gotDescription1Remote, onCreateSessionDescriptionError);
}

function gotDescription1Remote(desc) {
  pc1Remote.setLocalDescription(desc);
  console.log(`Answer from pc1Remote\n${desc.sdp}`);
  pc1Local.setRemoteDescription(desc);
}

function gotDescription2Local(desc) {
  pc2Local.setLocalDescription(desc);
  console.log(`Offer from pc2Local\n${desc.sdp}`);
  pc2Remote.setRemoteDescription(desc);
  // Since the 'remote' side has no media stream we need
  // to pass in the right constraints in order for it to
  // accept the incoming offer of audio and video.
  pc2Remote.createAnswer().then(gotDescription2Remote, onCreateSessionDescriptionError);
}

function gotDescription2Remote(desc) {
  pc2Remote.setLocalDescription(desc);
  console.log(`Answer from pc2Remote\n${desc.sdp}`);
  pc2Local.setRemoteDescription(desc);
}

function hangup() {
  console.log('Ending calls');
  pc1Local.close();
  pc1Remote.close();
  pc2Local.close();
  pc2Remote.close();
  pc1Local = pc1Remote = null;
  pc2Local = pc2Remote = null;
  hangupButton.disabled = true;
  callButton.disabled = false;
}

function gotRemoteStream1(e) {
  if (audio2.srcObject !== e.streams[0]) {
    audio2.srcObject = e.streams[0];
    console.log('pc1: received remote stream');
  }
}

function gotRemoteStream2(e) {
  if (audio3.srcObject !== e.streams[0]) {
    audio3.srcObject = e.streams[0];
    console.log('pc2: received remote stream');
  }
}

function iceCallback1Local(event) {
  handleCandidate(event.candidate, pc1Remote, 'pc1: ', 'local');
}

function iceCallback1Remote(event) {
  handleCandidate(event.candidate, pc1Local, 'pc1: ', 'remote');
}

function iceCallback2Local(event) {
  handleCandidate(event.candidate, pc2Remote, 'pc2: ', 'local');
}

function iceCallback2Remote(event) {
  handleCandidate(event.candidate, pc2Local, 'pc2: ', 'remote');
}

function handleCandidate(candidate, dest, prefix, type) {
  dest.addIceCandidate(candidate)
      .then(onAddIceCandidateSuccess, onAddIceCandidateError);
  console.log(`${prefix}New ${type} ICE candidate: ${candidate ? candidate.candidate : '(null)'}`);
}

function onAddIceCandidateSuccess() {
  console.log('AddIceCandidate success.');
}

function onAddIceCandidateError(error) {
  console.log(`Failed to add ICE candidate: ${error.toString()}`);
}


























