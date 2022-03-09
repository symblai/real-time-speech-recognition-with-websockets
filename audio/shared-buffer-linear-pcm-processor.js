// Description of shared states. See shared-buffer-worker.js for the
// description.
const STATE = {
    'REQUEST_RENDER': 0,
    'IB_FRAMES_AVAILABLE': 1,
    'IB_READ_INDEX': 2,
    'IB_WRITE_INDEX': 3,
    'OB_FRAMES_AVAILABLE': 4,
    'OB_READ_INDEX': 5,
    'OB_WRITE_INDEX': 6,
    'RING_BUFFER_LENGTH': 7,
    'KERNEL_LENGTH': 8,
};

/**
 * @class SharedBufferWorkletProcessor
 * @extends AudioWorkletProcessor
 */
class SharedBufferWorkletProcessor extends AudioWorkletProcessor {
    /**
     * @constructor
     * @param {AudioWorkletNodeOptions} nodeOptions
     */
    constructor(nodeOptions) {
        super();

        this._initialized = false;
        this.port.onmessage = this._initializeOnEvent.bind(this);
    }

    /**
     * Without a proper coordination with the worker backend, this processor
     * cannot function. This initializes upon the event from the worker backend.
     *
     * @param {Event} eventFromWorker
     */
    _initializeOnEvent(eventFromWorker) {
        const sharedBuffers = eventFromWorker.data;

        // Get the states buffer.
        this._states = new Int32Array(sharedBuffers.states);

        // Worker's input/output buffers. This example only handles mono channel
        // for both.
        this._inputRingBuffer = [new Int16Array(sharedBuffers.inputRingBuffer)];

        this._ringBufferLength = this._states[STATE.RING_BUFFER_LENGTH];
        this._kernelLength = this._states[STATE.KERNEL_LENGTH];

        this._initialized = true;
        this.port.postMessage({
            message: 'PROCESSOR_READY',
        });
    }

    /**
     * Push 128 samples to the shared input buffer.
     *
     * @param {Int16Array} inputChannelData The input data.
     */
    _pushInputChannelData(inputChannelData) {
        let inputWriteIndex = this._states[STATE.IB_WRITE_INDEX];

        if (inputWriteIndex + inputChannelData.length < this._ringBufferLength) {
            // If the ring buffer has enough space to push the input.
            this._inputRingBuffer[0].set(inputChannelData, inputWriteIndex);
            this._states[STATE.IB_WRITE_INDEX] += inputChannelData.length;
        } else {
            // When the ring buffer does not have enough space so the index needs to
            // be wrapped around.
            let splitIndex = this._ringBufferLength - inputWriteIndex;
            let firstHalf = inputChannelData.subarray(0, splitIndex);
            let secondHalf = inputChannelData.subarray(splitIndex);
            this._inputRingBuffer[0].set(firstHalf, inputWriteIndex);
            this._inputRingBuffer[0].set(secondHalf);
            this._states[STATE.IB_WRITE_INDEX] = secondHalf.length;
        }

        // Update the number of available frames in the input ring buffer.
        this._states[STATE.IB_FRAMES_AVAILABLE] += inputChannelData.length;
    }

    /**
     * AWP's process callback.
     *
     * @param {Array} inputs Input audio data.
     * @param {Array} outputs Output audio data.
     * @return {Boolean} Lifetime flag.
     */
    process(inputs, outputs) {
        if (!this._initialized) {
            return true;
        }

        let input = inputs[0];

        if (input && input.length > 0) {
            let dataSamples = input[0].length;

            const audioData = new Int16Array(dataSamples);

            for (let i = dataSamples; i > 0; i -= 1) {
                const data = input[0][i];

                audioData[i] = 32767 * Math.min(
                    1,
                    data
                );
            }

            this._pushInputChannelData(audioData);
        }

        if (this._states[STATE.IB_FRAMES_AVAILABLE] >= this._kernelLength) {
            // Now we have enough frames to process. Wake up the worker.
            Atomics.notify(this._states, STATE.REQUEST_RENDER, 1);
        }

        return true;
    }
} // class SharedBufferWorkletProcessor


registerProcessor('shared-buffer-linear-pcm-processor',
    SharedBufferWorkletProcessor);
