export function init() {
    const pinInput = document.getElementById('pin-input');
    const pinConfirm = document.getElementById('pin-confirm');
    const setPinBtn = document.getElementById('set-pin');
    const pinMessage = document.getElementById('pin-message');

    setPinBtn.addEventListener('click', () => {
        const pin = pinInput.value;
        const confirm = pinConfirm.value;

        if (pin.length < 4) {
            pinMessage.textContent = "PIN must be at least 4 digits.";
            pinMessage.style.color = 'red';
            return;
        }

        if (pin !== confirm) {
            pinMessage.textContent = "PINs do not match.";
            pinMessage.style.color = 'red';
            return;
        }

        chrome.storage.local.set({ unlockPin: pin }, () => {
            pinMessage.textContent = "PIN set successfully!";
            pinMessage.style.color = 'green';
            pinInput.value = "";
            pinConfirm.value = "";
        });
    });
}

