let knownPageHeadings = []; 

function renderSections(sections) {
    const container = document.getElementById("sectionsList");
    container.innerHTML = "";

    if (sections.length === 0) {
        container.textContent = "No sections found.";
        return;
    }

    sections.forEach(text => {
        const button = document.createElement("button");
        button.className = "jump-btn";
        button.textContent = text;
        button.style.display = "block";
        button.style.margin = "4px 0";

        button.addEventListener("click", () => {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: "scrollToSectionByText",
                    text: text
                });
            });
        });

        container.appendChild(button);
    });
}

function makeSummarySectionsInteractive() {
    const summaryBox = document.getElementById("summary");
    const strongTags = summaryBox.querySelectorAll("strong");

    strongTags.forEach(tag => {
        const headingText = tag.innerText.trim().toLowerCase();

        const hasMatch = knownPageHeadings.some(original =>
            original.toLowerCase().includes(headingText) || headingText.includes(original.toLowerCase())
        );

        if (hasMatch) {
            tag.style.cursor = "pointer";
            tag.style.textDecoration = "underline";
            tag.title = "Click to scroll to this section on the original page";

            tag.addEventListener("click", () => {
                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                    chrome.tabs.sendMessage(tabs[0].id, {
                        action: "scrollToSectionByText",
                        text: tag.innerText.trim()
                    });
                });
            });
        }
    });
}

document.getElementById("fetchPolicy").addEventListener("click", () => {
    const loader = document.getElementById("loader");
    const summaryBox = document.getElementById("summary");

    loader.style.display = "block";
    summaryBox.textContent = "Simplifying... Please wait.";

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            func: () => document.body.innerText
        }, (results) => {
            if (chrome.runtime.lastError) {
                console.error("Script execution failed:", chrome.runtime.lastError.message);
                summaryBox.textContent = "Failed to fetch page content.";
                loader.style.display = "none";
                return;
            }

            if (!results || !results[0]) {
                console.error("No result returned from page script.");
                summaryBox.textContent = "No content found on page.";
                loader.style.display = "none";
                return;
            }

            const text = results[0].result;

            chrome.runtime.sendMessage({ action: "processText", text: text }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error("Error contacting background script:", chrome.runtime.lastError.message);
                    summaryBox.textContent = "Failed to contact summarizer.";
                    loader.style.display = "none";
                    return;
                }

                loader.style.display = "none";

                if (!response || !response.summary) {
                    summaryBox.textContent = "No summary returned.";
                    return;
                }

                const cleanedHTML = response.summary
                    .replace(/^#+\s?/gm, "")
                    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                    .replace(/^- /gm, "• ")
                    .trim();

                summaryBox.innerHTML = cleanedHTML;
                makeSummarySectionsInteractive();
            });
        });
    });
});

document.addEventListener("DOMContentLoaded", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { action: "getHeadings" }, (response) => {
            if (chrome.runtime.lastError) {
                console.error("Error sending message to content script:", chrome.runtime.lastError.message);
                document.getElementById("sectionsList").textContent = "Failed to load headings.";
                return;
            }

            if (response && response.headings) {
                knownPageHeadings = response.headings;
                renderSections(response.headings);
            } else {
                document.getElementById("sectionsList").textContent = "Failed to load headings.";
            }
        });
    });
});

document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));

        btn.classList.add('active');
        document.getElementById(btn.dataset.tab).classList.add('active');
    });
});

document.getElementById("askQuestion").addEventListener("click", () => {
    const question = document.getElementById("userQuestion").value.trim();
    const loader = document.getElementById("qaLoader");
    const answerBox = document.getElementById("qaAnswer");

    if (!question) {
        answerBox.textContent = "Please enter a question.";
        return;
    }

    loader.style.display = "block";
    answerBox.textContent = "Thinking...";

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            func: () => document.body.innerText
        }, (results) => {
            const fullText = results[0]?.result || "";

            chrome.runtime.sendMessage({
                action: "askQuestion",
                policyText: fullText,
                question: question
            }, (response) => {
                loader.style.display = "none";
                const cleanAnswer = (response.answer || "No answer returned.")
                .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
            answerBox.innerHTML = cleanAnswer;
                        });
        });
    });
});
