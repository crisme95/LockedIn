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

    // Event listener for the button to show distracting domains.
    document.getElementById('show-distracting-domains').addEventListener('click', displayDistractingDomains);
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
