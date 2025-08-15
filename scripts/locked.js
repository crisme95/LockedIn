/*
    locked.js
    Handles PIN verification for accessing blocked sites.
    Shows a PIN entry form when users attempt to access sites marked as distracting.
    On successful PIN entry, grants temporary access for the current session.
*/

document.addEventListener("DOMContentLoaded", function () {
    // Get DOM elements for PIN entry interface
    const pinInput = document.getElementById("pin-input");
    const unlockBtn = document.getElementById("unlock-btn");
    const errorMessage = document.getElementById("error-message");

    // Extract the blocked URL from query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const targetUrl = urlParams.get("url");

    // Handle PIN verification when unlock button is clicked
    unlockBtn.addEventListener("click", async function () {
        const enteredPin = pinInput.value;
        const { unlockPin } = await chrome.storage.local.get("unlockPin");

        if (enteredPin === unlockPin) {
            // Grant session-based access for this specific domain
            const url = new URL(targetUrl);
            const domain = url.hostname;
            const sessionKey = `unlocked_${domain}`;
            const sessionData = {};
            sessionData[sessionKey] = true;
            await chrome.storage.session.set(sessionData);


            // Redirect back to the originally requested URL
            window.location.href = targetUrl;
        } else {
            errorMessage.textContent = "Incorrect PIN. Please try again.";
            pinInput.value = "";
        }
    });

    // Periodically check if LockedIn session is still active
    // If session ends, redirect to the target URL (which will be unlocked)
    setInterval(function () {
        chrome.storage.local.get({ LockedInState: 0 }, function (data) {
            if (data.LockedInState !== 1) {
                window.location.href = targetUrl;
            }
        });
    }, 1000);
});