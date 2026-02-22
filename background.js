const API_BASE_URL = "https://privacy-extension-backend--mrahmed2026.replit.app";

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "processText") {
        fetch(`${API_BASE_URL}/simplify`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ text: request.text })
        })
        .then(response => response.json())
        .then(data => {
            console.log("Full API Response:", data);

            if (data.error) {
                console.error("Proxy API Error:", data.error);
                sendResponse({ summary: `Error: ${data.error.message || "Unknown error"}` });
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
        fetch(`${API_BASE_URL}/ask`, {
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
            console.log("Q&A API Response:", data);
            if (data.answer) {
                sendResponse({ answer: data.answer });
            } else {
                console.error("Unexpected response format:", data);
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
