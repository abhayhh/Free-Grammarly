let debounceTimer;
const DEBOUNCE_DELAY_MS = 1200;

function isEditableElement(element) {
    if (!element) return false;
    if (element.tagName === 'TEXTAREA' || element.isContentEditable) return true;
    if (element.tagName === 'INPUT') {
        const safeInputTypes = ['text', 'search', 'email', 'url'];
        return safeInputTypes.includes(element.type.toLowerCase());
    }
    return false;
}

async function triggerEnhancement(element) {
    // --- NEW CODE: The On/Off Check ---
    // Get the current state from storage, defaulting to 'true' (enabled).
    const data = await chrome.storage.sync.get({ isExtensionEnabled: true });
    if (!data.isExtensionEnabled) {
        // If the extension is disabled, do nothing.
        return; 
    }
    // --- END OF NEW CODE ---

    if (element.dataset.enhancing === 'true') return;
    const originalText = element.isContentEditable ? element.innerText : element.value;
    if (!originalText || originalText.trim().length < 10) return;

    element.dataset.enhancing = 'true';
    const originalBorder = element.style.border;
    element.style.border = '2px solid orange';

    try {
        const response = await chrome.runtime.sendMessage({ action: "enhanceText", text: originalText });
        if (response && response.success) {
            if (element.isContentEditable) { element.innerText = response.text; } 
            else { element.value = response.text; }
            element.style.border = '2px solid limegreen';
        } else {
            alert(`Gemini Corrector Error:\n\n${response.error}`);
            element.style.border = '2px solid red';
        }
    } catch (error) {
        console.error("Content script communication error:", error);
        element.style.border = '2px solid red';
    } finally {
        setTimeout(() => {
            element.style.border = originalBorder;
            delete element.dataset.enhancing;
        }, 3000);
    }
}

document.addEventListener('focusin', (event) => {
    const el = event.target;
    if (isEditableElement(el) && !el.dataset.enhancerAttached) {
        el.dataset.enhancerAttached = 'true';
        el.addEventListener('keyup', (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => triggerEnhancement(e.target), DEBOUNCE_DELAY_MS);
        });
        el.addEventListener('focusout', (e) => {
            clearTimeout(debounceTimer);
            triggerEnhancement(e.target);
        });
    }
});