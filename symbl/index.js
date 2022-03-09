/**
 * The JWT token you get after authenticating with our API.
 * Check the Authentication section of the documentation for more details.
 */
const accessToken = "";

const randomString = (length, chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ") => {
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
}

const uniqueMeetingId = btoa("user@example.com" + randomString(32));

var initializeStreamingAPI = (_accessToken, _uniqueMeetingId, sampleRate) => {
    return new Promise((resolve) => {
        const symblEndpoint = `wss://api.symbl.ai/v1/realtime/insights/${
            _uniqueMeetingId || uniqueMeetingId
        }?access_token=${_accessToken || accessToken}`;

        const _ws = new WebSocket(symblEndpoint);

        // Fired when a message is received from the WebSocket server
        _ws.onmessage = (event) => {
            // You can find the conversationId in event.message.data.conversationId;
            const data = JSON.parse(event.data);

            postMessage({ symblEvent: data });

            if (
                data.type === "message" &&
                data.message.hasOwnProperty("data")
            ) {
                console.log("conversationId", data.message.data.conversationId);
            }
            if (data.type === "message_response") {
                for (let message of data.messages) {
                    console.log(
                        "Transcript (more accurate): ",
                        message.payload.content
                    );
                }
            }
            if (data.type === "topic_response") {
                for (let topic of data.topics) {
                    console.log("Topic detected: ", topic.phrases);
                }
            }
            if (data.type === "topic_response") {
                for (let topic of data.topics) {
                    console.log("Topic detected: ", topic.phrases);
                }
            }
            if (data.type === "insight_response") {
                for (let insight of data.insights) {
                    console.log("Insight detected: ", insight.payload.content);
                }
            }
            if (
                data.type === "message" &&
                data.message.hasOwnProperty("punctuated")
            ) {
                console.log(
                    "Live transcript (less accurate): ",
                    data.message.punctuated.transcript
                );
            }
            console.log(`Response type: ${data.type}. Object: `, data);
        };

        // Fired when the WebSocket closes unexpectedly due to an error or lost connetion
        _ws.onerror = (err) => {
            console.error(err);
        };

        // Fired when the WebSocket connection has been closed
        _ws.onclose = (event) => {
            console.info("Connection to websocket closed");
        };

        // Fired when the connection succeeds.
        _ws.onopen = (event) => {
            console.log("Connection opened");
            postMessage({ message: "Connection Opened" });
            _ws.send(
                JSON.stringify({
                    type: "start_request",
                    meetingTitle: "Websockets How-to", // Conversation name
                    insightTypes: ["question", "action_item"], // Will enable insight generation
                    config: {
                        confidenceThreshold: 0.5,
                        languageCode: "en-US",
                        speechRecognition: {
                            encoding: "LINEAR16",
                            sampleRateHertz: sampleRate,
                        },
                    },
                    speaker: {
                        userId: "example@symbl.ai",
                        name: "Example Sample",
                    },
                })
            );

            resolve(_ws);
        };

        postMessage({ message: "Attached WebSocket Handlers and listeners" });
    });
};
