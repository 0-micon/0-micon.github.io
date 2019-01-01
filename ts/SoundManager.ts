/// <reference path="MathUtils.ts" />

namespace SoundManager {
  const RESOURCE_DIR = "resources/audio/";
  const RESOURCE_EXT = ".mp3";
  enum Resources {
    card,
    deal,
    shuffle,
    aplause_001,
    aplause_002,
    aplause_003,
    aplause_004,
    aplause_005,
    aplause_006,
    aplause_007,
    length
  }

  export let playCard: Function;
  export let playDeal: Function;
  export let playShuffle: Function;
  export let playVictory: Function;

  playCard = playDeal = playShuffle = playVictory = function() {
    console.log("Audio is not ready!");
  };

  const context: AudioContext = new AudioContext();

  function makeSource(
    destination: AudioNode,
    buffer: AudioBuffer,
    gain: number = 1,
    stereoPan: number = 0
  ): AudioBufferSourceNode {
    // Build graph: source -> gain? -> panner? -> destination
    const source: AudioBufferSourceNode = context.createBufferSource();
    source.buffer = buffer;

    let node: AudioNode = source;
    if (gain !== 1) {
      const volume: GainNode = context.createGain();
      volume.gain.value = gain;
      node.connect(volume);
      node = volume;
    }

    if (stereoPan !== 0) {
      const panner: StereoPannerNode = context.createStereoPanner();
      panner.pan.value = stereoPan;
      node.connect(panner);
      node = panner;
    }

    node.connect(destination);
    return source;
  }

  // The value can range between -1 (full left pan) and 1 (full right pan).
  function randomPan() {
    return MathUtils.randomIneger(-100, 100 + 1) / 100;
  }

  export function init() {
    // Create static nodes. These nodes can be used multiple times.
    // Source -> DynamicsCompressorNode -> AudioDestination
    const compressor: DynamicsCompressorNode = context.createDynamicsCompressor();
    compressor.connect(context.destination);

    const destination: AudioNode = compressor;

    loadAll(function(buffers: AudioBuffer[]) {
      let playCardCount = 0;
      playCard = function() {
        if (playCardCount++ === 0) {
          setTimeout(function() {
            if (playCardCount === 1) {
              const source = makeSource(
                destination,
                buffers[Resources.card],
                0.8
              );
              source.start();
            } else {
              const source = makeSource(
                destination,
                buffers[Resources.shuffle],
                1.0
              );
              source.start();
            }
            playCardCount = 0;
          });
        }
      };

      playDeal = function() {
        const source = makeSource(destination, buffers[Resources.deal], 1);
        source.start();
      };

      playShuffle = function() {
        const source = makeSource(destination, buffers[Resources.shuffle], 1.5);
        source.start();
      };

      playVictory = function() {
        const minValue = Resources.aplause_001;
        const maxValue = Resources.aplause_007;
        const time = context.currentTime;
        for (let i = 0, count = MathUtils.randomIneger(1, 4); i < count; i++) {
          const source = makeSource(
            destination,
            buffers[MathUtils.randomIneger(minValue, maxValue + 1)],
            MathUtils.randomNumber(0.75, 1.75),
            randomPan()
          );
          source.playbackRate.value = MathUtils.randomNumber(0.85, 1.75);
          source.start(time + Math.random() * 3);
        }
      };
    });
  }

  function loadAll(callback: (buffers: AudioBuffer[]) => any): void {
    const resources: string[] = [];
    for (let i = 0; i < Resources.length; i++) {
      resources.push(RESOURCE_DIR + Resources[i] + RESOURCE_EXT);
    }

    const loader = new AudioLoader(context, resources, callback);
    loader.load();
  }

  /*\
   * AudioLoader for loading multiple audio files asynchronously.
   * The callback function is called when all files have been loaded and decoded.
  \*/
  class AudioLoader {
    private count: number = 0;
    private readonly buffers: AudioBuffer[];
    constructor(
      readonly context: AudioContext,
      readonly urls: string[],
      readonly callback: (buffers: AudioBuffer[]) => any
    ) {
      this.buffers = new Array(urls.length);
    }

    load() {
      const that = this;
      console.log(`Loading ${that.urls.length} track(s). Please wait...`);
      that.urls.forEach(function(url: string, index: number) {
        const onsuccess: DecodeSuccessCallback = function(
          decodedData: AudioBuffer
        ) {
          console.log(
            `Loaded and decoded track ${that.count + 1}/${that.urls.length}...`
          );
          if (decodedData) {
            that.buffers[index] = decodedData;
            if (++that.count === that.urls.length) {
              // We are done. Call the callback and pass in the decoded buffers.
              that.callback(that.buffers);
            }
          } else {
            alert(`Error decoding audio data: ${url}`);
          }
        };

        const onerror: DecodeErrorCallback = function(error: DOMException) {
          alert(`decodeAudioData error ${error}`);
        };

        console.log(`  file: '${url}' loading and decoding...`);
        let request = new XMLHttpRequest();
        request.open("GET", url, true); // Set the request method, url and asynchronous flag.
        request.responseType = "arraybuffer";
        request.onload = function(event: ProgressEvent) {
          that.context.decodeAudioData(request.response, onsuccess, onerror);
        };
        request.onprogress = function(event: ProgressEvent) {
          if (event.total !== 0) {
            const percent = (event.loaded * 100) / event.total;
            console.log(`Loaded ${percent}% of ${url}`);
          }
        };
        request.onerror = function() {
          alert(`Error loading ${url}!`);
        };
        request.send();
      });
    }
  }
}
