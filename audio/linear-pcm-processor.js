class LinearPCMAudioProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
    }

    /**
     * Called by the browser's audio subsystem with
     * packets of audio data to be processed.
     *
     * @param[in] inputList    Array of inputs
     * @param[in] outputList   Array of outputs
     * @param[in] parameters   Parameters object
     *
     * `inputList` and `outputList` are each arrays of inputs
     * or outputs, each of which is in turn an array of `Float32Array`s,
     * each of which contains the audio data for one channel (left/right/etc)
     * for the current sample packet.
     *
     * `parameters` is an object containing the `AudioParam` values
     * for the current block of audio data.
     **/
    
    process(inputList, outputList, parameters) {
        const sourceLimit = Math.min(inputList.length, outputList.length);
  
        if (sourceLimit > 0) {
            let input = inputList[0];
            
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

                this.port.postMessage(audioData, [audioData.buffer]);
            }
        }

        return true;
    }
}

registerProcessor("linear-pcm-processor", LinearPCMAudioProcessor);
