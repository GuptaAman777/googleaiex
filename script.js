const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');

// -----------------------------------------------------------------------------
// --- WARNING: API Key Exposed! ---
// Storing your API key in client-side code is highly insecure and not recommended
// for production applications. Anyone can view your key.
// You are using this AT YOUR OWN RISK.
const API_KEY = 'AIzaSyCdcluTSk8YFgFMleTR1smF7LcFvsnkX1M';
// -----------------------------------------------------------------------------

const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`;

// --- Function to add a message to the chat box ---
function addMessage(sender, message) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', sender === 'user' ? 'user-message' : 'ai-message');

    const senderSpan = document.createElement('span');
    senderSpan.classList.add('sender');
    senderSpan.textContent = sender === 'user' ? 'You:' : 'Gemini:';

    const messagePara = document.createElement('p');
    // Basic sanitization to prevent simple HTML injection
    const tempDiv = document.createElement('div');
    tempDiv.textContent = message;
    messagePara.innerHTML = tempDiv.innerHTML.replace(/\n/g, '<br>'); // Render newlines

    messageElement.appendChild(senderSpan);
    messageElement.appendChild(messagePara);
    chatBox.appendChild(messageElement);

    // Scroll to the bottom
    chatBox.scrollTop = chatBox.scrollHeight;
}

// --- Function to show loading indicator ---
function showLoading() {
    const loadingElement = document.createElement('div');
    loadingElement.classList.add('message', 'ai-message', 'loading-message');
    loadingElement.id = 'loading'; // Give it an ID to easily remove it

    const senderSpan = document.createElement('span');
    senderSpan.classList.add('sender');
    senderSpan.textContent = 'Gemini:';

    const messagePara = document.createElement('p');
    messagePara.textContent = 'Thinking...';

    loadingElement.appendChild(senderSpan);
    loadingElement.appendChild(messagePara);
    chatBox.appendChild(loadingElement);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// --- Function to remove loading indicator ---
function removeLoading() {
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
        chatBox.removeChild(loadingElement);
    }
}

// --- Function to call the Gemini API ---
async function callGeminiAPI(prompt) {
    showLoading();
    try {
        const requestBody = {
            contents: [{
                parts: [{
                    text: prompt
                }]
            }]
            // You can add safetySettings here if needed:
            // safetySettings: [
            //   { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            //   { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            //   // Add more categories as needed
            // ]
        };

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        removeLoading();

        if (!response.ok) {
            const errorData = await response.json();
            console.error("API Error:", errorData);
            let errorMessage = `Error: ${response.status} ${response.statusText}`;
            if (errorData && errorData.error && errorData.error.message) {
                 errorMessage += ` - ${errorData.error.message}`;
            }
            addMessage('ai', `Sorry, I encountered an error. ${errorMessage}`);
            return;
        }

        const data = await response.json();

        // Extract the text response - Check the API documentation for the exact structure
        let botMessage = "Sorry, I couldn't get a proper response."; // Default message
        if (data.candidates && data.candidates.length > 0 &&
            data.candidates[0].content && data.candidates[0].content.parts &&
            data.candidates[0].content.parts.length > 0) {
            botMessage = data.candidates[0].content.parts[0].text;
        } else if (data.promptFeedback && data.promptFeedback.blockReason) {
            // Handle cases where the prompt was blocked
             botMessage = `Request blocked: ${data.promptFeedback.blockReason}. ${data.promptFeedback.blockReasonMessage || ''}`;
        }


        addMessage('ai', botMessage);

    } catch (error) {
        removeLoading();
        console.error("Fetch Error:", error);
        addMessage('ai', `Sorry, there was a problem connecting to the AI. (${error.message})`);
    }
}

// --- Event Listener for the Send Button ---
sendButton.addEventListener('click', () => {
    const message = userInput.value.trim();
    if (message) {
        addMessage('user', message);
        callGeminiAPI(message);
        userInput.value = ''; // Clear input field
    }
});

// --- Event Listener for Enter Key in Input Field ---
userInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault(); // Prevent default form submission (if it were in a form)
        sendButton.click(); // Trigger send button click
    }
});
