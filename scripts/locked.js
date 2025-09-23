// scripts/locked.js

document.addEventListener("DOMContentLoaded", () => {
    const pinInput = document.getElementById("pin-input");
    const unlockBtn = document.getElementById("unlock-btn");
    const errorMessage = document.getElementById("error-message");
    const targetUrl = new URLSearchParams(window.location.search).get("url");

    unlockBtn.addEventListener("click", async () => {
        const { unlockPin } = await chrome.storage.local.get("unlockPin");
        if (pinInput.value === unlockPin) {
            const domain = new URL(targetUrl).hostname;
            await chrome.storage.session.set({ [`unlocked_${domain}`]: true });
            window.location.href = targetUrl;
        } else {
            errorMessage.textContent = "Incorrect PIN. Please try again.";
            pinInput.value = "";
        }
    });

    // Periodically check if the session is still active
    setInterval(() => {
        chrome.storage.local.get({ lockedInState: 0 }, ({ lockedInState }) => {
            if (lockedInState !== 1) {
                window.location.href = targetUrl;
            }
        });
    }, 1000);
});