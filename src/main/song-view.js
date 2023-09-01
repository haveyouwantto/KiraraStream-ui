import LrcSync from "./lrcsync";
import { $, generateSongInfo } from "./util";

const song = $("#song");
// const songBack = $("#songBack");
const left = $(".song-view-left");
const right = $(".song-view-right");

const songBgCover = $("#songBgCover");
const songViewCover = left.querySelector('.song-view-cover');
const songViewTitle = left.querySelector('.song-view-title');
const songViewArtist = left.querySelector('.song-view-artist');
const songViewFormat = left.querySelector('.song-view-format');

const songViewLyrics = right.querySelector('.song-view-lyrics');

const lrc = new LrcSync();

lrc.onlyrics = lyrics => {
    document.querySelectorAll('.lyrics-highlight').forEach(e => {
        e.classList.remove('lyrics-highlight')
    })
    const target = $(`#lyrics-${lyrics.ord}`)
    target.classList.add('lyrics-highlight')
    target.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
    })
}

export function setSongViewVisible(v) {
    if (v) {
        song.classList.add('song-view-open')
    } else {
        song.classList.remove('song-view-open')
    }
}

export function isSongViewVisible() {
    return song.classList.contains('song-view-open')
}

export function setCover(url) {
    song.style.backgroundImage = `url("${url}")`
    songViewCover.src = url
}

export function setSongInfo(song) {
    songViewTitle.innerText = song.title;
    songViewArtist.innerText = song.artist;
    songViewFormat.innerText = generateSongInfo(song)
}

export function setLyrics(lyrics) {
    songViewLyrics.innerHTML = '';
    if (lyrics) {

        let ord = 0;
        const cleaned = cleanLyrics(lyrics.lyrics);
        console.log(cleaned)
        for (const line of cleaned) {
            const lineDiv = document.createElement('span')
            lineDiv.classList.add('lyrics')
            lineDiv.id = 'lyrics-' + ord;
            lineDiv.innerText = line.text;
            songViewLyrics.append(lineDiv)
            line.ord = ord++;

            if(line.text.endsWith('\n')) songViewLyrics.append(document.createElement('br'))
        }
        lrc.load(cleaned);
    } else {
        lrc.clear();

        const lineDiv = document.createElement('span')
        lineDiv.classList.add('lyrics')
        lineDiv.innerText = 'Lyrics not found';
        songViewLyrics.append(lineDiv)
    }

}

function cleanLyrics(lyrics) {
    // Sort the lyrics by time
    lyrics.sort((a, b) => a.time - b.time);

    // Merge lyrics with the same time and replace " / " with newline
    const cleanedLyrics = [];
    let currentLyric = null;

    for (const lyricObj of lyrics) {
        if (currentLyric === null) {
            currentLyric = { ...lyricObj, text: lyricObj.text.replace(" / ", "\n") };
        } else if (currentLyric.time === lyricObj.time) {
            currentLyric.text += lyricObj.text.replace(" / ", "\n");
        } else {
            cleanedLyrics.push(currentLyric);
            currentLyric = { ...lyricObj, text: lyricObj.text.replace(" / ", "\n") };
        }
    }

    if (currentLyric !== null) {
        cleanedLyrics.push(currentLyric);
    }

    return cleanedLyrics;
}

export function updateLyrics(time) {
    lrc.update(time)
}

right.addEventListener('click',e=>{
    right.classList.add('narrow-hidden')
    left.classList.remove('narrow-hidden')
})

left.addEventListener('click',e=>{
    right.classList.remove('narrow-hidden')
    left.classList.add('narrow-hidden')
})

// songBack.addEventListener('click', () => {
//     setSongViewVisible(false)
// })