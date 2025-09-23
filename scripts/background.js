// scripts/background.js

// Tab Manager -------------------------------------------
const DISTRACTING = { COLOR: "red", TITLE: "Distracting" };
const PRODUCTIVE = { COLOR: "green", TITLE: "Productive" };

let timerInterval;

/* Create context menu items for marking tabs. */
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        contexts: ["all"],
        id: "markProductive",
        title: `Mark as ${PRODUCTIVE.TITLE}`
    });

    chrome.contextMenus.create({
        contexts: ["all"],
        id: "markDistracting",
        title: `Mark as ${DISTRACTING.TITLE}`
    });

    // TODO: This periodic check is resource-intensive. Carry out testing to see if it's absolutely necessary.
    chrome.alarms.create("periodicCheck", { periodInMinutes: 1 / 60 });
});

/* Handle context menu clicks. */
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    try {
        await chrome.tabs.get(tab.id);
        if (info.menuItemId === "markProductive") await groupTab(tab, true);
        else if (info.menuItemId === "markDistracting") await groupTab(tab, false);
    } catch (error) {
        console.log("Tab not found, likely closed.");
    }
});

/* Group a tab as "Productive" or "Distracting". */
async function groupTab(tab, isProductive) {
    const groupInfo = isProductive ? PRODUCTIVE : DISTRACTING;
    try {
        const [existingGroup] = await chrome.tabGroups.query({
            title: groupInfo.TITLE,
            windowId: tab.windowId
        });
        const groupId = existingGroup ? existingGroup.id : await chrome.tabs.group({ tabIds: [tab.id] });
        if (!existingGroup) {
            await chrome.tabGroups.update(groupId, { color: groupInfo.COLOR, title: groupInfo.TITLE });
        }
        await chrome.tabs.group({ groupId, tabIds: [tab.id] });
        if (!isProductive) saveDomainAsDistracting(tab.url);
    } catch (error) {
        console.error("Error grouping tab:", error);
    }
}

function saveDomainAsDistracting(urlString) {
    if (!urlString || !urlString.startsWith("http")) return;
    const domain = new URL(urlString).hostname;
    chrome.storage.sync.get({ distractingDomains: [] }, ({ distractingDomains }) => {
        if (!distractingDomains.includes(domain)) {
            distractingDomains.push(domain);
            distractingDomains.sort();
            chrome.storage.sync.set({ distractingDomains });
        }
    });
}

async function isDomainDistracting(domain) {
    const { distractingDomains = [] } = await chrome.storage.sync.get("distractingDomains");
    return distractingDomains.includes(domain);
}

async function checkTab(tab) {
    const { lockedInState } = await chrome.storage.local.get({ lockedInState: 0 });
    if (lockedInState !== 1 || !tab || !tab.id || !tab.url || !tab.url.startsWith("http")) return;

    if (tab.groupId) {
        try {
            const tabGroup = await chrome.tabGroups.get(tab.groupId);
            if (tabGroup.title === PRODUCTIVE.TITLE) return;
        } catch (error) { /* Ignore error if group not found */ }
    }

    const url = new URL(tab.url);
    if (url.protocol === "chrome-extension:") return;

    const domain = url.hostname;
    if (await isDomainDistracting(domain)) {
        const { [`unlocked_${domain}`]: isUnlocked } = await chrome.storage.session.get(`unlocked_${domain}`);
        if (!isUnlocked) {
            const lockedUrl = chrome.runtime.getURL("html/locked.html");
            chrome.tabs.update(tab.id, { url: `${lockedUrl}?url=${encodeURIComponent(tab.url)}` });
        }
    }
}

// Event listeners for tab checks
chrome.tabs.onActivated.addListener(({ tabId }) => chrome.tabs.get(tabId, checkTab));
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.url) checkTab(tab);
});
chrome.alarms.onAlarm.addListener(alarm => {
    if (alarm.name === "periodicCheck") {
        chrome.tabs.query({}, tabs => tabs.forEach(checkTab));
    }
});

// Timer Logic -------------------------------------------

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.type) {
        case "START_TIMER":
            const endTime = Date.now() + message.duration;
            chrome.storage.local.set({ sessionEndTime: endTime, lockedInState: 1, timerPaused: false });
            startTimerInterval();
            chrome.action.setIcon({ path: "/assets/lock.png" });
            break;
        case "PAUSE_TIMER":
            pauseTimer();
            break;
        case "CONTINUE_TIMER":
            continueTimer();
            break;
        case "STOP_TIMER":
            stopTimer();
            break;
    }
    return true; // Indicates asynchronous response
});

function startTimerInterval() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(async () => {
        const { sessionEndTime, timerPaused } = await chrome.storage.local.get(["sessionEndTime", "timerPaused"]);
        if (!sessionEndTime || timerPaused) {
            return;
        }
        const remainingTime = sessionEndTime - Date.now();
        if (remainingTime <= 0) {
            stopTimer();
            chrome.windows.create({
                height: 690, type: "popup", url: "../html/alert.html", width: 865
            });
        } else {
            chrome.runtime.sendMessage({ type: "TIMER_UPDATE", time: remainingTime });
        }
    }, 1000);
}

async function pauseTimer() {
    if (timerInterval) clearInterval(timerInterval);
    const { sessionEndTime } = await chrome.storage.local.get("sessionEndTime");
    const remainingTime = sessionEndTime - Date.now();
    chrome.storage.local.set({ timerPaused: true, timeRemainingWhenPaused: remainingTime, lockedInState: 2 });
}

async function continueTimer() {
    const { timeRemainingWhenPaused } = await chrome.storage.local.get("timeRemainingWhenPaused");
    const newEndTime = Date.now() + timeRemainingWhenPaused;
    chrome.storage.local.set({ sessionEndTime: newEndTime, timerPaused: false, lockedInState: 1 });
    startTimerInterval();
}

function stopTimer() {
    if (timerInterval) clearInterval(timerInterval);
    chrome.storage.local.set({ sessionEndTime: null, lockedInState: 0, timerPaused: false, timeRemainingWhenPaused: 0 });
    chrome.runtime.sendMessage({ type: "TIMER_UPDATE", time: 0 });
    chrome.action.setIcon({ path: "/assets/unlock.png" });
}