// scripts/pages/timer.js

export function init() {
    const hoursInput = document.getElementById('hours');
    const minutesInput = document.getElementById('minutes');
    const secondsInput = document.getElementById('seconds');
    const startPauseBtn = document.getElementById("start-pause-btn");
    const stopBtn = document.getElementById("stop-btn");

    startPauseBtn.addEventListener("click", () => {
        chrome.storage.local.get(["lockedInState"], ({ lockedInState }) => {
            if (lockedInState === 1) { // Running
                chrome.runtime.sendMessage({ type: "PAUSE_TIMER" });
            } else { // Stopped or Paused
                const duration = ((parseInt(hoursInput.value || 0) * 3600) +
                    (parseInt(minutesInput.value || 0) * 60) +
                    (parseInt(secondsInput.value || 0))) * 1000;

                if (lockedInState === 2) { // Paused
                     chrome.runtime.sendMessage({ type: "CONTINUE_TIMER" });
                } else if (duration > 0) { // Stopped
                    chrome.runtime.sendMessage({ type: "START_TIMER", duration });
                }
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

    // Listen for changes in storage and update the UI
    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'local' && changes.lockedInState) {
            updateButtonStates(changes.lockedInState.newValue);
        }
    });

    // Update UI based on storage state when popup opens
    chrome.storage.local.get(["lockedInState", "sessionEndTime", "timeRemainingWhenPaused"], (data) => {
        updateButtonStates(data.lockedInState);
        if (data.lockedInState === 1) { // Running
            updateTimerDisplay(data.sessionEndTime - Date.now());
        } else if (data.lockedInState === 2) { // Paused
            updateTimerDisplay(data.timeRemainingWhenPaused);
        } else { // Stopped
            updateTimerDisplay(0);
        }
    });
}

function updateButtonStates(state) {
    return new Promise((resolve) => {
        const startPauseBtn = document.getElementById("start-pause-btn");
        const stopBtn = document.getElementById("stop-btn");

        if (state === 0) { // Neutral/Stopped
            startPauseBtn.textContent = "Start";
            startPauseBtn.disabled = false;
            stopBtn.style.display = "none";
            startPauseBtn.classList.remove("paused");
        } else if (state === 1) { // Running
            startPauseBtn.textContent = "Pause";
            startPauseBtn.disabled = false;
            stopBtn.style.display = "inline-block";
            startPauseBtn.classList.remove("paused");
        } else if (state === 2) { // Paused
            startPauseBtn.textContent = "Start";
            startPauseBtn.disabled = false;
            stopBtn.style.display = "inline-block";
            startPauseBtn.classList.add("paused");
        }

        // Use requestAnimationFrame to ensure DOM updates are complete
        requestAnimationFrame(() => resolve());
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
    chrome.storage.local.get(["lockedInState"], (data) => {
        updateButtonStates(data.lockedInState);
    });
}