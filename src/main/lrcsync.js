export default class LrcSync {
    constructor() {
        this.lyrics = [];
        this.index = 0;
        this.onload = null;
        this.onlyrics = null;
        this.onseek = null;
        this.lastTime = 0;
    }

    load(lyrics) {
        this.lyrics = lyrics;
        this.index = 0;
    }

    update(t) {
        if (t < this.lastTime) this.seek(t)
        else {
            if (this.lyrics.length > 0) {
                while (true) {
                    let lrc = this.lyrics[this.index];
                    if (lrc == null || lrc.time > t) {
                        break;
                    } else {
                        this.index++;
                        if (this.onlyrics != null) {
                            this.onlyrics(lrc);
                        }
                    }
                }
            }
        }
        this.lastTime = t;
    }

    seek(t) {
        if (this.lyrics.length > 0) {
            let i = 0;
            while (true) {
                let lrc = this.lyrics[i];
                if (lrc == null || lrc.time > t) {
                    if (this.onlyrics != null) {
                        this.onlyrics(this.lyrics[Math.min(i - 1, this.lyrics.length - 1)]);
                    }
                    this.index = i;
                    break;
                } else {
                    i++;
                }
            }
        }
    }

    clear() {
        this.index = 0;
        this.lyrics = [];
    }
}