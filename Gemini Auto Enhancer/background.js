// This listener waits for a message from the content script on the webpage.
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Make sure we only handle the 'enhanceText' action.
    if (request.action === "enhanceText") {
        console.log("Background script received text to enhance:", request.text);

        // We use an async function to handle the API call.
        (async () => {
            try {
                // 1. Get the stored API key.
                const data = await chrome.storage.sync.get(['geminiApiKey']);
                if (!data.geminiApiKey) {
                    throw new Error("API Key not found. Please click the extension icon to set your key.");
                }
                const API_KEY = data.geminiApiKey;

                // 2. Define the correct API URL and prompt.
                const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
                const prompt = `You are an expert writing assistant, similar to Grammarly. A user has provided text. Your single task is to fix all spelling and grammar mistakes, improve clarity, and enhance the tone to be professional and concise. IMPORTANT: Return ONLY the corrected text. Do not add any introductory phrases, explanations, or markdown. Just the final, corrected text. Original Text: "${request.text}"`;

                // 3. Make the API call using fetch, exactly like the curl command.
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-goog-api-key': API_KEY // Use the header for the API key.
                    },
                    body: JSON.stringify({
                        "contents": [{ "parts": [{ "text": prompt }] }]
                    }),
                });

                // 4. Handle a bad response from the server (e.g., bad API key, billing issue).
                if (!response.ok) {
                    let errorDetails = `API request failed with status: ${response.status}.`;
                    try {
                        const errorJson = await response.json();
                        // This will give a specific error message from Google.
                        errorDetails += ` Server message: ${errorJson.error.message}`;
                    } catch (e) {
                        errorDetails += " Could not parse the server's error response.";
                    }
                    throw new Error(errorDetails);
                }

                const responseData = await response.json();

                // 5. Handle a good response that doesn't contain the text we need.
                if (!responseData.candidates?.[0]?.content?.parts?.[0]?.text) {
                     throw new Error("Invalid response structure from API. The model may have blocked the request or the format changed.");
                }
                
                const enhancedText = responseData.candidates[0].content.parts[0].text.trim();
                console.log("Background script sending back enhanced text:", enhancedText);
                sendResponse({ success: true, text: enhancedText });

            } catch (error) {
                // 6. If anything fails, log it and send the error message back to the user.
                console.error("CRITICAL ERROR in background.js:", error.message);
                sendResponse({ success: false, error: error.message });
            }
        })();

        return true; // IMPORTANT: This keeps the connection open for the async response.
    }
});