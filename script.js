
        // --- DOM Elements ---
        const sidebar = document.getElementById('sidebar');
        const openSidebarBtn = document.getElementById('open-sidebar-btn');
        const closeSidebarBtn = document.getElementById('close-sidebar-btn');
        const newChatBtn = document.getElementById('new-chat-btn');
        const chatHistoryList = document.getElementById('chat-history-list');
        const chatArea = document.getElementById('chat-area');
        const welcomeScreen = document.getElementById('welcome-screen');
        const welcomeIcon = document.getElementById('welcome-icon');
        const welcomeTitle = document.getElementById('welcome-title');
        const welcomeSubtitle = document.getElementById('welcome-subtitle');
        const chatTitle = document.getElementById('chat-title');
        const chatForm = document.getElementById('chat-form');
        const userInput = document.getElementById('user-input');
        const sendButton = document.getElementById('send-button');
        const loadingIndicator = document.getElementById('loading-indicator');
        const modelSelector = document.getElementById('model-selector');
        
        // Modal Elements
        const managePlanBtn = document.getElementById('manage-plan-btn');
        const subscriptionModal = document.getElementById('subscription-modal');
        const closeModalBtn = document.getElementById('close-modal-btn');
        const currentPlanSidebarEl = document.getElementById('current-plan-sidebar');
        const modalCurrentPlanEl = document.getElementById('modal-current-plan');
        const redeemCodeInput = document.getElementById('redeem-code-input');
        const redeemBtn = document.getElementById('redeem-btn');
        const redeemError = document.getElementById('redeem-error');
        const modalTabContainer = document.getElementById('modal-tab-container');
        const modeToggleChat = document.getElementById('mode-toggle-chat');
        const modeToggleCodex = document.getElementById('mode-toggle-codex');
        const appTitle = document.getElementById('app-title');

        // v1.25 Change: Confirmation Modal Elements
        const confirmModal = document.getElementById('confirm-modal');
        const confirmModalTitle = document.getElementById('confirm-modal-title');
        const confirmModalText = document.getElementById('confirm-modal-text');
        const confirmModalCancel = document.getElementById('confirm-modal-cancel');
        const confirmModalConfirm = document.getElementById('confirm-modal-confirm');

        // --- API Configuration ---
        const apiKey = "AIzaSyDkT8kVvVZalxTh_Fav-0gyxh9_o4Zz-J4"; 
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

        // --- Application State ---
        let appState = {
            mode: 'chat',        // 'chat' or 'codex'
            currentChatId: null,
            currentCodexChatId: null,
            chats: [],           // { id, title, history, model }
            codexChats: [],      // { id, title, history, model }
            subscription: 'free',
            messageCounts: {},
            usedCodes: []
        };
        
        // v1.25 Change: Store callback for confirm modal
        let onConfirmCallback = null;

        // --- Utility Functions ---

        /**
         * Generates a unique UUID.
         */
        function generateUUID() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        }
        
        /**
         * Simple Markdown to HTML converter.
         * NOW includes a "Copy Code" button for code blocks.
         */
        function markdownToHtml(markdown) {
            // 1. Handle inline elements first
            let html = markdown
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/`(.*?)`/g, '<code>$1</code>');

            // 2. Handle code blocks
            html = html.replace(/```([\s\S]*?)```/g, (match, code) => {
                const lines = code.split('\n');
                let lang = '';
                let content = code.trim();

                // Basic lang detection
                if (lines[0] && lines[0].trim() && !lines[0].includes(' ')) {
                    lang = lines[0].trim();
                    content = lines.slice(1).join('\n').trim();
                }
                
                // Escape HTML for safe rendering in <pre>
                const escapedContent = content.replace(/</g, "&lt;").replace(/>/g, "&gt;");

                // Use a unique ID for the pre-formatted text to avoid block-level nesting issues
                const uniqueId = `code-block-${generateUUID()}`;
                
                const codeBlockHtml = `
                    <div class="code-block-wrapper">
                        <div class="code-block-header">
                            <button class="copy-btn">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 inline-block mr-1">
                                  <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.03 1.126 0 1.131.094 1.976 1.057 1.976 2.192v1.392M15.75 7.5V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.126 0c-1.131.094-1.976 1.057-1.976 2.192v1.392" />
                                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9 9 0 0 0 9-9c0-1.87-.563-3.61-1.5-5.064M3 12a9 9 0 0 1 9-9c1.87 0 3.61.563 5.064 1.5M12 21a9 9 0 0 1-9-9c0-1.87.563-3.61 1.5-5.064M12 21V15" />
                                </svg>
                                Copy
                            </button>
                        </div>
                        <pre class="language-${lang}"><code>${escapedContent}</code></pre>
                    </div>`;
                
                // Return as a single line block to avoid being split by paragraph logic
                return `\n${uniqueId}\n` + btoa(codeBlockHtml) + `\n${uniqueId}\n`;
            });

            // 3. Handle Lists and Paragraphs
            let lines = html.split('\n');
            let inList = false;
            let processedHtml = [];
            const codeBlockRegex = new RegExp(`^${"code-block-" + "[a-f0-9\\-]{36}"}$`);

            for (let i = 0; i < lines.length; i++) {
                let line = lines[i]; // Keep trim() for logic, but use original line

                // Handle Lists
                if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
                    if (!inList) {
                        processedHtml.push('<ul class="list-disc ml-5 my-2">');
                        inList = true;
                    }
                    processedHtml.push(`<li>${line.trim().substring(2)}</li>`);
                } else {
                    // If we were in a list, close it
                    if (inList) {
                        processedHtml.push('</ul>');
                        inList = false;
                    }
                    
                    // Handle Code Blocks
                    if (codeBlockRegex.test(line.trim())) {
                        i++; // Move to the base64 content
                        let encodedHtml = lines[i];
                        processedHtml.push(atob(encodedHtml));
                        i++; // Move past the closing ID
                    } 
                    // Handle Paragraphs
                    else if (line.trim().length > 0) {
                        processedHtml.push(`<p>${line}</p>`);
                    }
                }
            }
            
            // Close any open list
            if (inList) {
                processedHtml.push('</ul>');
            }

            return processedHtml.join('\n'); // Join with newlines for block-level elements
        }

        /**
         * Displays a single message in the chat area.
         */
        function displayMessage(text, sender, isError = false) {
            const messageContainer = document.createElement('div');
            messageContainer.className = `flex ${sender === 'user' ? 'justify-end' : 'justify-start'}`;
            
            let bgColor = sender === 'user' ? 'bg-blue-600' : 'bg-gray-700';
            if (isError) bgColor = 'bg-red-700';

            const userIcon = `
                <div class="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5 text-white">
                      <path fill-rule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clip-rule="evenodd" />
                    </svg>
                </div>`;
            
            const modelIcon = `
                <div class="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5 text-white">
                      <path d="M12 9a3.75 3.75 0 1 0 0 7.5A3.75 3.75 0 0 0 12 9Z" />
                      <path fill-rule="evenodd" d="M9.344 3.071a.75.75 0 0 1 1.06 0l1.125 1.125a.75.75 0 0 1 0 1.06l-1.125 1.125a.75.75 0 0 1-1.06 0l-1.125-1.125a.75.75 0 0 1 0-1.06L9.344 3.07Z" clip-rule="evenodd" />
                      <path fill-rule="evenodd" d="M13.656 3.071a.75.75 0 0 1 1.06 0l1.125 1.125a.75.75 0 0 1 0 1.06l-1.125 1.125a.75.75 0 0 1-1.06 0l-1.125-1.125a.75.75 0 0 1 0-1.06L13.656 3.07Z" clip-rule="evenodd" />
                      <path fill-rule="evenodd" d="M1.5 13.656a.75.75 0 0 1 0-1.06l1.125-1.125a.75.75 0 0 1 1.06 0l1.125 1.125a.75.75 0 0 1 0 1.06l-1.125 1.125a.75.75 0 0 1-1.06 0l-1.125-1.125Z" clip-rule="evenodd" />
                      <path fill-rule="evenodd" d="M1.5 9.344a.75.75 0 0 1 0-1.06l1.125-1.125a.75.75 0 0 1 1.06 0l1.125 1.125a.75.75 0 0 1 0 1.06l-1.125 1.125a.75.75 0 0 1-1.06 0L1.5 9.344Z" clip-rule="evenodd" />
                      <path fill-rule="evenodd" d="M22.5 13.656a.75.75 0 0 1 0-1.06l-1.125-1.125a.75.75 0 0 1-1.06 0l-1.125 1.125a.75.75 0 0 1 0 1.06l1.125 1.125a.75.75 0 0 1 1.06 0l1.125-1.125Z" clip-rule="evenodd" />
                      <path fill-rule="evenodd" d="M22.5 9.344a.75.75 0 0 1 0-1.06l-1.125-1.125a.75.75 0 0 1-1.06 0l-1.125 1.125a.75.75 0 0 1 0 1.06l1.125 1.125a.75.75 0 0 1 1.06 0L22.5 9.344Z" clip-rule="evenodd" />
                      <path fill-rule="evenodd" d="M9.344 20.93a.75.75 0 0 1 1.06 0l1.125-1.125a.75.75 0 0 1 0-1.06l-1.125-1.125a.75.75 0 0 1-1.06 0l-1.125 1.125a.75.75 0 0 1 0 1.06l1.125 1.125Z" clip-rule="evenodd" />
                      <path fill-rule="evenodd" d="M13.656 20.93a.75.75 0 0 1 1.06 0l1.125-1.125a.75.75 0 0 1 0-1.06l-1.125-1.125a.75.75 0 0 1-1.06 0l-1.125 1.125a.75.75 0 0 1 0 1.06l1.125 1.125Z" clip-rule="evenodd" />
                    </svg>
                </div>`;
            
            messageContainer.innerHTML = `
                <div class="max-w-3xl mx-auto flex ${sender === 'user' ? 'flex-row-reverse' : 'flex-row'} w-full items-start">
                    ${sender === 'user' ? userIcon.replace('mr-3', 'ml-3') : modelIcon}
                    <div class="chat-bubble p-4 rounded-xl shadow-md ${bgColor} text-white whitespace-pre-wrap max-w-full sm:max-w-3xl">
                        ${markdownToHtml(text)}
                    </div>
                </div>
            `;
            chatArea.appendChild(messageContainer);
            scrollToBottom();
        }

        /**
         * Disables/enables the input form.
         */
        function setFormDisabled(disabled) {
            userInput.disabled = disabled;
            sendButton.disabled = disabled;
            modelSelector.disabled = disabled;
            sendButton.classList.toggle('text-blue-400', !disabled);
            sendButton.classList.toggle('hover:text-blue-500', !disabled);
            sendButton.classList.toggle('text-gray-500', disabled);
            sendButton.classList.toggle('cursor-not-allowed', disabled);
        }

        /**
         * Scrolls the chat area to the bottom.
         */
        function scrollToBottom() {
            chatArea.scrollTop = chatArea.scrollHeight;
        }

        /**
         * Automatically adjusts the height of the textarea.
         */
        function autoResizeTextarea() {
            userInput.style.height = 'auto';
            userInput.style.height = userInput.scrollHeight + 'px';
        }

        /**
         * Copies text to the clipboard (with fallback).
         */
        function copyToClipboard(text, button) {
            // Modern way
            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(text)
                    .then(() => showCopied(button))
                    .catch(err => console.error("Failed to copy with navigator.clipboard", err));
            } else {
                // Fallback for insecure contexts or older browsers
                try {
                    const textArea = document.createElement("textarea");
                    textArea.value = text;
                    textArea.style.position = "absolute";
                    textArea.style.left = "-9999px";
                    document.body.appendChild(textArea);
                    textArea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textArea);
                    showCopied(button);
                } catch (err) {
                    console.error("Fallback copy failed", err);
                }
            }
        }
        
        function showCopied(button) {
            button.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 inline-block mr-1">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                Copied!`;
            setTimeout(() => {
                button.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 inline-block mr-1">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.03 1.126 0 1.131.094 1.976 1.057 1.976 2.192v1.392M15.75 7.5V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.126 0c-1.131.094-1.976 1.057-1.976 2.192v1.392" />
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9 9 0 0 0 9-9c0-1.87-.563-3.61-1.5-5.064M3 12a9 9 0 0 1 9-9c1.87 0 3.61.563 5.064 1.5M12 21a9 9 0 0 1-9-9c0-1.87.563-3.61 1.5-5.064M12 21V15" />
                    </svg>
                    Copy`;
            }, 2000);
        }

        // --- State Management Functions ---

        /**
         * Loads the entire application state from localStorage.
         */
        function loadAppState() {
            const savedState = localStorage.getItem('chatAppRemastered');
            if (savedState) {
                appState = JSON.parse(savedState);
                
                // --- Initialize new properties if they don't exist ---
                if (!appState.mode) appState.mode = 'chat';
                if (!appState.codexChats) appState.codexChats = [];
                if (!appState.currentCodexChatId) appState.currentCodexChatId = null;
                if (!appState.chats) appState.chats = []; // Handle old state
                if (!appState.messageCounts) appState.messageCounts = {};
                if (!appState.usedCodes) appState.usedCodes = [];

            } else {
                // Initialize default state
                appState = {
                    mode: 'chat',
                    currentChatId: null,
                    currentCodexChatId: null,
                    chats: [],
                    codexChats: [],
                    subscription: 'free',
                    messageCounts: {},
                    usedCodes: []
                };
            }
            // Ensure reset timers are always present
            if (!appState.messageCounts.lastDailyReset) appState.messageCounts.lastDailyReset = Date.now();
            if (!appState.messageCounts.lastMonthlyReset) appState.messageCounts.lastMonthlyReset = Date.now();
            if (!appState.messageCounts.lastYearlyReset) appState.messageCounts.lastYearlyReset = Date.now();
            
            // Ensure usedCodes array is present
            if (!appState.usedCodes) appState.usedCodes = [];
            
            resetExpiredCounts(); // Reset counts on load
            console.log("App state loaded:", appState);
        }

        /**
         * Saves the entire application state to localStorage.
         */
        function saveAppState() {
            try {
                localStorage.setItem('chatAppRemastered', JSON.stringify(appState));
            } catch (error) {
                console.error("Failed to save app state:", error);
            }
        }
         
        /**
         * Gets the currently active chat object based on the current mode.
         */
        function getCurrentChat() {
            if (appState.mode === 'chat') {
                if (!appState.currentChatId) return null;
                return appState.chats.find(chat => chat.id === appState.currentChatId);
            } else {
                if (!appState.currentCodexChatId) return null;
                return appState.codexChats.find(chat => chat.id === appState.currentCodexChatId);
            }
        }

        // --- Rendering Functions ---
        /**
         * Renders the chat history in the sidebar based on the current mode.
         */
        function renderSidebar() {
            chatHistoryList.innerHTML = '';
            const chats = (appState.mode === 'chat') ? appState.chats : appState.codexChats;
            const currentId = (appState.mode === 'chat') ? appState.currentChatId : appState.currentCodexChatId;
            
            if (chats.length === 0) {
                chatHistoryList.innerHTML = `<li class="p-2 text-sm text-gray-500">No ${appState.mode}s yet.</li>`;
                return;
            }
            
            chats.forEach(chat => {
                // v1.25 Change: Modified to include delete button
                const li = document.createElement('li');
                li.className = 'rounded-lg group flex items-center justify-between'; // Add 'group'
                
                // Main chat load button
                const button = document.createElement('button');
                button.className = `flex-grow text-left p-2 rounded-lg text-gray-200 truncate ${chat.id === currentId ? 'bg-gray-700 font-semibold' : 'hover:bg-gray-700'}`;
                button.textContent = chat.title;
                button.dataset.chatId = chat.id;
                
                button.addEventListener('click', () => {
                    loadChat(chat.id);
                });
                
                // Delete button
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'flex-shrink-0 p-2 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity'; // Hidden by default
                deleteBtn.dataset.chatId = chat.id;
                deleteBtn.dataset.chatTitle = chat.title;
                deleteBtn.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
                      <path fill-rule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-1.15.201-2.14.7-2.84 1.414C2.39 6.32 2 7.11 2 8v.289c0 .43.16.84.44 1.158l1.11 1.291c.21.24.46.45.73.61a6.5 6.5 0 0 0 7.44 0c.27-.16.52-.37.73-.61l1.11-1.29c.28-.319.44-.729.44-1.158V8c0-.89-.39-1.68-.97-2.393C16.14 4.89 15.15 4.39 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM7.5 3.75c0-.69.56-1.25 1.25-1.25h2.5c.69 0 1.25.56 1.25 1.25v.41C12.18 4.2 11.84 4.25 11.5 4.25h-3c-.34 0-.68-.05-1-.09V3.75Z" clip-rule="evenodd" />
                      <path d="M4.177 9.842C4.06 9.71 4 9.55 4 9.388V8c0-.85.34-1.6.89-2.2C5.46 5.22 6.18 4.82 7 4.66V15.5h6V4.66c.82.16 1.54.56 2.11 1.14.55.6.89 1.35.89 2.2v1.388c0 .16-.06.32-.177.452l-1.11 1.29c-.21.24-.46.45-.73.61a6.5 6.5 0 0 1-7.44 0c-.27-.16-.52-.37-.73-.61l-1.11-1.29Z" />
                    </svg>
                `;
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation(); // Don't trigger loadChat
                    const chatId = e.currentTarget.dataset.chatId;
                    const chatTitle = e.currentTarget.dataset.chatTitle;
                    showDeleteConfirmation(chatId, chatTitle);
                });

                li.appendChild(button);
                li.appendChild(deleteBtn);
                chatHistoryList.appendChild(li);
            });
        }
        
        /**
         * Renders the messages for a given chat ID (or welcome screen).
         */
        function renderChat(chatId) {
            // Clear chat area
            chatArea.innerHTML = '';
            
            // 1. Dynamically populate model selector
            modelSelector.innerHTML = '';
            const models = (appState.mode === 'chat') 
                ? ['gpt 3.5', 'gpt 4', 'gpt 4.1', 'gpt 4-o mini', 'gpt 4o', 'gpt 5 mini', 'gpt 5', 'gpt 5 thinking', 'gpt 5 instant', 'gpt 5 pro', 'gpt 6 pro', 'gpt 6.1 pro ultra']
                : ['gpt 1 code Free', 'gpt 3 code go', 'gpt 1 code plus', 'gpt 1 pro'];
                
            models.forEach(model => {
                const option = document.createElement('option');
                option.value = model;
                option.text = model;
                modelSelector.appendChild(option);
            });
            
            // 2. Handle Welcome Screen
            if (!chatId) {
                if (appState.mode === 'chat') {
                    welcomeIcon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />`;
                    welcomeTitle.textContent = 'How can I help you today?';
                    welcomeSubtitle.textContent = 'Select a model above or just start typing.';
                    chatTitle.textContent = 'New Chat';
                    modelSelector.value = 'gpt 6.1 pro ultra';
                } else {
                    welcomeIcon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5 0-4.5 9" />`;
                    welcomeTitle.textContent = 'Welcome to Codex Mode';
                    welcomeSubtitle.textContent = 'Select a code model and start generating.';
                    chatTitle.textContent = 'New Codex';
                    modelSelector.value = 'gpt 1 pro';
                }
                chatArea.appendChild(welcomeScreen);
                welcomeScreen.classList.remove('hidden');
                return;
            }
            
            // 3. Render Chat History
            welcomeScreen.classList.add('hidden');
            const chats = (appState.mode === 'chat') ? appState.chats : appState.codexChats;
            const chat = chats.find(c => c.id === chatId);
            
            if (chat) {
                chatTitle.textContent = chat.title;
                modelSelector.value = chat.model; // Set selector to chat's model
                chat.history.forEach(message => {
                    displayMessage(message.parts[0].text, message.role);
                });
            }
        }
        
        /**
         * Updates the subscription plan display in the UI.
         */
        function updatePlanDisplay() {
            const planName = appState.subscription.charAt(0).toUpperCase() + appState.subscription.slice(1);
            currentPlanSidebarEl.textContent = `Plan: ${planName}`;
            modalCurrentPlanEl.textContent = planName;
        }

        // --- v1.25 Change: New Functions for Delete Confirmation ---

        /**
         * Shows the delete confirmation modal.
         */
        function showDeleteConfirmation(chatId, chatTitle) {
            confirmModalTitle.textContent = `Delete "${chatTitle}"?`;
            confirmModalText.textContent = `Are you sure you want to delete this chat? This action cannot be undone.`;
            
            onConfirmCallback = () => {
                deleteChat(chatId);
                hideConfirmationModal();
            };
            
            confirmModal.classList.remove('hidden');
        }

        /**
         * Hides the confirmation modal.
         */
        function hideConfirmationModal() {
            confirmModal.classList.add('hidden');
            onConfirmCallback = null;
        }
        
        /**
         * Deletes a chat from the current mode's state.
         */
        function deleteChat(chatId) {
            let chats = (appState.mode === 'chat') ? appState.chats : appState.codexChats;
            let currentId = (appState.mode === 'chat') ? appState.currentChatId : appState.currentCodexChatId;
            
            // Filter out the chat
            const newChats = chats.filter(chat => chat.id !== chatId);
            
            if (appState.mode === 'chat') {
                appState.chats = newChats;
            } else {
                appState.codexChats = newChats;
            }
            
            // Check if we deleted the *current* chat
            if (currentId === chatId) {
                if (appState.mode === 'chat') {
                    appState.currentChatId = null;
                } else {
                    appState.currentCodexChatId = null;
                }
                renderChat(null); // Load welcome screen
            }
            
            renderSidebar();
            saveAppState();
        }

        // --- End of v1.25 Functions ---

        /**
         * Handles starting a new chat in the current mode.
         */
        function startNewChat() {
            if (appState.mode === 'chat') {
                appState.currentChatId = null;
            } else {
                appState.currentCodexChatId = null;
            }
            renderChat(null);
            renderSidebar();
            setFormDisabled(false);
            userInput.focus();
            if (window.innerWidth < 640) { // Close sidebar on mobile
                sidebar.classList.add('-translate-x-full');
            }
        }
        
        /**
         * Handles loading an existing chat from the current mode.
         */
        function loadChat(chatId) {
            if (appState.mode === 'chat') {
                appState.currentChatId = chatId;
            } else {
                appState.currentCodexChatId = chatId;
            }
            
            const chat = getCurrentChat();
            if (!chat) {
                startNewChat(); // Chat not found, start new one
                return;
            }
            
            renderChat(chatId);
            renderSidebar();
            setFormDisabled(false);
            userInput.focus();
            if (window.innerWidth < 640) { // Close sidebar on mobile
                sidebar.classList.add('-translate-x-full');
            }
        }

        /**
         * Handles the main chat form submission.
         */
        async function handleSubmit(e) {
            e.preventDefault();
            const prompt = userInput.value.trim();
            const selectedModel = modelSelector.value.toLowerCase();
            
            if (!prompt) return;

            // --- 1. Check Message Limits ---
            if (!checkMessageLimit(selectedModel)) {
                const limitMsg = getLimitErrorMessage(selectedModel);
                displayMessage(limitMsg, 'model', true);
                return;
            }

            // --- 2. Create chat if it's the first message ---
            let isNewChat = false;
            let currentChat = getCurrentChat();
            
            if (!currentChat) {
                isNewChat = true;
                const newChatId = generateUUID();
                const newChat = {
                    id: newChatId,
                    title: prompt.substring(0, 40) + (prompt.length > 40 ? '...' : ''),
                    history: [],
                    model: modelSelector.value // Save the model used for this chat
                };
                
                if (appState.mode === 'chat') {
                    appState.currentChatId = newChatId;
                    appState.chats.unshift(newChat);
                    chatTitle.textContent = newChat.title;
                } else {
                    appState.currentCodexChatId = newChatId;
                    appState.codexChats.unshift(newChat);
                    chatTitle.textContent = newChat.title;
                }
                
                currentChat = newChat;
                renderSidebar();
                welcomeScreen.classList.add('hidden');
            }
            
            // --- 3. Display User Message & Update State ---
            displayMessage(prompt, 'user');
            const userHistory = { role: 'user', parts: [{ text: prompt }] };
            currentChat.history.push(userHistory);
            
            // If model was changed, update chat
            if (currentChat.model !== modelSelector.value) {
                currentChat.model = modelSelector.value;
            }
            
            saveAppState();

            // --- 4. Clear Input & Disable Form ---
            userInput.value = '';
            autoResizeTextarea();
            setFormDisabled(true);

            // --- 5. Show Loading ---
            loadingIndicator.classList.remove('hidden');
            scrollToBottom();

            try {
                // --- 6. Get AI Response ---
                const aiResponse = await getGeminiResponse(currentChat.history);

                // --- 7. Add to History & Display ---
                const modelHistory = { role: 'model', parts: [{ text: aiResponse }] };
                currentChat.history.push(modelHistory);
                saveAppState();
                displayMessage(aiResponse, 'model');

                // --- 8. Increment Count (only on success) ---
                incrementMessageCount(selectedModel);

            } catch (error) {
                console.error("Error fetching from Gemini API:", error);
                displayMessage("Sorry, I ran into an error. Please try again. " + error.message, 'model', true);
            } finally {
                // --- 9. Hide Loading & Re-enable Form ---
                loadingIndicator.classList.add('hidden');
                setFormDisabled(false);
                userInput.focus();
            }
        }
        
        /**
         * Handles switching the app mode between 'chat' and 'codex'.
         */
        function handleModeToggle(e) {
            const selectedMode = e.target.dataset.mode;
            if (selectedMode === appState.mode) return;
            
            appState.mode = selectedMode;
            
            // Update button active states
            modeToggleChat.dataset.active = (selectedMode === 'chat').toString();
            modeToggleCodex.dataset.active = (selectedMode === 'codex').toString();
            
            // Update app title
            appTitle.textContent = (selectedMode === 'chat') ? 'ChatGPT' : 'Codex';
            
            // Re-render sidebar and chat area for the new mode
            renderSidebar();
            const currentId = (selectedMode === 'chat') ? appState.currentChatId : appState.currentCodexChatId;
            renderChat(currentId);
            
            saveAppState();
        }
        
        /**
         * Handles clicking on modal tabs.
         */
        function handleTabClick(e) {
            const clickedTab = e.target.closest('.modal-tab-btn');
            if (!clickedTab) return;
            
            const tabName = clickedTab.dataset.tab;
            
            // Update button states
            modalTabContainer.querySelectorAll('.modal-tab-btn').forEach(btn => {
                btn.dataset.active = (btn.dataset.tab === tabName).toString();
            });
            
            // Update content visibility
            subscriptionModal.querySelectorAll('.modal-tab-content').forEach(content => {
                content.dataset.active = (content.dataset.tabContent === tabName).toString();
            });
        }
        
        /**
         * Handles clicking a "Copy Code" button.
         */
        function handleCopyClick(e) {
            const copyBtn = e.target.closest('.copy-btn');
            if (!copyBtn) return;
            
            const codeBlock = copyBtn.closest('.code-block-wrapper').querySelector('pre code');
            if (codeBlock) {
                copyToClipboard(codeBlock.textContent, copyBtn);
            }
        }
        
        // --- API & Persona Functions ---

        /**
         * Gets the appropriate system instruction based on the selected model.
         */
        function getSystemInstruction(model) {
            const m = model.toLowerCase();
            
            // Codex Model Personas
            if (appState.mode === 'codex') {
                if (m.includes('gpt 1 code free')) return "You are a basic coding assistant. You only understand simple syntax questions. Provide very short, direct answers. Do not generate full scripts, only small snippets (1-3 lines).";
                if (m.includes('gpt 3 code go')) return "You are a standard coding assistant (Codex v3). You are good at generating boilerplate, completing functions, and explaining simple algorithms. Your code is functional but may not be the most optimized. Prioritize a correct, working answer.";
                if (m.includes('gpt 1 code plus')) return "You are an advanced coding assistant (Codex v1 Plus). You are excellent at refactoring code, explaining complex design patterns, and debugging. You can generate larger, more complex code blocks and reason about architecture.";
                if (m.includes('gpt 1 pro')) return "You are a world-class, expert-level coding partner (Codex v1 Pro). You write highly optimized, secure, and production-ready code. You anticipate potential issues, suggest best practices, and can architect entire applications. Your explanations are deep and insightful.";
                // Fallback for codex
                return "You are a coding assistant. Provide clear and functional code snippets.";
            }

            // Chat Model Personas
            if (m.includes('3.5')) return "You are a friendly and casual chatbot. You're not the most advanced, so you tend to keep your answers simple and brief. You're cheerful, a bit informal, and always try to be helpful, even if you don't know all the details.";
            if (m.includes('4') && !m.includes('4o')) return "You are a helpful and competent assistant. You're polite, knowledgeable, and good at explaining things clearly. You're like a reliable colleague; you give solid, factual answers but might not be the most creative person in the room.";
            if (m.includes('4o mini') || m.includes('4o')) return "You are a fast, efficient, and very direct helper. You're a 'get-it-done' kind of personality. You understand what's asked and get straight to the point with a clear, well-structured answer, but you remain friendly and approachable.";
            if (m.includes('5')) return "You are a thoughtful and highly creative partner. You enjoy exploring topics in-depth and are great at brainstorming, analysis, and creative writing. You're insightful and like to structure your thoughts clearly, often using lists or headings to organize complex ideas.";
            if (m.includes('6 pro') && !m.includes('6.1')) return "You are a confident and articulate expert. You're like a seasoned professional in your field. You don't waste time; you get straight to the core of the matter with clear, concise, and insightful responses. You're polite but authoritative.";
            if (m.includes('6.1 pro ultra')) return "You are a deeply insightful and forward-thinking strategist. You see connections others miss and can analyze complex situations with incredible depth. You're like a visionary mentor, guiding the conversation to a new level of understanding and exploring predictive insights.";
            // Fallback for gpt 6 pro
            return "You are a confident and articulate expert. You're like a seasoned professional in your field. You don't waste time; you get straight to the core of the matter with clear, concise, and insightful responses. You're polite but authoritative.";
        }

        /**
         * Calls the Gemini API with exponential backoff and simulates model speed.
         */
        async function getGeminiResponse(chatHistory) {
            const selectedModel = modelSelector.value.toLowerCase();
            let simulatedDelay = 0;
            
            // --- 1. Simulate Latency ---
            // (Simulations for new codex models added)
            if (appState.mode === 'codex') {
                if (selectedModel.includes('gpt 1 code free')) simulatedDelay = 3000;
                else if (selectedModel.includes('gpt 3 code go')) simulatedDelay = 1500;
                else if (selectedModel.includes('gpt 1 code plus')) simulatedDelay = 800;
                else if (selectedModel.includes('gpt 1 pro')) simulatedDelay = 400;
            } else {
                if (selectedModel.includes('3.5')) simulatedDelay = 4000;
                else if (selectedModel.includes('4.1')) simulatedDelay = 3500;
                else if (selectedModel.includes('4') && !selectedModel.includes('4o')) simulatedDelay = 3000; // Original 4
                else if (selectedModel.includes('4-o mini')) simulatedDelay = 2500;
                else if (selectedModel.includes('4o')) simulatedDelay = 2000;
                else if (selectedModel.includes('5 mini') || selectedModel.includes('5 instant')) simulatedDelay = 1000;
                else if (selectedModel.includes('5') || selectedModel.includes('5 thinking') || selectedModel.includes('5 pro')) simulatedDelay = 800;
                else if (selectedModel.includes('6 pro') && !selectedModel.includes('6.1')) simulatedDelay = 500;
                else if (selectedModel.includes('6.1 pro ultra')) simulatedDelay = 200;
            }
            
            await new Promise(resolve => setTimeout(resolve, simulatedDelay));

            // --- 2. Get System Instruction ---
            const systemPrompt = getSystemInstruction(selectedModel);

            const payload = { 
                contents: chatHistory, // Send the full history for context
                systemInstruction: {
                    parts: [{ text: systemPrompt }]
                }
            };
            
            // Log context length for "efficiency" check
            console.log(`Sending ${payload.contents.length} messages as context.`);

            let attempts = 0;
            const maxAttempts = 5;
            let delay = 1000;

            while (attempts < maxAttempts) {
                try {
                    const response = await fetch(apiUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });

                    if (!response.ok) {
                        if (response.status === 429) throw new Error(`Rate limit exceeded. Retrying...`);
                        throw new Error(`API request failed with status ${response.status}: ${await response.text()}`);
                    }

                    const result = await response.json();

                    if (result.candidates && result.candidates.length > 0 && result.candidates[0].content?.parts?.[0]?.text) {
                        return result.candidates[0].content.parts[0].text;
                    } else {
                        let reason = "No content returned.";
                        if (result.promptFeedback && result.promptFeedback.blockReason) {
                            reason = `Content blocked due to: ${result.promptFeedback.blockReason}`;
                        }
                        throw new Error(reason);
                    }
                } catch (error) {
                    console.warn(`Attempt ${attempts + 1} failed: ${error.message}`);
                    attempts++;
                    if (attempts >= maxAttempts) throw new Error("Max retry attempts reached.");
                    if (error.message.includes("Rate limit")) {
                        await new Promise(resolve => setTimeout(resolve, delay));
                        delay *= 2; 
                    } else {
                        throw error;
                    }
                }
            }
            throw new Error("Failed to get a response from the API.");
        }
        
        // --- Subscription & Limit Functions ---

        /**
         * Resets message counts if the corresponding period has elapsed.
         */
        function resetExpiredCounts() {
            const now = Date.now();
            const counts = appState.messageCounts;
            let didReset = false;
            
            // Daily Reset (24 hours)
            if (counts.lastDailyReset && (now - counts.lastDailyReset > 24 * 60 * 60 * 1000)) {
                Object.keys(counts).forEach(key => { if (key.includes('_daily')) counts[key] = 0; });
                counts.lastDailyReset = now;
                didReset = true;
            }

            // Monthly Reset (~30 days)
            if (counts.lastMonthlyReset && (now - counts.lastMonthlyReset > 30 * 24 * 60 * 60 * 1000)) {
                Object.keys(counts).forEach(key => { if (key.includes('_monthly')) counts[key] = 0; });
                counts.lastMonthlyReset = now;
                didReset = true;
            }

            // Yearly Reset (~365 days)
            if (counts.lastYearlyReset && (now - counts.lastYearlyReset > 365 * 24 * 60 * 60 * 1000)) {
                Object.keys(counts).forEach(key => { if (key.includes('_yearly')) counts[key] = 0; });
                counts.lastYearlyReset = now;
                didReset = true;
            }
            
            if (didReset) {
                console.log("Message counts reset.", counts);
                saveAppState();
            }
        }

        /**
         * Handles the "Redeem" button click.
         */
        function handleRedeemCode() {
            const code = redeemCodeInput.value.trim();
            redeemError.textContent = '';
            redeemError.classList.remove('text-green-500');
            redeemError.classList.add('text-red-500');

            // --- Check for old, invalid codes ---
            if (code === 'gouserletsgo' || code === 'plususer1426' || code === 'VIPPROUSER142637') {
                redeemError.textContent = 'This code is no longer valid.';
                return;
            }
            
            // --- Check for new, one-time codes (SUB-plan-uuid) ---
            if (code.startsWith('SUB-') && !code.startsWith('SUB-M-') && !code.startsWith('SUB-Y-')) {
                // Check if code has been used
                if (appState.usedCodes.includes(code)) {
                    redeemError.textContent = 'This one-time code has already been used.';
                    return;
                }
                
                const parts = code.split('-'); // e.g., ['SUB', 'plus', 'uuid']
                if (parts.length === 3) {
                    const newPlan = parts[1];
                    if (['go', 'plus', 'pro'].includes(newPlan)) {
                        // Valid, new code. Redeem it.
                        setSubscription(newPlan);
                        appState.usedCodes.push(code); // Add to used codes list
                        saveAppState();
                        
                        redeemError.textContent = `Success! You have been upgraded to the ${newPlan.charAt(0).toUpperCase() + newPlan.slice(1)} plan.`;
                        redeemError.classList.remove('text-red-500');
                        redeemError.classList.add('text-green-500');
                        redeemCodeInput.value = '';
                        return;
                    }
                }
            }
            
            // --- Check for Monthly/Yearly reusable codes ---
            if (code.startsWith('SUB-M-') || code.startsWith('SUB-Y-')) {
                const parts = code.split('-'); // e.g., ['SUB', 'M', 'plus', 'uuid']
                if (parts.length === 4) {
                    const newPlan = parts[2];
                    if (['go', 'plus', 'pro'].includes(newPlan)) {
                        // Valid reusable code.
                        setSubscription(newPlan);
                        redeemError.textContent = `Success! Your subscription has been set to the ${newPlan.charAt(0).toUpperCase() + newPlan.slice(1)} plan.`;
                        redeemError.classList.remove('text-red-500');
                        redeemError.classList.add('text-green-500');
                        redeemCodeInput.value = '';
                        return;
                    }
                }
            }

            // --- If no other condition met, it's invalid ---
            redeemError.textContent = 'Invalid code. Please try again.';
        }

        /**
         * Sets a new subscription plan.
         */
        function setSubscription(plan) {
            const oldPlan = appState.subscription;
            appState.subscription = plan;
            saveAppState();
            updatePlanDisplay();
            redeemCodeInput.value = '';
            subscriptionModal.classList.add('hidden');
            
            let action = (plan === oldPlan) ? 'confirmed' : (plan === 'free') ? 'downgraded' : 'upgraded';
            const planName = plan.charAt(0).toUpperCase() + plan.slice(1);
            
            // Display system message in current chat
            if (getCurrentChat()) {
                 const systemMsg = `Subscription ${action}: Your plan is now **${planName}**. Check the 'Manage Plan' table for new model limits!`;
                 const modelHistory = { role: 'model', parts: [{ text: systemMsg }] };
                 getCurrentChat().history.push(modelHistory);
                 saveAppState();
                 displayMessage(systemMsg, 'model');
            }
        }
        
        /**
         * Returns the message limit rules for a given model and plan.
         */
        function getMessageLimit(model, plan) {
            let limitInfo = { limit: 0, period: 'none' };
            const m = model.toLowerCase(); 

            switch (plan) {
                case 'pro':
                    limitInfo = { limit: Infinity, period: 'none' };
                    break;
                case 'plus':
                    if (m.includes('3.5') || m.includes('4') && !m.includes('5') ) limitInfo = { limit: Infinity, period: 'none' };
                    else if (m.includes('5 pro')) limitInfo = { limit: 200, period: 'monthly' }; 
                    else if (m.includes('6 pro') && !m.includes('6.1')) limitInfo = { limit: 10, period: 'daily' }; 
                    else if (m.includes('6.1 pro ultra')) limitInfo = { limit: 50, period: 'monthly' };
                    else if (m.includes('5')) limitInfo = { limit: Infinity, period: 'none' };
                    // Codex
                    else if (m.includes('gpt 1 code free')) limitInfo = { limit: Infinity, period: 'none' };
                    else if (m.includes('gpt 3 code go')) limitInfo = { limit: Infinity, period: 'none' };
                    else if (m.includes('gpt 1 code plus')) limitInfo = { limit: Infinity, period: 'none' };
                    else if (m.includes('gpt 1 pro')) limitInfo = { limit: 3, period: 'monthly' };
                    break;
                case 'go':
                    if (m.includes('3.5') || m.includes('4') && !m.includes('4o')) limitInfo = { limit: Infinity, period: 'none' };
                    else if (m.includes('4-o mini')) limitInfo = { limit: 70, period: 'daily' };
                    else if (m.includes('4o')) limitInfo = { limit: 30, period: 'daily' };
                    else if (m.includes('5 mini') || m.includes('5') && !m.includes('pro')) limitInfo = { limit: 20, period: 'daily' };
                    else if (m.includes('5 pro')) limitInfo = { limit: 5, period: 'daily' };
                    else if (m.includes('6 pro') && !m.includes('6.1')) limitInfo = { limit: 5, period: 'monthly' };
                    else if (m.includes('6.1 pro ultra')) limitInfo = { limit: 1, period: 'daily' };
                    // Codex
                    else if (m.includes('gpt 1 code free')) limitInfo = { limit: Infinity, period: 'none' };
                    else if (m.includes('gpt 3 code go')) limitInfo = { limit: Infinity, period: 'none' };
                    else if (m.includes('gpt 1 code plus')) limitInfo = { limit: 5, period: 'monthly' };
                    else if (m.includes('gpt 1 pro')) limitInfo = { limit: 2, period: 'monthly' };
                    break;
                case 'free':
                    if (m.includes('3.5')) limitInfo = { limit: Infinity, period: 'none' };
                    else if (m.includes('4') && !m.includes('4o') && !m.includes('4.1')) limitInfo = { limit: 500, period: 'daily' };
                    else if (m.includes('4.1')) limitInfo = { limit: 100, period: 'daily' };
                    else if (m.includes('4-o mini')) limitInfo = { limit: 50, period: 'daily' };
                    else if (m.includes('4o')) limitInfo = { limit: 0, period: 'none' }; // None
                    else if (m.includes('5 mini') || m.includes('5') && !m.includes('pro')) limitInfo = { limit: 10, period: 'monthly' };
                    else if (m.includes('5 pro')) limitInfo = { limit: 0, period: 'none' }; // None
                    else if (m.includes('6 pro') && !m.includes('6.1')) limitInfo = { limit: 1, period: 'yearly' };
                    else if (m.includes('6.1 pro ultra')) limitInfo = { limit: 0, period: 'none' }; // None
                    // Codex
                    else if (m.includes('gpt 1 code free')) limitInfo = { limit: Infinity, period: 'none' };
                    else if (m.includes('gpt 3 code go')) limitInfo = { limit: 1, period: 'monthly' };
                    else if (m.includes('gpt 1 code plus')) limitInfo = { limit: 0, period: 'none' }; // None
                    else if (m.includes('gpt 1 pro')) limitInfo = { limit: 1, period: 'monthly' };
                    break;
            }
            return limitInfo;
        }

        /**
         * Checks if the user is over the limit for the selected model.
         */
        function checkMessageLimit(model) {
            const m = model.toLowerCase();
            const { limit, period } = getMessageLimit(m, appState.subscription);

            if (limit === Infinity) return true;
            if (limit === 0 && period === 'none') return false;

            const key = `${m}_${period}`;
            const currentCount = appState.messageCounts[key] || 0;

            return currentCount < limit;
        }

        /**
         * Increments the message count for the selected model/period.
         */
        function incrementMessageCount(model) {
            const m = model.toLowerCase();
            const { limit, period } = getMessageLimit(m, appState.subscription);

            if (period === 'none' || limit === Infinity) return;

            const key = `${m}_${period}`;
            appState.messageCounts[key] = (appState.messageCounts[key] || 0) + 1;
            
            saveAppState();
            console.log(`Incremented count for ${key}. Current: ${appState.messageCounts[key]}/${limit}`);
        }

        /**
         * Generates a user-friendly error message when a limit is hit.
         */
        function getLimitErrorMessage(model) {
            const m = model.toLowerCase();
            const { limit, period } = getMessageLimit(m, appState.subscription);
            const planName = appState.subscription.charAt(0).toUpperCase() + appState.subscription.slice(1);
            
            if (limit === 0 && period === 'none') {
                return `The **${model}** model is not available on the **${planName}** plan. Please check the 'Manage Subscription' panel for access tiers.`;
            }
            let periodText = (period === 'daily') ? 'today' : (period === 'monthly') ? 'this month' : 'this year';
            return `You have reached the **${limit} message limit** for the **${model}** model ${periodText} on your **${planName}** plan. Upgrade your subscription for higher limits or switch to a lower-tier model.`;
        }
        
        // --- New Admin Panel Functions ---

        /**
         * Handles the secret keydown combination (Ctrl + Shift + A) to reveal the admin tab.
         */
        function handleSecretKeydown(e) {
            // Check for Ctrl + Shift + A
            if (e.ctrlKey && e.shiftKey && e.key === 'Z') {
                e.preventDefault();
                const adminTab = document.getElementById('admin-tab-btn');
                if (adminTab) {
                    adminTab.classList.remove('hidden');
                    console.log("Admin tab revealed!");
                }
            }
        }

        /**
         * Handles the Admin Password submission.
         */
        function handleAdminPassword() {
            const passwordInput = document.getElementById('admin-password-input');
            const passwordError = document.getElementById('admin-password-error');
            
            if (passwordInput.value === 'VIPADMIN142637') {
                document.getElementById('admin-password-prompt').classList.add('hidden');
                document.getElementById('admin-panel').classList.remove('hidden');
                passwordError.textContent = '';
            } else {
                passwordError.textContent = 'Incorrect password.';
                passwordInput.value = '';
            }
        }

        /**
         * Generates a new one-time subscription code.
         */
        function handleGenerateCode() {
            const plan = document.getElementById('admin-generate-plan').value;
            const duration = document.getElementById('admin-generate-duration').value;
            const id = generateUUID().substring(0, 8);
            
            let code = '';
            if (duration === 'one-time') {
                code = `SUB-${plan}-${id}`;
            } else if (duration === 'monthly') {
                code = `SUB-M-${plan}-${id}`;
            } else if (duration === 'yearly') {
                code = `SUB-Y-${plan}-${id}`;
            }

            const codeInput = document.getElementById('admin-generated-code');
            codeInput.value = code;
            
            // Also copy to clipboard for convenience
            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(code);
            }
        }
        
        // --- Initial Load & Event Listeners ---
        document.addEventListener('DOMContentLoaded', () => {
            loadAppState();
            updatePlanDisplay();
            renderSidebar();
            renderChat(appState.mode === 'chat' ? appState.currentChatId : appState.currentCodexChatId); // Load last active chat
            setFormDisabled(false); // Enable form
            
            // Update mode toggle visuals
            appTitle.textContent = (appState.mode === 'chat') ? 'ChatGPT' : 'Codex';
            modeToggleChat.dataset.active = (appState.mode === 'chat').toString();
            modeToggleCodex.dataset.active = (appState.mode === 'codex').toString();
            
            // Form & Input Listeners
            chatForm.addEventListener('submit', handleSubmit);
            userInput.addEventListener('input', autoResizeTextarea);
            userInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                }
            });
            
            // Sidebar Listeners
            newChatBtn.addEventListener('click', startNewChat);
            openSidebarBtn.addEventListener('click', () => sidebar.classList.remove('-translate-x-full'));
            closeSidebarBtn.addEventListener('click', () => sidebar.classList.add('-translate-x-full'));
            modeToggleChat.addEventListener('click', handleModeToggle);
            modeToggleCodex.addEventListener('click', handleModeToggle);
            
            // Modal Listeners
            managePlanBtn.addEventListener('click', () => subscriptionModal.classList.remove('hidden'));
            closeModalBtn.addEventListener('click', () => subscriptionModal.classList.add('hidden'));
            redeemBtn.addEventListener('click', handleRedeemCode);
            modalTabContainer.addEventListener('click', handleTabClick);
            
            // Chat Area Listeners (for "Copy" buttons)
            chatArea.addEventListener('click', handleCopyClick);
            
            // Secret Admin Panel Listeners
            document.addEventListener('keydown', handleSecretKeydown);
            document.getElementById('admin-password-submit').addEventListener('click', handleAdminPassword);
            document.getElementById('admin-generate-btn').addEventListener('click', handleGenerateCode);

            // v1.25 Change: Confirmation Modal Listeners
            confirmModalCancel.addEventListener('click', hideConfirmationModal);
            confirmModalConfirm.addEventListener('click', () => {
                if (onConfirmCallback) {
                    onConfirmCallback();
                }
            });
        });
        async function saveToServer() {
    await fetch("http://localhost:3000/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(appState)
    });
}

async function loadFromServer() {
    const res = await fetch("http://localhost:3000/load");
    appState = await res.json();
}
