/**
 * @timer Runs User Interaction Logic Related to the Timer and Handles UI Visuals
 */



// temporary timer for visual updates
let timerInterval = null;

export function init() {

    // retrieve html elements by id
    const hours = document.getElementById('hours');
    const minutes = document.getElementById('minutes');
    const seconds = document.getElementById('seconds');
    const startBtn = document.getElementById("start-btn");
    const passKey = document.getElementById("passkey");

    // assign button functionality
    startBtn.addEventListener("click", () => {
        chrome.storage.local.get({ LockedInState: 0 }, UpdateStartBtn);
    });
    passKey.addEventListener("click", () => {
        chrome.storage.local.get({ LockedInState: 0 }, UpdatePassKeyBtn);
    });

    // initialize UI, calls function Render
    chrome.storage.local.get({ LockedInState: 0 }, Render);

    /*********************************************************************************************************************************************************************************************/

    /** 
     * Function Handles Static UI Elements
     * @param {*} data LockedInState :: {0:NeutralState, 1:InTimerState, 2:InBreakState}
    */
    function Render(data) {
        switch (data.LockedInState) {
            case 0:
                {
                    startBtn.textContent = "Start";
                    startBtn.style.backgroundColor = "#34da92";

                    passKey.value = "";

                    document.querySelectorAll("#timer input").forEach(input => {
                        input.readOnly = false;
                    });

                    chrome.storage.local.get(["TotalTime"], (data) => {
                        UpdateTimerDisplay(data.TotalTime);
                    });

                    console.log("start menu");
                    break;
                }
            case 1:
                {
                    startBtn.textContent = "Break";
                    startBtn.style.backgroundColor = "#7C7EF6";

                    passKey.value = "Stop?"
                    passKey.style.color = "#f94d4dff";

                    document.querySelectorAll("#timer input").forEach(input => {
                        input.readOnly = true;
                    });

                    InitiateUiTimer();
                    // chrome.storage.local.get(["StartingTime", "RemainingTime"], (data) => {
                    //     const elapsed = Date.now() - data.StartingTime;
                    //     const remaining = Math.max(0, data.RemainingTime - elapsed);

                    //     UpdateTimerDisplay(remaining);
                    // });

                    console.log("active menu");
                    break;
                }
            case 2:
                {
                    startBtn.textContent = "Continue";
                    startBtn.style.backgroundColor = "#01b8faff";

                    passKey.value = "Stop?"
                    passKey.style.color = "#f94d4dff";

                    document.querySelectorAll("#timer input").forEach(input => {
                        input.readOnly = true;
                    });

                    console.log("break menu");
                    break;
                }
        }
    }

    /**
     * Function Handles Start Button Functionality, Sets LockedInState
     * @param {*} data LockedInState :: {0:NeutralState, 1:InTimerState, 2:InBreakState}
     */
    function UpdateStartBtn(data) {
        switch (data.LockedInState) {
            case 0:
                {
                    StartTimer();
                    chrome.storage.local.set({ LockedInState: 1 });
                    break;
                }
            case 1:
                {
                    PauseTimer();
                    chrome.storage.local.set({ LockedInState: 2 });
                    break;
                }
            case 2:
                {
                    ContinueTimer();
                    chrome.storage.local.set({ LockedInState: 1 });
                    break;
                }
        }
        chrome.storage.local.get({ LockedInState: 0 }, Render);
    }

    /**
     * Function Handles PassKey Input Text Functionality, Sets LockedInState
     * @param {*} data LockedInState :: {0:NeutralState, 1:InTimerState, 2:InBreakState}
     */
    function UpdatePassKeyBtn(data) {
        if (data.LockedInState > 0) {
            chrome.storage.local.set({ LockedInState: 0 });
            clearInterval(timerInterval);
            chrome.storage.local.get(["TotalTime"], (data) => {
                UpdateTimerDisplay(data.TotalTime);
            });
            chrome.runtime.sendMessage({ type: "STOP_TIMER" }, (response) => { });
        }
        chrome.storage.local.get({ LockedInState: 0 }, Render);
    }

    /**
     * Function Handles PassKey Input Text Functionality, Sets LockedInState
     * @param {*} data LockedInState :: {0:NeutralState, 1:InTimerState, 2:InBreakState}
     */
    function UpdatePassKeyBtnEnd(data) {
        if (data.LockedInState > 0) {
            chrome.storage.local.set({ LockedInState: 0 });
            clearInterval(timerInterval);
            chrome.storage.local.get(["TotalTime"], (data) => {
                UpdateTimerDisplay(data.TotalTime);
            });
        }
        chrome.storage.local.get({ LockedInState: 0 }, Render);
    }   

    /**
     * Function Converts and Stores Input Time
     * 
     * Notifies background.js With Message START_TIMER
     */
    function StartTimer() {
        const totalTime = ((parseInt(hours.value * 3600) || 0) + (parseInt(minutes.value * 60) || 0) + (parseInt(seconds.value) || 0)) * 1000;
        chrome.storage.local.set({ TotalTime: totalTime });
        chrome.storage.local.set({ RemainingTime: totalTime });

        chrome.runtime.sendMessage({ type: "START_TIMER", duration: totalTime }, (response) => {
            chrome.storage.local.get(["StartingTime", "RemainingTime"], (data) => {
                const elapsed = Date.now() - data.StartingTime;
                const remaining = Math.max(0, data.RemainingTime - elapsed);

                UpdateTimerDisplay(remaining);
            });
        });
    }

    /**
     * Notifies background.js With Message PAUSE_TIMER
     */
    function PauseTimer() {
        chrome.runtime.sendMessage({ type: "PAUSE_TIMER" }, (response) => { });
        clearInterval(timerInterval);
    }

    /**
     * Notifies background.js With Message CONTINUE_TIMER
     */
    function ContinueTimer() {
        chrome.runtime.sendMessage({ type: "CONTINUE_TIMER" }, (response) => { });
    }

    /**
     * Handles Dynamically Updating UI Timer Module
     * 
     * Accesses chrome.storage.local
     */
    function InitiateUiTimer() {
        if (timerInterval) clearInterval(timerInterval);

        timerInterval = setInterval(() => {
            chrome.storage.local.get(["StartingTime", "RemainingTime"], (data) => {
                if (!data.StartingTime || !data.RemainingTime) return;

                const elapsed = Date.now() - data.StartingTime;
                const remaining = Math.max(0, data.RemainingTime - elapsed);

                UpdateTimerDisplay(remaining);

                if (remaining <= 0) {
                    clearInterval(timerInterval);
                    UpdateTimerDisplay(0);

                    chrome.storage.local.get({ LockedInState: 0 }, UpdatePassKeyBtnEnd);
                }
            });
        }, 1000);
    }

    /**
     * Translates ms Into Military Time
     * @param {*} ms Milliseconds
     */
    function UpdateTimerDisplay(ms) {
        const seconds = Math.ceil((ms / 1000) % 60);
        const minutes = Math.floor((ms / 1000 / 60) % 60);
        const hours = Math.floor(ms / 1000 / 60 / 60);

        document.getElementById("hours").value = String(hours).padStart(2, '0');
        document.getElementById("minutes").value = String(minutes).padStart(2, '0');
        document.getElementById("seconds").value = String(seconds).padStart(2, '0');
    }
}
