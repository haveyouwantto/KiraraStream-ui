export default class ApiClient {
    #baseUrl;
    #content;
    #bgCover;

    constructor(baseUrl) {
        this.#baseUrl = baseUrl;
        this.#content = document.getElementById("content")
        this.#bgCover = document.getElementById('bgCover');
    }

    getAlbums() {
        return fetch(this.#baseUrl + '/api/albums').then(r => r.json())
    }

    listAlbums() {
        this.#content.innerHTML = '';
        this.#content.scrollTo(0, 0);
        this.getAlbums().then(v => {
            for (let album of v) {
                this.#content.appendChild(this.populateAlbum(album))
            }
        })
    }

    populateAlbum(album) {
        const div = document.createElement('div')
        div.classList.add('album-container')
        const img = document.createElement('img')
        img.src = this.getCoverUrl(album.cover_hash);
        div.appendChild(img)
        const infoDiv = document.createElement('div')
        infoDiv.classList.add('album-info');
        div.appendChild(infoDiv);

        const title = document.createElement('div')
        title.classList.add('album-title')
        title.innerText = album.title ? album.title : "<unknown>";
        infoDiv.appendChild(title)

        const artist = document.createElement('div')
        artist.classList.add('album-artist')
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
            backdrop.style.backgroundImage = `url("${this.getCoverUrl(album.cover_hash)}")`
            this.#content.appendChild(backdrop)

            const cover = document.createElement('img')
            cover.classList.add('album-cover')
            cover.src = this.getCoverUrl(album.cover_hash);
            this.#content.append(cover)

            const albumInfoDiv = document.createElement('div')
            albumInfoDiv.classList.add('album-view-info')
            this.#content.append(albumInfoDiv)

            const title = document.createElement('div')
            title.classList.add('album-title-large')
            title.innerText = v.album_title;
            albumInfoDiv.append(title)

            const artist = document.createElement('div')
            // artist.classList.add('album-title-large')
            artist.innerText = v.album_artist;
            albumInfoDiv.append(artist)

            const contentDiv = document.createElement('div');
            contentDiv.classList.add('album-content')
            this.#content.append(contentDiv)


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

        div.addEventListener('click', () => {
            console.log(song)
            this.playSong(song)
        })

        return div
    }

    playSong(song) {
        document.getElementById('audio').src = this.#baseUrl + '/api/play/' + song.id;
        this.#bgCover.style.backgroundImage = `url("${this.getCoverUrl(song.cover_hash)}")`
    }
}