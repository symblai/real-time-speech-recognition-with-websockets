/**
 * The JWT token you get after authenticating with our API.
 * Check the Authentication section of the documentation for more details.
 */
const accessToken = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IlFVUTRNemhDUVVWQk1rTkJNemszUTBNMlFVVTRRekkyUmpWQ056VTJRelUxUTBVeE5EZzFNUSJ9.eyJodHRwczovL3BsYXRmb3JtLnN5bWJsLmFpL3VzZXJJZCI6IjU2ODY3MDM2Mzk0OTQ2NTYiLCJpc3MiOiJodHRwczovL2RpcmVjdC1wbGF0Zm9ybS5hdXRoMC5jb20vIiwic3ViIjoiamt6dzZpck0xYUdUelhiczdqZ3d0RGV5R05QU0pMUU1AY2xpZW50cyIsImF1ZCI6Imh0dHBzOi8vcGxhdGZvcm0ucmFtbWVyLmFpIiwiaWF0IjoxNjE0MDM3NTkwLCJleHAiOjE2MTQxMjM5OTAsImF6cCI6Imprenc2aXJNMWFHVHpYYnM3amd3dERleUdOUFNKTFFNIiwiZ3R5IjoiY2xpZW50LWNyZWRlbnRpYWxzIn0.1ca8OaRQH5H2wOdbQVYMLm-rJj-uLAt1ISFc4jb07NQkfa8eLxU-LXsL68dMCCQsvDyoAX9r4WTxcMsl5Twa5ZzOqXIRgtJVIwFEKgEtlTnOUTp0L5vuISGnd6xtC2fUyOA-2fGojj07pQp8_zgWXL1at1uvREFz8eX0hOiW6gm-MdcnXiOQD_gk3w2RLxapI8mMC0lJnWRj7RrNMcCGQL6cCJf2oz5-jyzSqxV3IQmVC235e4yOK-lb8BHolNYGMJGvjbezmyII_T6RiR_KB6nYU3ICeBnPnjr9bdqDtycoWhvHR993vkfHkZB8OpO01fEf1P-tT48_mounjSEaXA"
const uniqueMeetingId = btoa("adam.voliva@symbl.ai");
const symblEndpoint = `wss://api.symbl.ai/v1/realtime/insights/${uniqueMeetingId}?access_token=${accessToken}`;

const ws = new WebSocket(symblEndpoint);

// Fired when a message is received from the WebSocket server
ws.onmessage = (event) => {
  // You can find the conversationId in event.message.data.conversationId;
  const data = JSON.parse(event.data);
  if (data.type === 'message' && data.message.hasOwnProperty('data')) {
    console.log('conversationId', data.message.data.conversationId);
  }
  console.log('onmessage event', event);
};

// Fired when the WebSocket closes unexpectedly due to an error or lost connetion
ws.onerror  = (err) => {
  console.error(err);
};

// Fired when the WebSocket connection has been closed
ws.onclose = (event) => {
  console.info('Connection to websocket closed');
};

// Fired when the connection succeeds.
ws.onopen = (event) => {
  ws.send(JSON.stringify({
    type: 'start_request',
    meetingTitle: 'Websockets How-to', // Conversation name
    insightTypes: ['question', 'action_item'], // Will enable insight generation
    config: {
      confidenceThreshold: 0.5,
      languageCode: 'en-US',
      speechRecognition: {
        encoding: 'LINEAR16',
        sampleRateHertz: 44100,
      }
    },
    speaker: {
      userId: 'example@symbl.ai',
      name: 'Example Sample',
    }
  }));
};

const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });

/**
 * The callback function which fires after a user gives the browser permission to use
 * the computer's microphone. Starts a recording session which sends the audio stream to
 * the WebSocket endpoint for processing.
 */
const handleSuccess = (stream) => {
  const AudioContext = window.AudioContext;
  const context = new AudioContext();
  const source = context.createMediaStreamSource(stream);
  const processor = context.createScriptProcessor(1024, 1, 1);
  const gainNode = context.createGain();
  source.connect(gainNode);
  gainNode.connect(processor);
  processor.connect(context.destination);
  processor.onaudioprocess = (e) => {
    // convert to 16-bit payload
    const inputData = e.inputBuffer.getChannelData(0) || new Float32Array(this.bufferSize);
    const targetBuffer = new Int16Array(inputData.length);
    for (let index = inputData.length; index > 0; index--) {
        targetBuffer[index] = 32767 * Math.min(1, inputData[index]);
    }
    // Send audio stream to websocket.
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(targetBuffer.buffer);
    }
  };
};


handleSuccess(stream);