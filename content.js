chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getPolicy") {
        const policyText = extractPrivacyPolicy();
        sendResponse({ text: policyText });
    }

    if (request.action === "getHeadings") {
        const headings = Array.from(document.querySelectorAll("h1, h2, h3, h4"))
            .map(h => h.innerText.trim())
            .filter(text => text.length > 0);
        sendResponse({ headings });
    }

    if (request.action === "scrollToSectionByText") {
        const searchText = request.text.toLowerCase();
        const headings = document.querySelectorAll("h1, h2, h3, h4");

        let bestMatch = null;
        let highestScore = 0;

        headings.forEach(h => {
            const headingText = h.textContent.trim().toLowerCase();
            const score = getTextSimilarity(searchText, headingText);
            if (score > highestScore) {
                highestScore = score;
                bestMatch = h;
            }
        });

        if (bestMatch) {
            bestMatch.scrollIntoView({ behavior: "smooth", block: "start" });
            bestMatch.style.transition = "background-color 0.5s";
            bestMatch.style.backgroundColor = "#fff7a0";

            setTimeout(() => {
                bestMatch.style.backgroundColor = "";
            }, 1500);
        }
    }

    return true; 
});


function extractPrivacyPolicy() {
    let text = "";
    const paragraphs = document.querySelectorAll("p, div, span");
    paragraphs.forEach(p => {
        if (p.innerText.toLowerCase().includes("privacy policy")) {
            text += p.innerText + " ";
        }
    });
    return text;
}

function getTextSimilarity(a, b) {
    if (b.includes(a)) return 1;
    const aWords = a.split(/\s+/);
    const bWords = b.split(/\s+/);
    const common = aWords.filter(word => bWords.includes(word));
    return common.length / Math.max(aWords.length, bWords.length);
}
