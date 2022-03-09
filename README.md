Enable Symbl for real-time speech recognition.
============================

[![Streaming API](https://img.shields.io/badge/symbl-streaming-brightgreen)](https://docs.symbl.ai/docs/streamingapi/guides/get-realtime-transcription)

How to get real time speech-to-text transcription and insights on Streaming API

============================


Symbl's APIs empower developers to enable: 

- **Real-time** analysis of free-flowing discussions to automatically surface highly relevant summary discussion topics, contextual insights, suggestive action items, follow-ups, decisions, and questions.
- **Voice APIs** that makes it easy to add AI-powered conversational intelligence to either [telephony][telephony] or [WebSocket][websocket] interfaces.
- **Conversation APIs** that provide a REST interface for managing and processing your conversation data.
- **Summary UI** with a fully customizable and editable reference experience that indexes a searchable transcript and shows generated actionable insights, topics, timecodes, and speaker information.

<hr />

# Your Integration Guide's Purpose 

Enable Symbl for real-time speech recognition with Audio accessed via the AudioWorklet and SharedAudioBuffer. These are mainly used to shift the responsibility of accessing and processing of audio from the main thread to a background worker. The sharing of the audio data from the processor is done via the SharedArrayBuffers which makes this process highly optimised.

> **_NOTE:_** Due to security measures taken in the light of Specter, the SharedArrayBuffer can only be used in a secure context. This also requires serving your document with 2 additional headers and over HTTPS for SharedArrayBuffer to be available for use. Check these headers and their values in the `server/index.js` file. For more information on SharedArrayBuffers visit [this](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer) link.

<hr />

 * [Setup](#setup)
 * [Integration](#integration)
 * [Conclusion](#conclusion)
 * [Community](#community)

## Setup 

To run the express server to serve this example, you should have `Node.js v12+` and `ngrok` installed on your system. Go to the `server` directory and run `npm i` to install all the required dependencies.

The example requires a valid JWT Token to be set in the `accessToken` property in the `symbl/index.js` file. For more details on generating authentication token, please visit [here](https://docs.symbl.ai/docs/developer-tools/authentication)

To start the server, run `node index.js` in the `server` directory. This will start an instance of express HTTP server on port `5000`.

For running this example with SharedArrayBuffers, the next step is to access the example via HTTPS to ensure secure context for AudioWorklet and SharedArrayBuffer. Start an ngrok tunnel for port `5000` and use the HTTPS URI given by `ngrok` to access this example on browser. 

## Integration 

The browser will ask for permission to use your device's microhpone. For modifying the size of the audio frames being sent on the WebSocket connection, checkout the `kernelLength` property of `CONFIG` object in `audio/shared-buffer-worker.js` file.

> **_NOTE:_** Since the WebSocket connection is being established in the context of a Worker, the UTF-8 messages/data received on the socket connection is being emitted through the `postMessage` function. The custom `AudioWorkletNode` implementation accepts `onConversationEvents` function for receiving these events in the main thread.

## Community

If you have any questions, feel free to reach out to us at devrelations@symbl.ai or through our [Community Slack][slack] or our [developer community][developer_community]. 

This guide is actively developed, and we love to hear from you! Please feel free to [create an issue][issues] or [open a pull request][github.com/symblai/connect-symbl-to-zoom-without-ui/pulls] with your questions, comments, suggestions and feedback. If you liked our integration guide, please star our repo!


This library is released under the [MIT License][license]

[license]: LICENSE.txt
[telephony]: https://docs.symbl.ai/docs/telephony/overview/post-api
[websocket]: https://docs.symbl.ai/docs/streamingapi/overview/introduction
[developer_community]: https://community.symbl.ai/?_ga=2.134156042.526040298.1609788827-1505817196.1609788827
[slack]: https://join.slack.com/t/symbldotai/shared_invite/zt-4sic2s11-D3x496pll8UHSJ89cm78CA
[signup]: https://platform.symbl.ai/?_ga=2.63499307.526040298.1609788827-1505817196.1609788827
[issues]: https://github.com/symblai/connect-symbl-to-zoom-without-ui/issues
[pulls]: https://github.com/connect-symbl-to-zoom-without-ui/pulls
