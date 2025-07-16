/* Create group constants for grouping tabs as "Productive" or "Distracting". */
const DISTRACTING = {
    TITLE: "Distracting",
    COLOR: "red"
}

const PRODUCTIVE = {
    TITLE: "Productive",
    COLOR: "green"
}

/* Create context menu items for marking "Productive" and "Distracting" tabs. */
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "markProductive",
        title: `Mark as ${PRODUCTIVE.TITLE}`,
        contexts: ["all"]
    });

    chrome.contextMenus.create({
        id: "markDistracting",
        title: `Mark as ${DISTRACTING.TITLE}`,
        contexts: ["all"]
    });
});

/* Handle context menu clicks to mark tabs as "Productive" or "Distracting". If 
the tab is marked "Productive", true is passed. Else, false. */
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === "markProductive") {
        await groupTab(tab, true);
    } else if (info.menuItemId === "markDistracting") {
        await groupTab(tab, false);
    }
});

/* Function to group a tab as either "Productive" or "Distracting". It checks if a
group with the same title already exists. If it does, it uses that group. If not, 
it creates a new group with the specified title and color. */

async function groupTab(tab, isProductive) {
    // Get group info based on whether the tab is productive or distracting
    const groupInfo = isProductive ? PRODUCTIVE : DISTRACTING;
    const groupTitle = groupInfo.TITLE;
    const groupColor = groupInfo.COLOR;

    try {
        // Query the existing tab groups with the same title in the current window
        const existingGroups = await chrome.tabGroups.query({ title: groupTitle, windowId: tab.windowId });

        // Now we check if a group with the same title already exists.
        let groupId;
        if (existingGroups.length > 0) {
            // If a group already exists, use its ID.
            groupId = existingGroups[0].id;
        } else {
            // If no group exists, create a new one.
            // First, group the tab which returns a new group ID.
            const newGroupId = await chrome.tabs.group({ tabIds: [tab.id] });
            // Then, update the newly created group with the correct title and color.
            await chrome.tabGroups.update(newGroupId, {
                title: groupTitle,
                color: groupColor
            });
            groupId = newGroupId;
        }

        // Move the tab into its respective group.
        await chrome.tabs.group({
            tabIds: [tab.id],
            groupId: groupId
        });

    } catch (error) {
        console.error("Error grouping tab:", error);
    }

}

chrome.alarms.create("workTimer", {
    periodInMinutes: 1 / 60,
})

chrome.alarms.onAlarm.addListener((alarm) => {
    if(alarm.name === "workTimer"){
        chrome.storage.local.get(["timer", "isRunning"], (res) => {
            if(res.isRunning){
                let timer = res.timer + 1
                let isRunning = true
                if(timer === 10){
                    this.registration.showNotification("workTimer", {
                        body: "Work session complete",
                    })
                    timer = 0
                    isRunning = false
                }
                chrome.storage.local.set({
                    timer, 
                    isRunning,
                })
            }
        })
    }
})

chrome.storage.local.get(["timer", "isRunning"], (res) => {
    chrome.storage.local.set({
        timer: "timer" in res ? res.timer : 0,
        isRunning: "isRunning" in res ? res.isRunning : false,
    })
})