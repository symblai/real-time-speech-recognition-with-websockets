let audioContext = null;
let audioWorkletNode, audioSource;

let useSharedBuffer = true;

const getMediaStream = async () => {
    const localMediaStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
    });

    const devices = await navigator.mediaDevices.enumerateDevices();

    try {
        const defaultDevice = devices.filter(
            (dev) => dev.deviceId === "default" && dev.kind === "audioinput"
        );

        if (defaultDevice.length > 0) {
            const device = devices.filter((dev) => {
                return (
                    dev.deviceId !== "default" &&
                    defaultDevice[0].label.includes(dev.label) &&
                    dev.kind === "audioinput"
                );
            });

            if (device.length > 0) {
                await localMediaStream.getAudioTracks()[0].applyConstraints({
                    deviceId: device[0].deviceId,
                });
            }
        }

        if (audioContext) {
            await localMediaStream.getAudioTracks()[0].applyConstraints({
                sampleRate: {
                    ideal: audioContext.sampleRate,
                },
            });
        }

        return localMediaStream;
    } catch (err) {
        console.error(
            `Exception caught while enumerating media input devices: ${
                err && err.message
            }`
        );
        throw err;
    }
};

const initializeAudioDevice = async (_audioContext, conversationEventsCallback, audioCallback) => {
    if (
        audioCallback !== undefined &&
        audioCallback !== null &&
        typeof audioCallback !== "function"
    ) {
        throw new TypeError(`audioCallback is not a function`);
    }

    if (audioContext && audioContext.state === "running") {
        audioContext.close();
    }

    if (_audioContext && typeof _audioContext === "function") {
        audioContext = _audioContext;
    } else {
        try {
            audioContext = new AudioContext();
        } catch (e) {
            console.error(
                `Exception while initializing AudioContext: ${e && e.message}`
            );
            return null;
        }
    }

    try {
        const mediaStream = await getMediaStream();
        audioSource = audioContext.createMediaStreamSource(mediaStream);

        await createAudioProcessor(audioCallback, conversationEventsCallback);

        return audioContext;
    } catch (e) {
        console.error(
            `Exception caught while initializing Audio device: ${
                e && e.message
            }`
        );
    }
};

const createAudioProcessor = async (audioCallback, conversationEventsCallback) => {
    audioWorkletNode = await updateWorkletNode();

    if (audioWorkletNode) {
        if (!useSharedBuffer) {
            audioWorkletNode.port.onmessage = (e) => {
                audioCallback && audioCallback(e.data);
            };
        } else {
            if (typeof conversationEventsCallback === "function") {
                audioWorkletNode.onConversationEvents = conversationEventsCallback;
            }
        }

        audioSource.connect(audioWorkletNode);
        audioWorkletNode.connect(audioContext.destination);
    }

    return audioWorkletNode;
};

const updateWorkletNode = async () => {
    let audioWorkletNode;
    const {default: SharedBufferAudioWorkletNode} = await import('./shared-buffer-worklet-node.js');

    try {
        if (!useSharedBuffer) {
            audioWorkletNode = new AudioWorkletNode(
                audioContext,
                "linear-pcm-processor"
            );
        } else {
            audioWorkletNode = new SharedBufferAudioWorkletNode(
                audioContext
            );
        }
    } catch (e) {
        try {
            if (!useSharedBuffer) {
                await audioContext.audioWorklet.addModule(
                    "linear-pcm-processor.js"
                );

                audioWorkletNode = new AudioWorkletNode(
                    audioContext,
                    "linear-pcm-processor"
                );
            } else {
                await audioContext.audioWorklet.addModule(
                    "audio/shared-buffer-linear-pcm-processor.js"
                );

                audioWorkletNode = new SharedBufferAudioWorkletNode(
                    audioContext
                );
            }
        } catch (e) {
            console.error(
                `Exception caught while adding processor module to AudioContext: ${
                    e && e.message
                }`
            );
            return null;
        }
    }

    try {
        console.info('Intializing...');
        if (useSharedBuffer) {
            audioWorkletNode._init();
        }

        await new Promise((resolve) => {
            audioWorkletNode.onInitialized = () => {
                resolve();
            };
        });

        console.info('Intialized.');

        await audioContext.resume();
    } catch (e) {
        console.error(
            `Exception caught while resuming AudioContext: ${e && e.message}`
        );
    }

    return audioWorkletNode;
};
