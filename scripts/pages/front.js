// Locked In State  0 = Standby, 1 = Locked In, 2 = Break

let taskData = [];
let timerInterval = null;

export function init() {

    const hours = document.getElementById('hours');
    const minutes = document.getElementById('minutes');
    const seconds = document.getElementById('seconds');

    const startBtn = document.getElementById("start-btn");
    const passKey = document.getElementById("passkey");

    chrome.storage.local.get({ LockedInState: 0 }, Render);



    startBtn.addEventListener("click", () => {
        chrome.storage.local.get({ LockedInState: 0 }, UpdateStartBtn);
    });

    passKey.addEventListener("click", () => {
        chrome.storage.local.get({ LockedInState: 0 }, UpdatePassKeyBtn);
    });



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
                    chrome.storage.local.get(["StartingTime", "RemainingTime"], (data) => {
                        const elapsed = Date.now() - data.StartingTime;
                        const remaining = Math.max(0, data.RemainingTime - elapsed);

                        UpdateTimerDisplay(remaining);
                    });

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

    function UpdatePassKeyBtn(data) {
        if (data.LockedInState > 0) {
            chrome.storage.local.set({ LockedInState: 0 });
            clearInterval(timerInterval);
            chrome.storage.local.get(["TotalTime"], (data) => {
                UpdateTimerDisplay(data.TotalTime);
            });
        }
        chrome.storage.local.get({ LockedInState: 0 }, Render);
    }

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

    function PauseTimer() {
        chrome.runtime.sendMessage({ type: "PAUSE_TIMER" }, (response) => { });
        clearInterval(timerInterval);
    }

    function ContinueTimer() {
        chrome.runtime.sendMessage({ type: "CONTINUE_TIMER" }, (response) => { });
    }

    // -------------------------------------------------

    function InitiateUiTimer() {
        if (timerInterval) clearInterval(timerInterval);

        timerInterval = setInterval(() => {
            chrome.storage.local.get(["StartingTime", "RemainingTime"], (data) => {
                if (!data.StartingTime || !data.RemainingTime) return;

                const elapsed = Date.now() - data.StartingTime;
                const remaining = Math.max(0, data.RemainingTime - elapsed);

                //chrome.storage.local.set({ RemainingTime: remaining });

                UpdateTimerDisplay(remaining);

                if (remaining <= 0) {
                    clearInterval(timerInterval);
                    UpdateTimerDisplay(0);

                    chrome.storage.local.get({ LockedInState: 0 }, UpdatePassKeyBtn);
                }
            });
        }, 1000);
    }

    function UpdateTimerDisplay(ms) {
        const seconds = Math.floor((ms / 1000) % 60);
        const minutes = Math.floor((ms / 1000 / 60) % 60);
        const hours = Math.floor(ms / 1000 / 60 / 60);

        document.getElementById("hours").value = String(hours).padStart(2, '0');
        document.getElementById("minutes").value = String(minutes).padStart(2, '0');
        document.getElementById("seconds").value = String(seconds).padStart(2, '0');
    }



    // -------------------------------------------------------------------



    const input = document.getElementById("task-input");
    const addBtn = document.getElementById("add-task");
    const list = document.getElementById("task-list");

    // Load saved tasks
    chrome.storage.local.get(['tasks'], (result) => {
        taskData = result.tasks || [];
        render();
    });

    addBtn.addEventListener("click", () => {
        const taskText = input.value.trim();
        if (taskText === "") return;

        taskData.push({ text: taskText });
        input.value = "";
        saveTasks();
        render();
    });

    function render() {
        list.innerHTML = "";

        // render everything from storage
        taskData.forEach((task, index) => {
            const newTask = document.createElement("li");
            newTask.className = "task-item";

            const taskInput = document.createElement("input");
            taskInput.type = "text";
            taskInput.value = task.text;

            taskInput.addEventListener("input", () => {
                taskData[index].text = taskInput.value;
                saveTasks();
            });

            const removeBtn = document.createElement("span");
            removeBtn.className = "remove-task";
            removeBtn.textContent = "✕";

            removeBtn.addEventListener("click", () => {
                taskData.splice(index, 1);
                saveTasks();
                render();
            });

            newTask.appendChild(removeBtn);
            newTask.appendChild(taskInput);
            list.appendChild(newTask);
        });
    }

    function saveTasks() {
        chrome.storage.local.set({ tasks: taskData });
    }
}
