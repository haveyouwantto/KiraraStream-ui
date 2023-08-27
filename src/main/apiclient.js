export default class ApiClient {
    #baseUrl;
    #albumDiv;

    constructor(baseUrl) {
        this.#baseUrl = baseUrl;
        this.#albumDiv = document.getElementById("albumList")
    }

    getAlbums() {
        return fetch(this.#baseUrl + '/api/albums').then(r => r.json())
    }

    listAlbums() {
        this.#albumDiv.innerHTML = '';
        this.getAlbums().then(v => {
            for (let album of v) {
                this.#albumDiv.appendChild(this.populateAlbum(album))
            }
        })
    }

    populateAlbum(album) {
        const div = document.createElement('div')
        div.classList.add('album-container')
        const img = document.createElement('img')
        img.src = this.getAlbumCoverUrl(album.id);
        div.appendChild(img)
        const infoDiv = document.createElement('div')
        infoDiv.classList.add('album-info');
        div.appendChild(infoDiv);

        const title = document.createElement('div')
        title.classList.add('album-title')
        title.innerText = album.title;
        infoDiv.appendChild(title)

        const artist = document.createElement('div')
        artist.classList.add('album-artist')
        artist.innerText = album.artist;
        infoDiv.appendChild(artist)

        div.addEventListener('click', () => {
            this.listTracks(album.id)
        })

        return div
    }

    getAlbumCoverUrl(albumid) {
        return this.#baseUrl + "/api/cover/album/" + albumid;
    }

    getTracks(albumid) {
        return fetch(this.#baseUrl + '/api/songs/' + albumid).then(r => r.json())
    }

    listTracks(albumid) {
        this.#albumDiv.innerHTML = '';
        this.getTracks(albumid).then(v => {

            const backdrop = document.createElement('div')
            backdrop.classList.add('backdrop')
            backdrop.style.backgroundImage = `url("${this.getAlbumCoverUrl(albumid)}")`
            this.#albumDiv.appendChild(backdrop)

            const contentDiv = document.createElement('div');
            contentDiv.classList.add('album-content')

            const cover = document.createElement('img')
            cover.classList.add('album-cover')
            cover.src = this.getAlbumCoverUrl(albumid);
            contentDiv.appendChild(cover)
            this.#albumDiv.append(contentDiv)


            for (let song of v.songs) {
                contentDiv.appendChild(this.populateTrack(song))
            }

            const back = document.createElement('div')
            back.innerText = '<';
            back.style.fontSize = '32px';
            back.addEventListener('click', () => {
                this.listAlbums();
            })
            contentDiv.appendChild(back)
        })
    }

    populateTrack(song) {
        const div = document.createElement('div')
        div.classList.add('song-container')
        const track = document.createElement('div')
        track.classList.add('song-track')
        track.innerText = song.track;
        div.appendChild(track)
        const infoDiv = document.createElement('div')
        infoDiv.classList.add('song-info');
        div.appendChild(infoDiv);

        const title = document.createElement('div')
        title.classList.add('song-title')
        title.innerText = song.title;
        infoDiv.appendChild(title)

        const artist = document.createElement('div')
        artist.classList.add('album-artist')
        artist.innerText = song.artist;
        infoDiv.appendChild(artist)

        div.addEventListener('click', () => {
            console.log(song)
            this.playSong(song)
        })

        return div
    }

    playSong(song) {
        document.getElementById('audio').src = this.#baseUrl + '/api/play/' + song.id;
        document.getElementById('bgCover').style.backgroundImage = `url("${this.#baseUrl + "/api/cover/song/" + song.id}")`
    }
}