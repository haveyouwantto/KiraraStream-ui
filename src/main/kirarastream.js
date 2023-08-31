import AudioPlayer from "./audio-player";
import { formatTime } from "./util";
import * as playerBar from './player-bar'
import { editSetting, loadSettings, settingChangeListener, settings } from "./settings";
import Playlist from "./playlist";

export default class KiraraStream {
    #baseUrl;
    #content;
    #bgCover;
    #player;

    #cwd;
    #playlist;

    constructor(baseUrl) {
        this.#baseUrl = baseUrl;
        this.#content = document.getElementById("content")
        this.#bgCover = document.getElementById('bgCover');
        this.#player = new AudioPlayer();
        this.init();
    }

    init() {
        this.#player.volume = settings.volume;

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
        
        this.#player.setEventListener('ended', () => {
            switch (settings.playMode) {
                case 0:
                    this.#player.pause();
                    break;
                case 2:
                    if (this.#playlist.isLast()) {
                        this.#player.pause();
                    } else {
                        this.playSong(this.#playlist.next());
                    }
                    break;
                case 3:
                    this.playSong(this.#playlist.next());
                    break;
                default:
                    break;
            }
        });

        playerBar.setEventListener('play', () => {
            this.#player.play();
        });

        playerBar.setEventListener('pause', () => {
            this.#player.pause();
        });

        playerBar.setEventListener('next', () => {
            this.playSong(this.#playlist.next());
        });

        playerBar.setEventListener('prev', () => {
            this.playSong(this.#playlist.prev());
        });

        playerBar.setEventListener('volumechange', volume => {
            this.#player.volume = Math.pow(volume, 2);
        });

        playerBar.setEventListener('seek', percentage => {
            this.#player.seekPercentage(percentage);
        });

        playerBar.setEventListener('playmodechange', mode => editSetting('playMode', mode))

        settingChangeListener.setEventListener('settingchange', e => {
            console.log(e);
            switch (e.key) {
                // case "sortFunc":
                //     filelist.setSortFunc(e.value);
                //     if (this.initialized) this.list();
                //     break
                case "playMode":
                    this.setPlayMode(e.value);
                    playerBar.setPlayModeIcon(e.value);
                    break;
                case "volume":
                    // this.#player.volume = e.value;
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
            location.hash = '';
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
            this.listTracks(album.id)
        })

        return div
    }

    getCoverUrl(id) {
        return this.#baseUrl + "/api/cover/" + id;
    }

    getTracks(albumid) {
        return fetch(this.#baseUrl + '/api/songs/' + albumid).then(r => r.json())
    }

    listTracks(albumid) {
        this.#content.innerHTML = '';
        this.#content.scrollTo(0, 0);
        this.getTracks(albumid).then(v => {

            const backdrop = document.createElement('div')
            backdrop.classList.add('backdrop')
            backdrop.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.25), rgba(0,0,0,0.75)), url("${this.getCoverUrl(v.cover_hash)}")`
            this.#content.appendChild(backdrop)

            const cover = document.createElement('img')
            cover.classList.add('album-cover')
            cover.src = this.getCoverUrl(v.cover_hash);
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


            v.songs.sort((song1, song2) => {
                // Compare by disc number
                if (song1.disc !== null && song2.disc !== null) {
                    if (song1.disc !== song2.disc) {
                        return song1.disc - song2.disc;
                    }
                } else if (song1.disc !== null) {
                    return -1; // Put songs with disc number ahead of those without
                } else if (song2.disc !== null) {
                    return 1; // Put songs with disc number ahead of those without
                }

                // Compare by track number
                if (song1.track !== null && song2.track !== null) {
                    if (song1.track !== song2.track) {
                        return song1.track - song2.track;
                    }
                } else if (song1.track !== null) {
                    return -1; // Put songs with track number ahead of those without
                } else if (song2.track !== null) {
                    return 1; // Put songs with track number ahead of those without
                }

                // Compare by title using localCompare for string comparison
                return song1.title.localeCompare(song2.title);
            });

            let currentDisc = null;

            for (let song of v.songs) {
                if (song.disc && song.disc !== currentDisc) {
                    currentDisc = song.disc;
                    const discTag = document.createElement('div');
                    discTag.textContent = `Disc ${currentDisc}`;
                    discTag.classList.add('disc-tag'); // You can style this class with CSS

                    contentDiv.appendChild(discTag);
                }

                contentDiv.appendChild(this.populateTrack(song));
            }

            const back = document.createElement('div')

            // Temp button
            back.innerText = '\ue003';
            back.classList.add('icon')
            back.style.position = 'fixed';
            back.style.top = 0;
            back.style.left = 0;

            back.addEventListener('click', () => {
                this.listAlbums();
            })
            contentDiv.appendChild(back);

            this.#cwd = new Playlist(v.songs)

            location.hash = '!/album/' + albumid;
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

        const fileInfo = document.createElement('div');
        fileInfo.classList.add('song-file-info')
        infoDiv.appendChild(fileInfo)

        if (song.bitrate > 320) {
            const quality = document.createElement('div')
            quality.classList.add('song-quality');
            quality.innerText = song.format;
            fileInfo.append(quality)
        }

        const duration = document.createElement('div')
        duration.classList.add('album-artist')
        duration.innerText = formatTime(song.duration);
        fileInfo.appendChild(duration)

        div.addEventListener('click', () => {
            console.log(song)
            this.playSong(song)
            this.#playlist = this.#cwd;
        })

        return div
    }

    playSong(song) {
        const coverUrl = this.getCoverUrl(song.cover_hash);
        this.#player.load(this.#baseUrl + '/api/play/' + song.id);
        this.#player.play();
        this.#bgCover.style.backgroundImage = `url("${coverUrl}")`

        if ('mediaSession' in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
                artwork: [
                    { src: coverUrl, type: 'image/jpeg' }
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
            navigator.mediaSession.setActionHandler('nexttrack', () => this.playSong(this.#playlist.next()));
            navigator.mediaSession.setActionHandler('previoustrack', () => this.playSong(this.#playlist.prev()));
        }


        playerBar.setSongName(song.title)
        playerBar.setSongArtist(song.artist)
        playerBar.setSongCover(coverUrl)
    }

    setPlayMode(mode) {
        switch (mode) {
            case 1:
                this.#player.loop = true;
                break
            case 0:
            case 2:
            case 3:
                this.#player.loop = false;
                break
        }
    }
}
