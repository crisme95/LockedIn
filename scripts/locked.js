/*
    locked.js
    This script handles the PIN entry for unlocking distracting sites.
*/

document.addEventListener('DOMContentLoaded', () => {
    const pinInput = document.getElementById('pin-input');
    const unlockBtn = document.getElementById('unlock-btn');
    const errorMessage = document.getElementById('error-message');

    const urlParams = new URLSearchParams(window.location.search);
    const targetUrl = urlParams.get('url');

    unlockBtn.addEventListener('click', async () => {
        const enteredPin = pinInput.value;
        const { unlockPin } = await chrome.storage.local.get('unlockPin');

        if (enteredPin === unlockPin) {
            // Unlock for this session
            const url = new URL(targetUrl);
            const domain = url.hostname;
            const sessionKey = `unlocked_${domain}`;
            await chrome.storage.session.set({ [sessionKey]: true });

            // Redirect to the original URL
            window.location.href = targetUrl;
        } else {
            errorMessage.textContent = 'Incorrect PIN. Please try again.';
            pinInput.value = "";
        }
    });

    setInterval(() => {
        chrome.storage.local.get({ LockedInState: 0 }, async (data) => {
            if (data.LockedInState != 1) {
                window.location.href = targetUrl;
            }   
        });
    }, 1000);
});

