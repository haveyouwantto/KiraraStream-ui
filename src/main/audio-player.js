import { settings } from "./settings";
import EventListener from "./event-listener";

let audioInit = false;
export default class AudioPlayer {
    #audio;

    constructor() {
        this.listener = new EventListener();
        this.#audio = document.getElementById('audio')

        this.ctx = new AudioContext({ sampleRate: 16000 });
        this.visualizer = this.ctx.createAnalyser();
        this.audioNode = this.ctx.createMediaElementSource(this.#audio);
        this.audioNode.connect(this.visualizer).connect(this.ctx.destination);

        this.canvas = document.getElementById('audioVisualizer');
        this.canvasContext = this.canvas.getContext('2d');

        new ResizeObserver(entries => {
            for (let entry of entries) {
                const target = entry.target;
                console.log(`Element size changed: ${target.offsetWidth} x ${target.offsetHeight}`);

                const dpr = window.devicePixelRatio;
                let { width: cssWidth, height: cssHeight } = this.canvas.getBoundingClientRect();
                this.canvas.width = dpr * cssWidth;
                this.canvas.height = dpr * cssHeight;
            }
        }).observe(this.canvas);


        if (!audioInit) {
            this.#audio.addEventListener('pause', e => {
                this.pause();
            });

            this.#audio.addEventListener('play', e => {
                this.play();
            })

            this.#audio.addEventListener('timeupdate', e => {
                this.listener.on('timeupdate', this.currentTime);
            })

            this.#audio.addEventListener('ended', () => {
                this.listener.on('ended');
            });

            this.#audio.addEventListener('error', e => {
                if (!this.#audio.src.startsWith('null')) {
                    this.listener.on('error', e);
                }
            })

            let updateVisualizer = () => {
                let dataArray = new Uint8Array(this.visualizer.frequencyBinCount);
                this.visualizer.getByteFrequencyData(dataArray);
                this.canvasContext.clearRect(0, 0, this.canvas.width, this.canvas.height)
                this.canvasContext.fillStyle = 'white';

                let bars = 50;
                let step = dataArray.length / bars;
                let width = this.canvas.width / bars;

                let j = 0;
                for (let i = 0; j < dataArray.length; i++) {
                    j = parseInt(i * step);
                    const element = dataArray[j];
                    let height = element / 255 * this.canvas.height;
                    this.canvasContext.fillRect(i * width, this.canvas.height - height, width * 0.75, height);
                }
                requestAnimationFrame(updateVisualizer)
            }
            requestAnimationFrame(updateVisualizer)

            audioInit = true;
        }
    }

    load(url) {
        return new Promise((resolve, reject) => {
            this.#audio.src = url;
            this.seek(0);
            resolve(url);
        })
    }

    play() {
        this.#audio.play();
        this.listener.on('play', this.currentTime);
        this.ctx.resume()
    }

    pause() {
        this.#audio.pause();
        this.listener.on('pause', this.currentTime);
    }

    get duration() {
        return this.#audio.duration;
    }

    get currentTime() {
        return this.#audio.currentTime;
    }

    seek(seconds) {
        this.#audio.currentTime = seconds;
        this.listener.on('timeupdate', seconds);
    }

    seekPercentage(percentage) {
        this.seek(this.duration * percentage);
    }

    stop() {
        this.pause();
        this.#audio.src = "null:"
        this.listener.on('stop');
    }

    get paused() {
        return this.#audio.paused;
    }

    set paused(value) {
        if (value) this.pause();
        else this.play();
    }

    get ended() {
        return this.currentTime >= this.duration;
    }

    get loop() {
        return this.#audio.loop;
    }

    set loop(value) {
        this.#audio.loop = value;
        this.listener.on('loopchange', value);
    }

    get volume() {
        return this.#audio.volume;
    }

    set volume(value) {
        this.#audio.volume = value;
        this.listener.on('volumechange', value);
    }

    replay() {
        this.seek(0);
        this.play();
    }

    get bufferLength() {
        for (let i = 0; i < this.#audio.buffered.length; i++) {
            let endTime = this.#audio.buffered.end(i);
            if (endTime > this.#audio.currentTime) {
                return endTime;
            }
        }
        return 0;
    }

    setEventListener(e, v) {
        this.listener.setEventListener(e, v)
    }

}