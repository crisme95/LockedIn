// Tab Manager -------------------------------------------
/* Create group constants for grouping tabs as "Productive" or "Distracting". */
const DISTRACTING = {
    COLOR: "red",
    TITLE: "Distracting"
};

const PRODUCTIVE = {
    COLOR: "green",
    TITLE: "Productive"
};

// Retrieve the current LockedInState from storage
function getLockedInState() {
    return new Promise(function (resolve) {
        chrome.storage.local.get({
            LockedInState: 0
        }, function (data) {
            resolve(data.LockedInState);
        });
    });
}

/* Create context menu items for marking "Productive" or "Distracting" tabs. */
chrome.runtime.onInstalled.addListener(function () {
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

    chrome.alarms.create("periodicCheck", {
        delayInMinutes: 1 / 60, // 1 second delay
        periodInMinutes: 1 / 60
    });
});

// Listen for the alarm and check all tabs
chrome.alarms.onAlarm.addListener(function (alarm) {
    if (alarm.name === "periodicCheck") {
        chrome.tabs.query({}, function (tabs) {
            tabs.forEach(function (tab) {
                checkTab(tab);
            });
        });
    }
});


/* Handle context menu clicks to mark tabs as "Productive" or "Distracting". */
chrome.contextMenus.onClicked.addListener(async function (info, tab) {
    // A tab might be closed between the right-click and the menu selection.
    try {
        await chrome.tabs.get(tab.id);
        if (info.menuItemId === "markProductive") {
            await groupTab(tab, true);
        } else if (info.menuItemId === "markDistracting") {
            await groupTab(tab, false);
        }
    } catch (error) {
        console.log(
            "Tab not found, likely closed before action could complete."
        );
    }
});

/* Function to group a tab as either "Productive" or "Distracting". */
async function groupTab(tab, isProductive) {
    const groupInfo = (
        isProductive
            ? PRODUCTIVE
            : DISTRACTING
    );
    const groupTitle = groupInfo.TITLE;
    const groupColor = groupInfo.COLOR;

    try {
        const existingGroups = await chrome.tabGroups.query({
            title: groupTitle,
            windowId: tab.windowId
        });

        let groupId;
        if (existingGroups.length > 0) {
            groupId = existingGroups[0].id;
        } else {
            const newGroupId = await chrome.tabs.group({
                tabIds: [tab.id]
            });
            await chrome.tabGroups.update(newGroupId, {
                color: groupColor,
                title: groupTitle
            });
            groupId = newGroupId;
        }

        await chrome.tabs.group({
            groupId: groupId,
            tabIds: [tab.id]
        });

        // If distracting, save its domain and tab info.
        if (!isProductive) {
            saveDomainAsDistracting(tab.url);
            saveTabAsDistracting(tab);
        }

    } catch (error) {
        console.error("Error grouping tab:", error);
    }
}

/**
 * Saves the distracting tab's domain to chrome.storage.sync.
 * @param {string} urlString The URL of the tab.
 */
function saveDomainAsDistracting(urlString) {
    if (!urlString || !urlString.startsWith("http")) {
        return;
    }
    const url = new URL(urlString);
    const domain = url.hostname;
    const storageKey = "distractingDomains";

    chrome.storage.sync.get([storageKey], function (result) {
        const domains = result[storageKey] || [];
        if (!domains.includes(domain)) {
            domains.push(domain);
            domains.sort();
            const dataToSet = {};
            dataToSet[storageKey] = domains;
            chrome.storage.sync.set(dataToSet, function () {
                console.log(`Saved ${domain} to distracting domains list.`);
            });
        }
    });
}

/**
 * Checks if a domain is in the distracting domains list.
 * @param {string} domain The domain to check.
 * @returns {Promise<boolean>} True if the domain is distracting.
 */
function isDomainDistracting(domain) {
    const storageKey = "distractingDomains";
    return new Promise(function (resolve) {
        chrome.storage.sync.get([storageKey], function (result) {
            const domains = result[storageKey] || [];
            resolve(domains.includes(domain));
        });
    });
}

/**
 * Saves the distracting tab's URL and Title to chrome.storage.sync.
 * @param {chrome.tabs.Tab} tab The tab object to save.
 */
function saveTabAsDistracting(tab) {
    if (!tab.url || !tab.url.startsWith("http")) {
        return;
    }

    const storageKey = "distractingTabs";
    const newTabInfo = {
        title: tab.title,
        url: tab.url
    };

    chrome.storage.sync.get([storageKey], function (result) {
        const tabs = result[storageKey] || [];
        const isAlreadySaved = tabs.some(function (savedTab) {
            return savedTab.url === newTabInfo.url;
        });

        if (!isAlreadySaved) {
            tabs.push(newTabInfo);
            const dataToSet = {};
            dataToSet[storageKey] = tabs;
            chrome.storage.sync.set(dataToSet, function () {
                console.log(`Saved ${newTabInfo.url} to distracting tabs.`);
            });
        }
    });
}

/**
 * Checks if a tab is distracting and takes appropriate action.
 * @param {chrome.tabs.Tab} tab The tab object to check.
 */
async function checkTab(tab) {
    // Check if locked in session is active
    if (await getLockedInState() !== 1) {
        return;
    }
    console.log("Checking tab");

    if (!tab || !tab.id || !tab.url || !tab.url.startsWith("http")) {
        console.log("Tab not valid for checking.");
        return;
    }

    const url = new URL(tab.url);
    const domain = url.hostname;

    // Ignore extension pages
    if (url.protocol === "chrome-extension:") {
        return;
    }

    const isDistracting = await isDomainDistracting(domain);
    if (!isDistracting) {
        return;
    }

    const sessionKey = `unlocked_${domain}`;
    const sessionResult = await chrome.storage.session.get([sessionKey]);
    if (sessionResult[sessionKey]) {
        return;
    }

    const lockedUrl = chrome.runtime.getURL("html/locked.html");
    const redirectUrl = `${lockedUrl}?url=${encodeURIComponent(tab.url)}`;
    chrome.tabs.update(tab.id, {
        url: redirectUrl
    });
}

