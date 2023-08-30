import { settings } from "./settings";
import EventListener from "./event-listener";

let audioInit = false;
export default class AudioPlayer {
    #audio;

    constructor() {
        this.listener = new EventListener();
        this.#audio = document.getElementById('audio')


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