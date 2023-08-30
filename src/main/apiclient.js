import AudioPlayer from "./audio-player";
import { formatTime } from "./util";
import * as playerBar from './player-bar'
import { editSetting, loadSettings, settingChangeListener } from "./settings";

export default class ApiClient {
    #baseUrl;
    #content;
    #bgCover;
    #player;

    constructor(baseUrl) {
        this.#baseUrl = baseUrl;
        this.#content = document.getElementById("content")
        this.#bgCover = document.getElementById('bgCover');
        this.#player = new AudioPlayer();
        this.init();
    }

    init(){

        this.#player.setEventListener('load', url => {
            playerBar.setDuration(this.#player.duration);
        });

        this.#player.setEventListener('play', () => {
            playerBar.setPaused(false);
        });

        this.#player.setEventListener('pause', () => {
            playerBar.setPaused(true);
        });

        this.#player.setEventListener('volumechange', volume => {
            editSetting('volume', volume);
        });

        this.#player.setEventListener('timeupdate', time => {
            playerBar.setDuration(this.#player.duration);
            playerBar.setProgress(time);
            playerBar.setBufferLength(this.#player.bufferLength);
        });

        playerBar.setEventListener('play', () => {
            this.#player.play();
        });

        playerBar.setEventListener('pause', () => {
            this.#player.pause();
        });

        playerBar.setEventListener('next', () => {
            this.play(this.playlist.next().name);
        });

        playerBar.setEventListener('prev', () => {
            this.play(this.playlist.prev().name);
        });

        playerBar.setEventListener('volumechange', volume => {
            this.#player.volume = Math.pow(volume, 2);
        });

        playerBar.setEventListener('seek', percentage => {
            this.#player.seekPercentage(percentage);
        });

        
        settingChangeListener.setEventListener('settingchange', e => {
            console.log(e);
            switch (e.key) {
                // case "sortFunc":
                //     filelist.setSortFunc(e.value);
                //     if (this.initialized) this.list();
                //     break
                case "playMode":
                    // this.setPlayMode(e.value);
                    playerBar.setPlayModeIcon(e.value);
                    break;
                case "volume":
                    playerBar.setVolume(Math.sqrt(e.value));
                    break;
                // case "language":
                //     if (e.value === 'auto') setLocale(navigator.language);
                //     else setLocale(e.value);
                //     break;
            }
            // updateSettingsItem(e.key, e.value);
        });

        loadSettings();
    }

    getAlbums() {
        return fetch(this.#baseUrl + '/api/albums').then(r => r.json())
    }

    listAlbums() {
        this.#content.innerHTML = '';
        this.#content.scrollTo(0, 0);
        const albumList = document.createElement('div');
        albumList.classList.add('album-list')
        this.#content.appendChild(albumList)

        this.getAlbums().then(v => {
            for (let album of v) {
                albumList.appendChild(this.populateAlbum(album))
            }
        })
    }

    populateAlbum(album) {
        const div = document.createElement('div')
        div.classList.add('album-container')
        const img = document.createElement('img')
        img.src = this.getCoverUrl(album.cover_hash);
        img.setAttribute('loading', 'lazy');
        div.appendChild(img)
        const infoDiv = document.createElement('div')
        infoDiv.classList.add('album-info');
        div.appendChild(infoDiv);

        const title = document.createElement('div')
        title.classList.add('album-title')
        title.classList.add('album-title-icon')
        title.innerText = album.title ? album.title : "<unknown>";
        infoDiv.appendChild(title)

        const artist = document.createElement('div')
        artist.classList.add('album-artist')
        artist.classList.add('album-artist-icon')
        artist.innerText = album.artist;
        infoDiv.appendChild(artist)

        div.addEventListener('click', () => {
            this.listTracks(album)
        })

        return div
    }

    getCoverUrl(id) {
        return this.#baseUrl + "/api/cover/" + id;
    }

    getTracks(album) {
        return fetch(this.#baseUrl + '/api/songs/' + album.id).then(r => r.json())
    }

    listTracks(album) {
        this.#content.innerHTML = '';
        this.#content.scrollTo(0, 0);
        this.getTracks(album).then(v => {

            const backdrop = document.createElement('div')
            backdrop.classList.add('backdrop')
            backdrop.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.25), rgba(0,0,0,0.75)), url("${this.getCoverUrl(album.cover_hash)}")`
            this.#content.appendChild(backdrop)

            const cover = document.createElement('img')
            cover.classList.add('album-cover')
            cover.src = this.getCoverUrl(album.cover_hash);
            cover.setAttribute('loading', 'lazy');
            backdrop.append(cover)

            const albumInfoDiv = document.createElement('div')
            albumInfoDiv.classList.add('album-view-info')
            backdrop.append(albumInfoDiv)

            const title = document.createElement('div')
            title.classList.add('album-title-large')
            title.innerText = v.title;
            albumInfoDiv.append(title)

            const artist = document.createElement('div')
            // artist.classList.add('album-title-large')
            artist.innerText = v.release_year ? `${v.artist} · ${v.release_year}` : v.artist;
            albumInfoDiv.append(artist)

            const contentDiv = document.createElement('div');
            contentDiv.classList.add('album-content')
            this.#content.append(contentDiv)


            for (let song of v.songs) {
                contentDiv.appendChild(this.populateTrack(song))
            }

            const back = document.createElement('div')

            // Temp button
            back.innerText = '<';
            back.style.fontSize = '32px';
            back.style.position = 'fixed';
            back.style.top = 0;
            back.style.left = 0;

            back.addEventListener('click', () => {
                this.listAlbums();
            })
            contentDiv.appendChild(back)
        })
    }

    populateTrack(song) {
        const div = document.createElement('div')
        div.classList.add('song-container')
        const cover = document.createElement('img')
        cover.classList.add('song-cover')
        cover.src = this.getCoverUrl(song.cover_hash);
        div.appendChild(cover)
        const infoDiv = document.createElement('div')
        infoDiv.classList.add('song-info');
        div.appendChild(infoDiv);

        const title = document.createElement('div')
        title.classList.add('song-title')
        title.innerText = song.track ? `${song.track}. ${song.title}` : song.title;
        infoDiv.appendChild(title)

        const artist = document.createElement('div')
        artist.classList.add('album-artist')
        artist.innerText = song.artist;
        infoDiv.appendChild(artist)

        const duration = document.createElement('div')
        duration.classList.add('album-artist')
        duration.innerText = formatTime(song.duration);
        infoDiv.appendChild(duration)

        div.addEventListener('click', () => {
            console.log(song)
            this.playSong(song)
        })

        return div
    }

    playSong(song) {
        this.#player.load(this.#baseUrl + '/api/play/' + song.id);
        this.#player.play();
        this.#bgCover.style.backgroundImage = `url("${this.getCoverUrl(song.cover_hash)}")`

        if ('mediaSession' in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
                artwork: [
                    { src: this.getCoverUrl(song.cover_hash), type: 'image/jpeg' }
                ],
                title: song.title,
                artist: song.artist,
                album: song.album
            });
            navigator.mediaSession.setActionHandler('play', () => {
                this.#player.play();
            });
            navigator.mediaSession.setActionHandler('pause', () => {
                this.#player.pause();
            });
            navigator.mediaSession.setActionHandler('stop', () => this.#player.stop());
            navigator.mediaSession.setActionHandler('seekbackward', () => { this.#player.seek(this.#player.currentTime - 5) });
            navigator.mediaSession.setActionHandler('seekforward', () => { this.#player.seek(this.#player.currentTime + 5) });
            navigator.mediaSession.setActionHandler('seekto', action => { this.#player.seek(action.seekTime) });
            // navigator.mediaSession.setActionHandler('nexttrack', () => this.play(this.playlist.next().name));
            // navigator.mediaSession.setActionHandler('previoustrack', () => this.play(this.playlist.prev().name));
        }


        playerBar.setSong(song)
    }
}
