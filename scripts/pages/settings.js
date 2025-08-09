/**
 * Fetches distracting domains from storage and displays them in a list.
 * Each item in the list has a delete button.
 */
function displayAndDeleteDistractingDomains() {
    const container = document.getElementById('distracting-domains-container');
    container.innerHTML = ''; // Clear previous list

    chrome.storage.sync.get(['distractingDomains'], (result) => {
        const domains = result.distractingDomains || [];

        if (domains.length === 0) {
            container.textContent = "You haven't marked any sites as distracting yet.";
            return;
        }

        const ul = document.createElement('ul');
        domains.forEach(domain => {
            const li = document.createElement('li');

            const domainText = document.createElement('span');
            domainText.textContent = domain;

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Delete';
            deleteBtn.className = 'delete-btn';

            // Add event listener to the delete button
            deleteBtn.addEventListener('click', () => {
                deleteDomain(domain);
            });

            li.appendChild(domainText);
            li.appendChild(deleteBtn);
ul.appendChild(li);
        });

        container.appendChild(ul);
    });
}

/**
 * Deletes a specific domain from the distracting domains list in storage,
 * and then re-renders the list.
 * @param {string} domainToDelete The domain to remove.
 */
function deleteDomain(domainToDelete) {
    const storageKey = "distractingDomains";
    chrome.storage.sync.get([storageKey], (result) => {
        const domains = result[storageKey] || [];
        // Filter out the domain to be deleted
        const updatedDomains = domains.filter(d => d !== domainToDelete);

        // Save the updated list back to storage
        chrome.storage.sync.set({ [storageKey]: updatedDomains }, () => {
            console.log(`Deleted ${domainToDelete} from distracting domains list.`);
            // Refresh the list view to show the change
            displayAndDeleteDistractingDomains();
        });
    });
}

/**
 * Adds a new domain to the distracting domains list from manual input.
 */
function addDomainManually() {
    const input = document.getElementById('manual-domain-input');
    const message = document.getElementById('manual-add-message');
    let domain = input.value.trim();

    if (!domain) {
        message.textContent = "Please enter a domain.";
        message.style.color = 'red';
        return;
    }

    // If a full URL is pasted, extract the hostname
    try {
        if (!domain.startsWith('http://') && !domain.startsWith('https://')) {
            domain = 'http://' + domain;
        }
        const url = new URL(domain);
        domain = url.hostname;
    } catch (error) {
        message.textContent = "Invalid domain or URL format.";
        message.style.color = 'red';
        return;
    }


    const storageKey = "distractingDomains";
    chrome.storage.sync.get([storageKey], (result) => {
        const domains = result[storageKey] || [];
        if (domains.includes(domain)) {
            message.textContent = "This domain is already in the list.";
            message.style.color = 'orange';
        } else {
            domains.push(domain);
            domains.sort();
            chrome.storage.sync.set({ [storageKey]: domains }, () => {
                message.textContent = `Successfully blocked ${domain}.`;
                message.style.color = 'green';
                displayAndDeleteDistractingDomains(); // Refresh the list
            });
        }
        input.value = ""; // Clear input field
    });
}


/**
 * The init function that is called by main.js when this page is loaded.
 */
export function init() {
    // Initial call to display the domains when the page loads
    displayAndDeleteDistractingDomains();

    // Set up the PIN setting functionality
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

    // Set up the manual domain adding functionality
    const addDomainBtn = document.getElementById('add-domain-btn');
    addDomainBtn.addEventListener('click', addDomainManually);
}