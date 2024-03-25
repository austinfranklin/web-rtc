
// Put variables in global scope to make them available to the browser console.
const audio = document.querySelector('audio');

// specifies the requirements
const constraints = {
    'video': false,
    'audio': true
}

// getMediaUser() triggers a permissions request. If denied it throws an error.
navigator.mediaDevices.getUserMedia(constraints).then(handleSuccess).catch(handleError);

// NOTE: getUserMedia() can only be used in secure contexts; in insecure contexts, navigator.mediaDevices
// is undefined, preventing access to getUserMedia(). A secure context is, in short, a page loaded using
// HTTPS or the file:/// URL scheme, or a page loaded from localhost.

function handleSuccess(stream) {
    const audioTracks = stream.getAudioTracks();
    console.log('Got stream with constraints:', constraints);
    console.log('Using audio device: ' + audioTracks[0].label);
    stream.oninactive = function() {
      console.log('Stream ended');
    };
    window.stream = stream; // make variable available to browser console
    audio.srcObject = stream;
}
  
function handleError(error) {
    const errorMessage = 'navigator.MediaDevices.getUserMedia error: ' + error.message + ' ' + error.name;
    console.log(errorMessage);
}

// OR
// check all connected devices per constraints and provide feedback to user with enumerateDevices()
// function getConnectedDevices(type, callback) {
//     navigator.mediaDevices.enumerateDevices()
//         .then(devices => {
//             const filtered = devices.filter(device => device.kind === type);
//             callback(filtered);
//         });
// }

// Each MediaDevicesInfo contains a property named kind with the value audioinput, audiooutput or videoinput, indicating what type of media device it is.
// getConnectedDevices('audiooutput', speakers => console.log('Audio found', speakers));

// // once a MediaStream is available we can assign a video or audio element to play locally
// async function playAudioFromBrowser() {
//     try {
//         const constraints = {'video': false, 'audio': true};
//         const stream = await navigator.mediaDevices.getUserMedia(constraints);
//         const videoElement = document.querySelector('audio');
//         videoElement.srcObject = stream;
//     } catch(error) {
//         console.error('Error opening audio device.', error);
//     }
// }


