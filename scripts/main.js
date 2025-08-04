/**
 * @main Runs On StartUp of Extension, Functions as the Container to All HTML and JS Scripts
 */



// dictionary with hardcoded reference to html and corresponding scripts
const PAGE_MAP = {
    1: { html: ["../html/pages/timer.html", "../html/pages/task.html"], script: ["scripts/pages/timer.js", "scripts/pages/task.js"] },
    2: { html: ["../html/pages/task.html"], script: ["scripts/pages/task.js"] },
    3: { html: ["../html/pages/3.html"], script: ["scripts/pages/3.js"] },
    4: { html: ["../html/pages/4.html"], script: ["scripts/pages/4.js"] }
};

// retrieve html elements by id
const contentContainer = document.getElementById("content");
const buttons = document.querySelectorAll("#page-buttons button");

// assign button functionality
buttons.forEach(btn => {
    btn.addEventListener("click", () => {
        const page = btn.id;
        console.log(page);
        LoadPage(page);
    });
});

// default page on startup
LoadPage(1);

/*********************************************************************************************************************************************************************************************/

async function LoadPage(pageNum) {
    const { html: htmlArray, script: scriptArray } = PAGE_MAP[pageNum];

    // loop and retrive all html
    const htmlPaths = Array.isArray(htmlArray) ? htmlArray : [htmlArray]; // error checking
    contentContainer.innerHTML = ""; // clear html content
    for (const htmlPath of htmlPaths) {
        const html = await fetch(chrome.runtime.getURL(htmlPath)).then(res => res.text());
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = html;
        while (tempDiv.firstChild) {
            contentContainer.appendChild(tempDiv.firstChild);
        }
    }

    // loop and run all page scripts
    const scriptPaths = Array.isArray(scriptArray) ? scriptArray : [scriptArray]; // error checking
    for (const scriptPath of scriptPaths) {
        const module = await import(chrome.runtime.getURL(scriptPath));
        if (module && typeof module.init === "function") { // error checking
            module.init(); // call init() from scripts
        }
    }
}
