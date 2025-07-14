const pageDisplay = document.getElementById("current-page");
const contentContainer = document.getElementById("content");
const buttons = document.querySelectorAll("#page-buttons button");

const PAGE_MAP = {
  1: {html: "../html/pages/1.html", script: "scripts/pages/1.js"},
  2: {html: "../html/pages/2.html", script: "scripts/pages/2.js"},
  3: {html: "../html/pages/3.html", script: "scripts/pages/3.js"}
};

// Cache for page DOM elements and loaded modules
const pageCache = {};
const initialized = new Set();

// Create the Page or Load it if it exists already
async function LoadPage(pageNum) {
  pageDisplay.textContent = pageNum;

  // If page DOM is cached, show and return
  if (pageCache[pageNum]) {
    Object.entries(pageCache).forEach(([num, container]) => {
      container.style.display = (num === String(pageNum)) ? "block" : "none";
    });
    return;
  }

  // 1. Fetch and insert HTML
  const { html: htmlPath, script: scriptPath } = PAGE_MAP[pageNum];
  const htmlText = await fetch(chrome.runtime.getURL(htmlPath)).then(res => res.text());

  // Create a container div for this page's content
  const pageDiv = document.createElement("div");
  pageDiv.id = `page-${pageNum}`; // macro for id to display correct page
  pageDiv.style.display = "block";

  // Hide other pages
  Object.values(pageCache).forEach(div => div.style.display = "none");

  pageDiv.innerHTML = htmlText;
  contentContainer.appendChild(pageDiv);

  // Cache the container
  pageCache[pageNum] = pageDiv;

  // 2. Import and initialize script (only once)
  if (!initialized.has(pageNum)) {
    const pageScript = await import(chrome.runtime.getURL(scriptPath));
    if (pageScript && typeof pageScript.init === 'function') {
      pageScript.init();
    }
    initialized.add(pageNum);
  }
}

buttons.forEach(btn => {
  btn.addEventListener("click", () => {
    const page = btn.getAttribute("data-page");
    LoadPage(page);
  });
});

// Default
LoadPage(1);
