// Get all the elements from the popup
const apiKeyInput = document.getElementById('apiKey');
const saveButton = document.getElementById('saveButton');
const statusEl = document.getElementById('status');
const toggleButton = document.getElementById('toggleButton');
const extensionStatusEl = document.getElementById('extensionStatus');

// This function updates the button's text and color based on the extension's state
function updateButtonUI(isEnabled) {
    if (isEnabled) {
        extensionStatusEl.textContent = 'The extension is currently ACTIVE.';
        toggleButton.textContent = 'Disable Extension';
        toggleButton.className = 'enabled';
    } else {
        extensionStatusEl.textContent = 'The extension is currently OFF.';
        toggleButton.textContent = 'Enable Extension';
        toggleButton.className = 'disabled';
    }
}

// When the popup opens, load the saved settings
document.addEventListener('DOMContentLoaded', () => {
    // Load the API key
    chrome.storage.sync.get(['geminiApiKey'], (result) => {
        if (result.geminiApiKey) {
            apiKeyInput.value = result.geminiApiKey;
        }
    });

    // Load the extension's enabled/disabled state
    // We default to 'true' (enabled) if the setting doesn't exist yet
    chrome.storage.sync.get({ isExtensionEnabled: true }, (data) => {
        updateButtonUI(data.isExtensionEnabled);
    });
});

// Save the API key when the save button is clicked
saveButton.addEventListener('click', () => {
    const apiKey = apiKeyInput.value.trim();
    if (apiKey) {
        chrome.storage.sync.set({ geminiApiKey: apiKey }, () => {
            statusEl.textContent = 'API Key saved!';
            setTimeout(() => { statusEl.textContent = ''; }, 2000);
        });
    }
});

// Handle the on/off toggle button click
toggleButton.addEventListener('click', () => {
    // First, get the current state
    chrome.storage.sync.get({ isExtensionEnabled: true }, (data) => {
        const currentState = data.isExtensionEnabled;
        const newState = !currentState; // Flip the state

        // Save the new state
        chrome.storage.sync.set({ isExtensionEnabled: newState }, () => {
            // Update the UI to reflect the new state immediately
            updateButtonUI(newState);
        });
    });
});