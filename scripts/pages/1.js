let enteredTime = 0;

export function init() {
    // document.getElementById('tab-group-dropdown').addEventListener('click', async () => {
    //     console.log("hallo");
    // });

    // document.getElementById('create-group').addEventListener('click', async () => {
    //     await createTabGroup();
    // });

    // document.getElementById('close-group').addEventListener('click', async () => {
    //     const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    //     if (!tab || tab.groupId === chrome.tabGroups.TAB_GROUP_ID_NONE) {
    //         alert('You are not in a tab group.');
    //         return;
    //     }
    //     const tabsInGroup = await chrome.tabs.query({ groupId: tab.groupId });
    //     const tabIds = tabsInGroup.map(t => t.id);
    //     if (tabIds.length > 0) {
    //         await chrome.tabs.remove(tabIds);
    //     }
    // });

    // document.getElementById('new-session').addEventListener('click', async () => {
    //     const groups = await getTabGroups();
    //     const prevDropdown = document.getElementById('tab-group-dropdown');
    //     if (prevDropdown) prevDropdown.remove();
    //     const prevBtn = document.getElementById('open-group-btn');
    //     if (prevBtn) prevBtn.remove();

    //     if (groups.length > 0) {
    //         const dropdown = document.createElement('select');
    //         dropdown.id = 'tab-group-dropdown';
    //         groups.forEach(group => {
    //             const option = document.createElement('option');
    //             option.value = group.id;
    //             option.textContent = group.title || `Group ${group.id}`;
    //             dropdown.appendChild(option);
    //         });
    //         const openBtn = document.createElement('button');
    //         openBtn.textContent = 'Start Session';
    //         openBtn.id = 'open-group-btn';
    //         document.body.appendChild(dropdown);
    //         document.body.appendChild(openBtn);
    //         openBtn.addEventListener('click', async () => {
    //             // Logic for starting session
    //         });
    //     } else {
    //         // Logic for when no groups exist
    //     }
    // });

    // Timer --------------------------------------------
    // Initalization
    const timeDisplay = document.getElementById('time');
    const timeInput   = document.getElementById('time-input');
    const submitBtn   = document.querySelector('button[type="submit"]');
    const startBtn    = document.getElementById('start-timer');
    const resetBtn    = document.getElementById('reset-timer');

    // Error Checking
    if (!timeDisplay || !timeInput || !submitBtn) {
        console.warn('Timer elements not found; check your HTML ids.');
        return;
    }

    submitBtn.addEventListener('click', e => {
        e.preventDefault();
        // Stores inputted time 
        enteredTime = parseInt(timeInput.value, 10) * 60 || 0;
        chrome.storage.local.set({ timerThreshold: enteredTime }, () => {
            const mins = String(Math.floor(enteredTime/60)).padStart(2, '0');
            const secs = String(enteredTime % 60).padStart(2, '0');
            timeDisplay.textContent = `${mins}:${secs}`;
            });
    });
    // Starts Timer
    startBtn?.addEventListener('click', () => {
        chrome.storage.local.get('isRunning', res => {
            // Change bool 
            const now = !res.isRunning;
            chrome.storage.local.set({ isRunning: now }, () => {
                // Change Text
                startBtn.textContent = now ? 'Pause timer' : 'Start timer';
            });
        });
    });

    // Resets Timer
    resetBtn?.addEventListener('click', () => {
        // Change vars and text
        chrome.storage.local.set({ timer: 0, isRunning: false }, () => {
            startBtn.textContent = 'Start timer';
        });
    });
    //
    updateTime()
    setInterval(updateTime, 1000);

    // Event listener for the button to show distracting domains.
    document.getElementById('show-distracting-domains').addEventListener('click', displayDistractingDomains);
}
// Updates the display of the timer
function updateDisplay(seconds, el) {
  const m = String(Math.floor(seconds/60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  el.textContent = `${m}:${s}`;
}
// Checks timer values, updates vars and timer text
function updateTime() {
  chrome.storage.local.get(['timer','timerThreshold'], res => {
    const elapsed = res.timer || 0; // How many seconds have elapsed
    const thresh  = res.timerThreshold || 0; // User's target duration in seconds
    const left    = Math.max(thresh - elapsed, 0); // Seconds left
    const el      = document.getElementById('time'); // Display element 
    if (el) updateDisplay(left, el);
  });
}

/*
 * Fetches the 'distractingDomains' from chrome.storage.sync and displays them
 * in a list on the page.
 */
async function displayDistractingDomains() {
    const container = document.getElementById('distracting-domains-container');
    // Clear any previous list
    container.innerHTML = '';

    const storageKey = "distractingDomains";
    const result = await chrome.storage.sync.get([storageKey]);
    
    const domains = result[storageKey] || [];

    if (domains.length === 0) {
        container.textContent = "You haven't marked any sites as distracting yet.";
        return;
    }

    const ul = document.createElement('ul');
    domains.forEach(domain => {
        const li = document.createElement('li');
        li.textContent = domain;
        ul.appendChild(li);
    });

    container.appendChild(ul);
}

// async function createTabGroup() {
//     const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
//     if (tab) {
//         await chrome.tabs.group({ tabIds: [tab.id] });
//     }
// }

// async function getTabGroups() {
//     return await chrome.tabGroups.query({});
// }

// Calls init once the html doc fully parsed
document.addEventListener('DOMContentLoaded',init);