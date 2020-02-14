/// <reference path="MathUtils.ts" />
var SoundManager;
(function (SoundManager) {
    var RESOURCE_DIR = "/resources/audio/";
    var RESOURCE_EXT = ".mp3";
    var Resources;
    (function (Resources) {
        Resources[Resources["card"] = 0] = "card";
        Resources[Resources["deal"] = 1] = "deal";
        Resources[Resources["shuffle"] = 2] = "shuffle";
        Resources[Resources["aplause_001"] = 3] = "aplause_001";
        Resources[Resources["aplause_002"] = 4] = "aplause_002";
        Resources[Resources["aplause_003"] = 5] = "aplause_003";
        Resources[Resources["aplause_004"] = 6] = "aplause_004";
        Resources[Resources["aplause_005"] = 7] = "aplause_005";
        Resources[Resources["aplause_006"] = 8] = "aplause_006";
        Resources[Resources["aplause_007"] = 9] = "aplause_007";
        //Resources[Resources["aplause_008"] = 10] = "aplause_008";
        Resources[Resources["length"] = 10] = "length";
    })(Resources || (Resources = {}));
    SoundManager.playCard = SoundManager.playDeal = SoundManager.playShuffle = SoundManager.playVictory = function () {
        console.log("Audio is not ready!");
    };
    var context = new AudioContext();
    function makeSource(destination, buffer, gain, stereoPan) {
        if (gain === void 0) { gain = 1; }
        if (stereoPan === void 0) { stereoPan = 0; }
        // Build graph: source -> gain? -> panner? -> destination
        var source = context.createBufferSource();
        source.buffer = buffer;
        var node = source;
        if (gain !== 1) {
            var volume = context.createGain();
            volume.gain.value = gain;
            node.connect(volume);
            node = volume;
        }
        if (stereoPan !== 0) {
            var panner = context.createStereoPanner();
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
    function init() {
        // Create static nodes. These nodes can be used multiple times.
        // Source -> DynamicsCompressorNode -> AudioDestination
        var compressor = context.createDynamicsCompressor();
        compressor.connect(context.destination);
        var destination = compressor;
        loadAll(function (buffers) {
            var playCardCount = 0;
            SoundManager.playCard = function () {
                if (playCardCount++ === 0) {
                    setTimeout(function () {
                        if (playCardCount === 1) {
                            var source = makeSource(destination, buffers[Resources.card], 0.8);
                            source.start();
                        }
                        else {
                            var source = makeSource(destination, buffers[Resources.shuffle], 1.0);
                            source.start();
                        }
                        playCardCount = 0;
                    });
                }
            };
            SoundManager.playDeal = function () {
                var source = makeSource(destination, buffers[Resources.deal], 1);
                source.start();
            };
            SoundManager.playShuffle = function () {
                var source = makeSource(destination, buffers[Resources.shuffle], 1.5);
                source.start();
            };
            SoundManager.playVictory = function () {
                var minValue = Resources.aplause_001;
                var maxValue = Resources.aplause_007;
                var time = context.currentTime;
                for (var i = 0, count = MathUtils.randomIneger(1, 4) ; i < count; i++) {
                    var source = makeSource(destination, buffers[MathUtils.randomIneger(minValue, maxValue + 1)], MathUtils.randomNumber(0.75, 1.75), randomPan());
                    source.playbackRate.value = MathUtils.randomNumber(0.85, 1.75);
                    source.start(time + Math.random() * 3);
                }
            };
        });
    }
    SoundManager.init = init;
    function loadAll(callback) {
        var resources = [];
        for (var i = 0; i < Resources.length; i++) {
            resources.push(RESOURCE_DIR + Resources[i] + RESOURCE_EXT);
        }
        var loader = new AudioLoader(context, resources, callback);
        loader.load();
    }
    /*\
     * AudioLoader for loading multiple audio files asynchronously.
     * The callback function is called when all files have been loaded and decoded.
    \*/
    var AudioLoader = /** @class */ (function () {
        function AudioLoader(context, urls, callback) {
            this.context = context;
            this.urls = urls;
            this.callback = callback;
            this.count = 0;
            this.buffers = new Array(urls.length);
        }
        AudioLoader.prototype.load = function () {
            var that = this;
            console.log("Loading " + that.urls.length + " track(s). Please wait...");
            that.urls.forEach(function (url, index) {
                var onsuccess = function (decodedData) {
                    console.log("Loaded and decoded track " + (that.count + 1) + "/" + that.urls.length + "...");
                    if (decodedData) {
                        that.buffers[index] = decodedData;
                        if (++that.count === that.urls.length) {
                            // We are done. Call the callback and pass in the decoded buffers.
                            that.callback(that.buffers);
                        }
                    }
                    else {
                        alert("Error decoding audio data: " + url);
                    }
                };
                var onerror = function (error) {
                    alert("decodeAudioData error " + error);
                };
                console.log("  file: '" + url + "' loading and decoding...");
                var request = new XMLHttpRequest();
                request.open("GET", url, true); // Set the request method, url and asynchronous flag.
                request.responseType = "arraybuffer";
                request.onload = function (event) {
                    that.context.decodeAudioData(request.response, onsuccess, onerror);
                };
                request.onprogress = function (event) {
                    if (event.total !== 0) {
                        var percent = (event.loaded * 100) / event.total;
                        console.log("Loaded " + percent + "% of " + url);
                    }
                };
                request.onerror = function () {
                    alert("Error loading " + url + "!");
                };
                request.send();
            });
        };
        return AudioLoader;
    }());
})(SoundManager || (SoundManager = {}));