// Event listener for when a user switches to a different tab
chrome.tabs.onActivated.addListener(function (activeInfo) {
    chrome.tabs.get(activeInfo.tabId, function (tab) {
        checkTab(tab);
        updateSessionStats(tab);
    });
});

// Event listener for when a tab's URL changes
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    // Only check if the URL has changed to avoid redundant checks
    if (changeInfo.url) {
        checkTab(tab);
        updateSessionStats(tab);
    }
});


// Timer -------------------------------

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.type === "START_TIMER") {
        chrome.alarms.create("LockedInSession", {
            when: Date.now() + message.duration
        });
        chrome.storage.local.set({
            StartingTime: Date.now()
        });

        console.log("created timer");
        initializeSessionStats();
        chrome.action.setIcon({
            path: "/assets/lock.png"
        }); // Change icon to locked
    } else if (message.type === "PAUSE_TIMER") {
        chrome.alarms.clear("LockedInSession");
        chrome.storage.local.get([
            "StartingTime",
            "RemainingTime"
        ], function (data) {
            const elapsedTime = Date.now() - data.StartingTime;
            chrome.storage.local.set({
                RemainingTime: (data.RemainingTime - elapsedTime)
            });
        });
        chrome.action.setIcon({
            path: "/assets/unlock.png"
        }); // Change icon to unlocked

        console.log("Alarm \"Paused\"");
    } else if (message.type === "CONTINUE_TIMER") {
        chrome.storage.local.get(["RemainingTime"], function (data) {
            chrome.alarms.create("LockedInSession", {
                when: Date.now() + data.RemainingTime
            });

            chrome.storage.local.set({
                StartingTime: Date.now()
            });
            chrome.action.setIcon({
                path: "/assets/lock.png"
            }); // Change icon to locked
        });
    } else if (message.type === "STOP_TIMER") {
        chrome.alarms.clear("LockedInSession");
        chrome.storage.local.set({
            RemainingTime: (0)
        });
    }

    sendResponse();
    return true;
});

chrome.alarms.onAlarm.addListener(async function (alarm) {
    if (alarm.name === "LockedInSession") {
        console.log("Lockdown timer ended!");
        chrome.action.setIcon({
            path: "/assets/unlock.png"
        }); // Change icon to unlocked
        chrome.storage.local.set({
            LockedInState: 0
        });

        // Clear all session-unlocked domains
        const sessionData = await chrome.storage.session.get(null);
        const keysToRemove = [];
        Object.keys(sessionData).forEach(function (key) {
            if (key.startsWith("unlocked_")) {
                keysToRemove.push(key);
            }
        });
        await chrome.storage.session.remove(keysToRemove);
        console.log("Cleared all session-unlocked domains.");

        // Get the currently active tab to finalize stats
        const [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true
        });
        if (tab) {
            const sessionEndData = {};
            sessionEndData[STATS.SESSION_END] = Date.now();
            await updateSessionStats(tab);
            chrome.storage.local.set(sessionEndData);
        }

        chrome.windows.create({
            height: 690,
            type: "popup",
            url: "../html/alert.html",
            width: 865
        });

        // Send a message to the popup to load page 3
        chrome.runtime.sendMessage({
            page: 3,
            type: "LOAD_PAGE"
        });
    }
});

// StatTrak -------------------------------
// Constants for session statistics keys
const STATS = {
    CURRENT_TAB: "currentTab",
    DISTRACTING_TIME: "distractingTime",
    LAST_ACTIVE_TIME: "lastActiveTime",
    PRODUCTIVE_TIME: "productiveTime",
    SESSION_END: "sessionEnd",
    SESSION_START: "sessionStart"
};

function initializeSessionStats() {
    const initialStats = {};
    initialStats[STATS.CURRENT_TAB] = null;
    initialStats[STATS.DISTRACTING_TIME] = 0;
    initialStats[STATS.LAST_ACTIVE_TIME] = Date.now();
    initialStats[STATS.PRODUCTIVE_TIME] = 0;
    initialStats[STATS.SESSION_END] = null;
    initialStats[STATS.SESSION_START] = Date.now();
    chrome.storage.local.set(initialStats);
}

async function updateSessionStats(newTab) {
    if (!newTab.url || !newTab.url.startsWith("http")) {
        return;
    }

    const now = Date.now();
    const stats = await chrome.storage.local.get(Object.values(STATS));

    // Calculate time spent on previous tab
    if (stats.lastActiveTime && stats.currentTab) {
        const timeSpent = now - stats.lastActiveTime;
        const isDistracting = await isDomainDistracting(
            new URL(stats.currentTab).hostname
        );

        const updatedStats = {};
        updatedStats[STATS.CURRENT_TAB] = newTab.url;
        updatedStats[STATS.LAST_ACTIVE_TIME] = now;

        if (isDistracting) {
            updatedStats[STATS.DISTRACTING_TIME] =
                (stats.distractingTime || 0) + timeSpent;
        } else {
            updatedStats[STATS.PRODUCTIVE_TIME] =
                (stats.productiveTime || 0) + timeSpent;
        }

        await chrome.storage.local.set(updatedStats);
    } else {
        // First tab of session
        const firstTabStats = {};
        firstTabStats[STATS.CURRENT_TAB] = newTab.url;
        firstTabStats[STATS.LAST_ACTIVE_TIME] = now;
        await chrome.storage.local.set(firstTabStats);
    }
}