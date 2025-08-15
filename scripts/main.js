/**
 * Main extension controller that manages page loading and navigation.
 * Handles dynamic content loading and script initialization for different views.
 * Pages are loaded based on user navigation or system events.
 */

/**
 * Page configuration map
 * Key: page number
 * Value: object containing arrays of HTML files and their corresponding JavaScript modules
 * Multiple HTML/JS files can be loaded for a single page (e.g., timer + task view)
 */
const PAGE_MAP = {
    1: { html: ["../html/pages/timer.html", "../html/pages/task.html"], script: ["scripts/pages/timer.js", "scripts/pages/task.js"] },
    2: { html: ["../html/pages/task.html"], script: ["scripts/pages/task.js"] },
    3: { html: ["../html/pages/statTrak.html"], script: ["scripts/pages/statTrak.js"] },
    4: { html: ["../html/pages/settings.html"], script: ["scripts/pages/settings.js"] }
};

// Initialize DOM references
const contentContainer = document.getElementById("content");
const buttons = document.querySelectorAll("#page-buttons button");

// Set up navigation event handlers
buttons.forEach(btn => {
    btn.addEventListener("click", () => {
        const page = btn.id;
        console.log(page);
        LoadPage(page);
    });
});

// Load the default view (timer + task page)
LoadPage(1);

/**
 * Loads and initializes a page based on its number.
 * 1. Clears current content
 * 2. Loads all HTML files for the page
 * 3. Initializes associated JavaScript modules
 * 
 * @param {number} pageNum - The page number to load from PAGE_MAP
 */
export async function LoadPage(pageNum) {
    const { html: htmlArray, script: scriptArray } = PAGE_MAP[pageNum];

    // Load HTML content
    const htmlPaths = Array.isArray(htmlArray) ? htmlArray : [htmlArray];
    contentContainer.innerHTML = "";
    for (const htmlPath of htmlPaths) {
        const html = await fetch(chrome.runtime.getURL(htmlPath)).then(res => res.text());
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = html;
        while (tempDiv.firstChild) {
            contentContainer.appendChild(tempDiv.firstChild);
        }
    }

    // Initialize associated JavaScript modules
    const scriptPaths = Array.isArray(scriptArray) ? scriptArray : [scriptArray];
    for (const scriptPath of scriptPaths) {
        const module = await import(chrome.runtime.getURL(scriptPath));
        if (module && typeof module.init === "function") {
            module.init();
        }
    }
}

/**
 * Message handler for service worker communications
 * Supports remote page loading through LOAD_PAGE events
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "LOAD_PAGE") {
        LoadPage(request.page);
    }
});