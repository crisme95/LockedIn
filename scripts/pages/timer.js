// scripts/pages/timer.js

export function init() {
    const hoursInput = document.getElementById('hours');
    const minutesInput = document.getElementById('minutes');
    const secondsInput = document.getElementById('seconds');
    const startBtn = document.getElementById("start-btn");
    const stopBtn = document.getElementById("passkey");

    startBtn.addEventListener("click", () => {
        const duration = ((parseInt(hoursInput.value || 0) * 3600) +
                        (parseInt(minutesInput.value || 0) * 60) +
                        (parseInt(secondsInput.value || 0))) * 1000;

        if (duration > 0) {
            chrome.runtime.sendMessage({ type: "START_TIMER", duration });
            startBtn.disabled = true;
            stopBtn.disabled = false;
        }
    });

    stopBtn.addEventListener("click", () => {
        chrome.runtime.sendMessage({ type: "STOP_TIMER" });
        startBtn.disabled = false;
        stopBtn.disabled = true;
    });

    // Listen for updates from the background script
    chrome.runtime.onMessage.addListener((request) => {
        if (request.type === "TIMER_UPDATE") {
            updateTimerDisplay(request.time);
            if (request.time <= 0) {
                startBtn.disabled = false;
                stopBtn.disabled = true;
            } else {
                startBtn.disabled = true;
                stopBtn.disabled = false;
            }
        }
    });

    // Check initial state on load
    chrome.storage.local.get("sessionEndTime", ({ sessionEndTime }) => {
        if (sessionEndTime && sessionEndTime > Date.now()) {
            updateTimerDisplay(sessionEndTime - Date.now());
            startBtn.disabled = true;
            stopBtn.disabled = false;
        } else {
            updateTimerDisplay(0);
            startBtn.disabled = false;
            stopBtn.disabled = true;
        }
    });
}

function updateTimerDisplay(ms) {
    const hoursEl = document.getElementById("hours");
    const minutesEl = document.getElementById("minutes");
    const secondsEl = document.getElementById("seconds");

    if (!hoursEl || !minutesEl || !secondsEl) return;

    if (ms <= 0) {
        hoursEl.value = "00";
        minutesEl.value = "00";
        secondsEl.value = "00";
        return;
    }

    const totalSeconds = Math.ceil(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    hoursEl.value = String(hours).padStart(2, '0');
    minutesEl.value = String(minutes).padStart(2, '0');
    secondsEl.value = String(seconds).padStart(2, '0');
}