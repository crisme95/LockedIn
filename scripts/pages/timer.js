// scripts/pages/timer.js

export function init() {
    const hoursInput = document.getElementById('hours');
    const minutesInput = document.getElementById('minutes');
    const secondsInput = document.getElementById('seconds');
    const startBtn = document.getElementById("start-btn");
    const pauseBtn = document.getElementById("pause-btn");
    const stopBtn = document.getElementById("stop-btn");

    startBtn.addEventListener("click", () => {
        const duration = ((parseInt(hoursInput.value || 0) * 3600) +
                        (parseInt(minutesInput.value || 0) * 60) +
                        (parseInt(secondsInput.value || 0))) * 1000;
        if (duration > 0) {
            chrome.runtime.sendMessage({ type: "START_TIMER", duration });
        }
    });

    pauseBtn.addEventListener("click", () => {
        chrome.storage.local.get("timerPaused", ({ timerPaused }) => {
            if (timerPaused) {
                chrome.runtime.sendMessage({ type: "CONTINUE_TIMER" });
            } else {
                chrome.runtime.sendMessage({ type: "PAUSE_TIMER" });
            }
        });
    });

    stopBtn.addEventListener("click", () => {
        chrome.runtime.sendMessage({ type: "STOP_TIMER" });
    });

    chrome.runtime.onMessage.addListener((request) => {
        if (request.type === "TIMER_UPDATE") {
            updateTimerDisplay(request.time);
        }
    });

    // Update UI based on storage state when popup opens
    chrome.storage.local.get(["lockedInState", "sessionEndTime", "timeRemainingWhenPaused", "timerPaused"], (data) => {
        updateButtonStates(data.lockedInState, data.timerPaused);
        if (data.lockedInState === 1) { // Running
            updateTimerDisplay(data.sessionEndTime - Date.now());
        } else if (data.lockedInState === 2) { // Paused
            updateTimerDisplay(data.timeRemainingWhenPaused);
        } else { // Stopped
            updateTimerDisplay(0);
        }
    });
}

async function updateButtonStates(state, isPaused) {
    const startBtn = document.getElementById("start-btn");
    const pauseBtn = document.getElementById("pause-btn");
    const stopBtn = document.getElementById("stop-btn");

    if (state === 0) { // Neutral/Stopped
        startBtn.disabled = false;
        pauseBtn.disabled = true;
        stopBtn.disabled = true;
        pauseBtn.textContent = "Pause";
    } else if (state === 1) { // Running
        startBtn.disabled = true;
        pauseBtn.disabled = false;
        stopBtn.disabled = false;
        pauseBtn.textContent = "Pause";
    } else if (state === 2) { // Paused
        startBtn.disabled = true;
        pauseBtn.disabled = false;
        stopBtn.disabled = false;
        pauseBtn.textContent = "Continue";
    }
}

async function updateTimerDisplay(ms) {
    const hoursEl = document.getElementById("hours");
    const minutesEl = document.getElementById("minutes");
    const secondsEl = document.getElementById("seconds");

    if (!hoursEl || !minutesEl || !secondsEl) return;

    if (ms <= 0) {
        hoursEl.value = "00";
        minutesEl.value = "00";
        secondsEl.value = "00";
        updateButtonStates(0);
        return;
    }

    const totalSeconds = Math.ceil(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    hoursEl.value = String(hours).padStart(2, '0');
    minutesEl.value = String(minutes).padStart(2, '0');
    secondsEl.value = String(seconds).padStart(2, '0');
    
    // Also update button states based on timer activity
    chrome.storage.local.get(["lockedInState", "timerPaused"], (data) => {
        updateButtonStates(data.lockedInState, data.timerPaused);
    });
}