chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    const REPLIT_BASE = "https://privacy-extension-backend--mrahmed2026.replit.app"; // <-- change this

    if (request.action === "processText") {
        fetch(`${REPLIT_BASE}/simplify_openai`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                text: request.text
            })
        })
        .then(response => response.json())
        .then(data => {
            console.log("Full API Response:", data);

            if (data.error) {
                console.error("Backend Error:", data.error);
                sendResponse({ summary: `Error: ${data.error || "Unknown error"}` });
                return;
            }

            if (data.summary) {
                sendResponse({ summary: data.summary });
            } else {
                console.error("Unexpected API Response Format:", data);
                sendResponse({ summary: "Error: Unexpected API response format." });
            }
        })
        .catch(error => {
            console.error("Network/Fetch Error:", error);
            sendResponse({ summary: "Error: Unable to connect to API." });
        });

        return true;
    }

    if (request.action === "askQuestion") {
        fetch(`${REPLIT_BASE}/ask_openai`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                policyText: request.policyText,
                question: request.question
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data.error) {
                sendResponse({ answer: `Error: ${data.error || "Unknown error"}` });
                return;
            }

            if (data.answer) {
                sendResponse({ answer: data.answer });
            } else {
                sendResponse({ answer: "Sorry, I couldn’t generate a response." });
            }
        })
        .catch(error => {
            console.error("Q&A API Error:", error);
            sendResponse({ answer: "There was an error connecting to the AI." });
        });

        return true;
    }
});