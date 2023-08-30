import EventListener from "./event-listener";
import { $, formatTime } from "./util";
import { settings, editSetting } from "./settings";

const progressBarSlider = $("#progress-slider");
const progressBarInner = $("#playtime");
const bufferedBar = $("#bufferedtime");

const controlsLeft = $("#controlsLeft");
const songCover = $("#songCover");
const songTitle = $("#songTitle");
const timeDisplay = $("#timeDisplay");
const durationDisplay = $("#durationDisplay");

const playButton = $("#play");
const nextButton = $("#next");
const prevButton = $("#prev");
const playModeButton = $("#playMode");
const volumeControlSlider = $("#volume-slider");
const volumeControlInner = $("#volume-inner");

let currentDuration = 0;
let playerAdapter = new EventListener();
let paused = true;

export function setProgress(currentTime) {
    progressBarInner.style.width = (currentTime / currentDuration * 100) + "%";
    timeDisplay.innerText = formatTime(currentTime);
}

export function setDuration(duration) {
    if (isNaN(duration)) duration = Infinity;
    durationDisplay.innerText = formatTime(duration);
    currentDuration = duration;
}

export function setBufferLength(value) {
    bufferedBar.style.width = (value / currentDuration * 100) + "%";
}

export function setPaused(value) {
    if (value) {
        playButton.innerText = '\ue000';
    } else {
        playButton.innerText = '\ue00f';
    }
    paused = value;
}

export function setEventListener(event, listener) {
    playerAdapter.setEventListener(event, listener);
}

function togglePause() {
    if (paused) {
        playerAdapter.on('play');
    } else {
        playerAdapter.on('pause');
    }
}

playButton.addEventListener('click', togglePause);

progressBarSlider.addEventListener('input', e => {
    playerAdapter.on('seek', progressBarSlider.value);
});

nextButton.addEventListener('click', e => {
    playerAdapter.on('next');
})

prevButton.addEventListener('click', e => {
    playerAdapter.on('prev');
});


export function setVolume(percentage) {
    volumeControlSlider.value = percentage * 100;
    volumeControlInner.style.width = (percentage * 100) + "%";
}

volumeControlSlider.addEventListener('input', e => {
    playerAdapter.on('volumechange', volumeControlSlider.value / 100);
})

export function setSong(song) {
    songTitle.textContent = song.title;
    songCover.src = "/api/cover/" + song.cover_hash;
}

export function setPlayerLoading(value) {
    if (value) {
        progressBarInner.classList.add('player-loading');
    } else {
        progressBarInner.classList.remove('player-loading')
    }
}

controlsLeft.addEventListener('click', e => {
    playerAdapter.on('titleclick');
})

export function setPlayModeIcon(mode) {
    switch (mode) {
        case 0:
            playModeButton.innerText = '\ue00b';
            break;
        case 1:
            playModeButton.innerText = '\ue00c';
            break;
        case 2:
            playModeButton.innerText = '\ue00d';
            break;
        case 3:
            playModeButton.innerText = '\ue00e';
            break;
        default:
            break;
    }
}


playModeButton.addEventListener('click', e => {
    let playMode = settings.playMode + 1;
    if (playMode == 4) playMode = 0;
    playerAdapter.on('playmodechange', playMode);
});