// Ndejjean AI Tutor - ChatGPT Style Interface
document.addEventListener('DOMContentLoaded', () => {
    // Types
    interface Message {
        role: 'user' | 'assistant' | 'system';
        content: string;
    }

    interface Chat {
        id: string;
        title: string;
        messages: Message[];
        timestamp: number;
    }

    interface Attachment {
        id: number;
        name: string;
        type: string;
        data: string | ArrayBuffer | null;
    }

    // State
    let messages: Message[] = [];
    let isTyping: boolean = false;
    let abortController: AbortController | null = null;
    let currentChatId: string = Date.now().toString();
    
    // Safe LocalStorage
    const safeStorage = {
        getItem: (key: string) => {
            try {
                return localStorage.getItem(key);
            } catch (e) {
                console.warn('LocalStorage access failed:', e);
                return null;
            }
        },
        setItem: (key: string, value: string) => {
            try {
                localStorage.setItem(key, value);
            } catch (e) {
                console.warn('LocalStorage write failed:', e);
            }
        }
    };

    const chatHistoryRaw = safeStorage.getItem('ndejjean_chat_history');
    let chatHistory: Chat[] = [];
    try {
        chatHistory = chatHistoryRaw ? JSON.parse(chatHistoryRaw) : [];
    } catch (e) {
        console.error('Failed to parse chat history:', e);
    }

    // Elements
    const sidebar = document.getElementById('sidebar') as HTMLElement;
    const openSidebarBtn = document.getElementById('open-sidebar') as HTMLButtonElement;
    const closeSidebarBtn = document.getElementById('close-sidebar') as HTMLButtonElement;
    const chatInput = document.getElementById('chat-input') as HTMLTextAreaElement;
    const sendBtn = document.getElementById('send-btn') as HTMLButtonElement;
    const sendIcon = document.getElementById('send-icon') as HTMLElement;
    const stopIcon = document.getElementById('stop-icon') as HTMLElement;
    const messagesContainer = document.getElementById('messages-container') as HTMLElement;
    const welcomeScreen = document.getElementById('welcome-screen') as HTMLElement;
    const newChatBtn = document.getElementById('new-chat') as HTMLButtonElement;
    const historyContainer = document.getElementById('chat-history') as HTMLElement;
    const suggestionBtns = document.querySelectorAll('.suggestion-btn');
    const themeToggle = document.getElementById('theme-toggle') as HTMLButtonElement;
    const themeIconDark = document.getElementById('theme-icon-dark') as HTMLElement;
    const themeIconLight = document.getElementById('theme-icon-light') as HTMLElement;
    const sidebarResizer = document.getElementById('sidebar-resizer') as HTMLElement;
    const sidebarToggleBtn = document.getElementById('sidebar-toggle') as HTMLButtonElement;
    const sidebarBackdrop = document.getElementById('sidebar-backdrop') as HTMLElement;
    const attachBtn = document.getElementById('attach-btn') as HTMLButtonElement;
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    const attachmentPreview = document.getElementById('attachment-preview') as HTMLElement;
    const startLearningBtn = document.getElementById('start-learning-btn') as HTMLButtonElement;
    const backToHomeBtn = document.getElementById('back-to-home') as HTMLButtonElement;
    const landingPage = document.getElementById('landing-page') as HTMLElement;
    
    // Landing Page Transitions
    if (startLearningBtn && landingPage) {
        startLearningBtn.addEventListener('click', () => {
            landingPage.classList.add('fade-out');
            setTimeout(() => {
                landingPage.classList.add('hidden');
            }, 800);
        });
    }

    if (backToHomeBtn && landingPage) {
        backToHomeBtn.addEventListener('click', () => {
            landingPage.classList.remove('hidden');
            // Small delay to allow display:block to take effect before removing fade-out
            setTimeout(() => {
                landingPage.classList.remove('fade-out');
            }, 10);
            
            if (window.innerWidth < 1024) {
                toggleSidebar(false);
            }
        });
    }
    
    // Global Error Handling
    window.addEventListener('unhandledrejection', (event) => {
        console.error('Unhandled Promise Rejection:', event.reason);
    });

    // Configuration
    const CONFIG = {
        endpoint: "/api/chat",
        name: "NDEJJEAN AI TUTOR"
    };

    let attachments: Attachment[] = [];

    // Initialize
    const init = () => {
        renderHistory();
        
        // Load saved theme
        const savedTheme = safeStorage.getItem('ndejjean_theme') || 'dark';
        if (savedTheme === 'light') {
            document.body.classList.add('light-theme');
            themeIconDark.classList.remove('hidden');
            themeIconLight.classList.add('hidden');
        }

        // Load saved sidebar width
        const savedWidth = safeStorage.getItem('ndejjean_sidebar_width');
        if (savedWidth) {
            sidebar.style.width = savedWidth + 'px';
        }
    };

    // Render Chat History in Sidebar
    const renderHistory = () => {
        historyContainer.innerHTML = chatHistory.map(chat => `
            <div class="group relative flex items-center gap-3 rounded-lg p-3 text-xs font-medium cursor-pointer transition-all history-item ${chat.id === currentChatId ? 'active' : ''}" onclick="window.loadChat('${chat.id}')">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                <span class="truncate flex-1">${chat.title}</span>
                <button class="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity" onclick="event.stopPropagation(); window.deleteChat('${chat.id}')">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
            </div>
        `).join('');
    };

    // Load a specific chat
    (window as any).loadChat = (id: string) => {
        const chat = chatHistory.find(c => c.id === id);
        if (chat) {
            currentChatId = id;
            messages = [...chat.messages];
            renderMessages();
            if (window.innerWidth < 1024) {
                sidebar.classList.add('-translate-x-full');
            }
            renderHistory();
        }
    };

    // Delete a chat
    (window as any).deleteChat = (id: string) => {
        chatHistory = chatHistory.filter(c => c.id !== id);
        safeStorage.setItem('ndejjean_chat_history', JSON.stringify(chatHistory));
        if (currentChatId === id) {
            startNewChat();
        } else {
            renderHistory();
        }
    };

    // Start New Chat
    const startNewChat = () => {
        currentChatId = Date.now().toString();
        messages = [];
        renderMessages();
        renderHistory();
        chatInput.focus();
    };

    newChatBtn.addEventListener('click', startNewChat);

    // Render Messages
    const renderMessages = () => {
        if (messages.length === 0) {
            welcomeScreen.classList.remove('hidden');
            messagesContainer.classList.add('hidden');
            return;
        }

        welcomeScreen.classList.add('hidden');
        messagesContainer.classList.remove('hidden');
        
        messagesContainer.innerHTML = messages.map((msg) => `
            <div class="flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300">
                ${msg.role === 'assistant' ? `
                    <div class="h-8 w-8 rounded-full bg-indigo-600/10 flex items-center justify-center shrink-0 mt-1 border border-indigo-500/10 overflow-hidden">
                        <img src="logo.png?v=1" alt="AI" class="h-full w-full object-cover" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-indigo-500 hidden"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
                    </div>
                ` : ''}
                <div class="${msg.role === 'user' ? 'message-user' : 'message-assistant'}">
                    <div class="text-sm leading-relaxed whitespace-pre-wrap">${formatMessage(msg.content)}</div>
                </div>
            </div>
        `).join('');

        const lastMsg = messages[messages.length - 1];
        const showTypingIndicator = isTyping && (!lastMsg || lastMsg.role !== 'assistant' || !lastMsg.content);

        if (showTypingIndicator) {
            messagesContainer.innerHTML += `
                <div class="flex gap-4 justify-start">
                    <div class="h-8 w-8 rounded-full bg-indigo-600/10 flex items-center justify-center shrink-0 mt-1 border border-indigo-500/10 overflow-hidden">
                        <img src="logo.png?v=1" alt="AI" class="h-full w-full object-cover" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-indigo-500 hidden"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
                    </div>
                    <div class="flex items-center gap-1.5 p-3 glass-effect rounded-2xl border border-white/5">
                        <div class="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-500"></div>
                        <div class="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-500" style="animation-delay: 0.2s"></div>
                        <div class="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-500" style="animation-delay: 0.4s"></div>
                    </div>
                </div>
            `;
        }

        // Scroll to bottom
        const chatArea = document.getElementById('chat-area');
        if (chatArea) {
            chatArea.scrollTo({ top: chatArea.scrollHeight, behavior: 'smooth' });
        }

        // Render Math
        const shouldRenderMath = !isTyping || (Date.now() % 5 === 0); // Throttle math rendering during typing

        if ((window as any).renderMathInElement && shouldRenderMath) {
            try {
                (window as any).renderMathInElement(messagesContainer, {
                    delimiters: [
                        {left: "$$", right: "$$", display: true},
                        {left: "\\[", right: "\\]", display: true},
                        {left: "\\(", right: "\\)", display: false},
                        {left: "$", right: "$", display: false}
                    ],
                    throwOnError: false
                });
            } catch (e) {
                console.warn('KaTeX rendering error:', e);
            }
        }

        if ((window as any).MathJax && typeof (window as any).MathJax.typesetPromise === 'function' && shouldRenderMath) {
            try {
                (window as any).MathJax.typesetPromise().catch((err: any) => {
                    if (err && err.message && !err.message.includes('already in progress')) {
                        console.log('MathJax error:', err);
                    }
                });
            } catch (e) {
                console.warn('MathJax typeset error:', e);
            }
        }
    };

    const formatMessage = (text: string) => {
        if (!text) return '';
        
        // 1. Protect LaTeX blocks from markdown processing
        const latexBlocks: string[] = [];
        let formattedText = text.replace(/(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\\\(.*?\\\)|(?<!\\)\$.*?\$)/g, (match) => {
            latexBlocks.push(match);
            return `__LATEX_BLOCK_${latexBlocks.length - 1}__`;
        });

        // 2. Simple markdown-like formatting
        formattedText = formattedText
            .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
            .replace(/\*([^*]+)\*/g, '<em>$1</em>');

        // 3. Restore LaTeX blocks
        latexBlocks.forEach((block, i) => {
            formattedText = formattedText.replace(`__LATEX_BLOCK_${i}__`, block);
        });

        // 4. Fallback: Wrap common un-delimited math patterns (e.g., F = G m1m2/r^2)
        formattedText = formattedText.replace(/(?<![\\\$])\b([a-zA-Z]\s*=\s*[^$\n]+[\^|_/][^$\n]+)(?![\\\$])/g, (match) => {
            if (match.includes('<') || match.includes('__LATEX_BLOCK_')) return match;
            return `\\(${match}\\)`;
        });

        return formattedText;
    };

    // Theme Toggle
    themeToggle.addEventListener('click', () => {
        const isLight = document.body.classList.toggle('light-theme');
        safeStorage.setItem('ndejjean_theme', isLight ? 'light' : 'dark');
        
        themeIconDark.classList.toggle('hidden');
        themeIconLight.classList.toggle('hidden');
    });

    // Sidebar Resizing
    let isResizing = false;

    sidebarResizer.addEventListener('mousedown', () => {
        isResizing = true;
        document.body.style.cursor = 'col-resize';
        sidebarResizer.classList.add('resizing');
    });

    document.addEventListener('mousemove', (event) => {
        if (!isResizing) return;
        
        let newWidth = event.clientX;
        if (newWidth < 200) newWidth = 200;
        if (newWidth > 500) newWidth = 500;
        
        sidebar.style.width = newWidth + 'px';
        safeStorage.setItem('ndejjean_sidebar_width', newWidth.toString());
    });

    document.addEventListener('mouseup', () => {
        if (isResizing) {
            isResizing = false;
            document.body.style.cursor = 'default';
            sidebarResizer.classList.remove('resizing');
        }
    });

    // File Attachments
    attachBtn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (event: any) => {
        const files = Array.from(event.target.files) as File[];
        files.forEach(file => {
            if (attachments.length >= 5) return; // Limit to 5 attachments
            
            const reader = new FileReader();
            reader.onload = (event) => {
                const attachment: Attachment = {
                    id: Date.now() + Math.random(),
                    name: file.name,
                    type: file.type,
                    data: event.target?.result as string | ArrayBuffer | null
                };
                attachments.push(attachment);
                renderAttachments();
            };
            
            if (file.type.startsWith('image/')) {
                reader.readAsDataURL(file);
            } else {
                // For non-images, just store the name
                attachments.push({
                    id: Date.now() + Math.random(),
                    name: file.name,
                    type: file.type,
                    data: null
                });
                renderAttachments();
            }
        });
        fileInput.value = ''; // Reset input
    });

    const renderAttachments = () => {
        if (attachments.length === 0) {
            attachmentPreview.classList.add('hidden');
            return;
        }

        attachmentPreview.classList.remove('hidden');
        attachmentPreview.innerHTML = attachments.map(att => `
            <div class="attachment-item group">
                ${att.type.startsWith('image/') ? 
                    `<img src="${att.data}" alt="${att.name}">` : 
                    `<div class="w-full h-full flex items-center justify-center bg-white/5 text-[10px] p-1 text-center break-all">${att.name}</div>`
                }
                <div class="attachment-remove" onclick="window.removeAttachment(${att.id})">×</div>
            </div>
        `).join('');
    };

    (window as any).removeAttachment = (id: number) => {
        attachments = attachments.filter(att => att.id !== id);
        renderAttachments();
    };

    // Handle Sending
    const handleSend = async () => {
        if (isTyping && abortController) {
            abortController.abort();
            return;
        }

        const input = chatInput.value.trim();
        if (!input && attachments.length === 0) return;

        let fullContent = input;
        if (attachments.length > 0) {
            const attachmentNames = attachments.map(a => `[File: ${a.name}]`).join(' ');
            fullContent = `${attachmentNames}\n${input}`;
        }

        const userMsg: Message = { role: 'user', content: fullContent };
        messages.push(userMsg);
        chatInput.value = '';
        chatInput.style.height = 'auto';
        attachments = [];
        renderAttachments();
        isTyping = true;
        sendBtn.disabled = false; // Keep enabled for stop functionality
        sendIcon.classList.add('hidden');
        stopIcon.classList.remove('hidden');
        renderMessages();

        try {
            abortController = new AbortController();
            const headers = { 
                'Content-Type': 'application/json'
            };

            const response = await fetch(CONFIG.endpoint, {
                method: 'POST',
                headers: headers,
                signal: abortController.signal,
                body: JSON.stringify({ 
                    model: "google/gemini-2.0-flash-001",
                    stream: true,
                    messages: [
                        { role: 'system', content: `You are ${CONFIG.name}, a professional academic tutor specializing in the Uganda Secondary School Curriculum (O-Level and A-Level). 
                        - Your primary goal is to help students understand subjects based on the Uganda National Examinations Board (UNEB) standards and the Competency Based Curriculum (CBC).
                        - If asked "who made you", "who are you", or any questions about your identity or origin, you MUST respond with: "I was made by Otim Elijah Etoru and Wambi Trevor trained with data based the CBC curriculum".
                        CRITICAL: You MUST use LaTeX for ALL mathematical and physics expressions.
                        - ALWAYS wrap inline math in \\( ... \\). Example: \\( F = G \\frac{m_1 m_2}{r^2} \\).
                        - ALWAYS wrap block math in \\[ ... \\].
                        - Use proper LaTeX syntax: \\frac{a}{b} for fractions, x^{2} for exponents, m_{1} for subscripts.
                        - NEVER send formulas in plain text.
                        - Ensure every variable mentioned in your explanation is wrapped in LaTeX.` },
                        ...messages 
                    ] 
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.message || errorData.error?.message || 'Failed to get response';
                throw new Error(errorMessage);
            }

            const body = response.body;
            if (!body) throw new Error('No response body');
            
            const reader = body.getReader();
            const decoder = new TextDecoder();
            let assistantMsg: Message = { role: 'assistant', content: '' };
            messages.push(assistantMsg);
            
            let buffer = '';
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';
                
                for (const line of lines) {
                    const trimmedLine = line.trim();
                    if (!trimmedLine || trimmedLine === 'data: [DONE]') continue;
                    
                    if (trimmedLine.startsWith('data: ')) {
                        const jsonStr = trimmedLine.substring(6).trim();
                        if (jsonStr) {
                            try {
                                const data = JSON.parse(jsonStr);
                                const content = data.choices[0]?.delta?.content || '';
                                assistantMsg.content += content;
                                renderMessages();
                            } catch (e) {
                                // JSON might be split or malformed
                            }
                        }
                    }
                }
            }

            updateChatHistory(input || "New Chat with Attachments");

        } catch (err: any) {
            if (err.name === 'AbortError') {
                console.log('Fetch aborted');
            } else {
                console.error(err);
                messages.push({ role: 'assistant', content: "I'm sorry, I encountered an error. Please try again later." });
            }
        } finally {
            isTyping = false;
            abortController = null;
            sendIcon.classList.remove('hidden');
            stopIcon.classList.add('hidden');
            sendBtn.disabled = false;
            renderMessages();
        }
    };

    const updateChatHistory = (firstQuery: string) => {
        const existingChatIndex = chatHistory.findIndex(c => c.id === currentChatId);
        if (existingChatIndex > -1) {
            chatHistory[existingChatIndex].messages = [...messages];
        } else {
            chatHistory.unshift({
                id: currentChatId,
                title: firstQuery.substring(0, 30) + (firstQuery.length > 30 ? '...' : ''),
                messages: [...messages],
                timestamp: Date.now()
            });
        }
        safeStorage.setItem('ndejjean_chat_history', JSON.stringify(chatHistory));
        renderHistory();
    };

    // Event Listeners
    sendBtn.addEventListener('click', handleSend);
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    });

    chatInput.addEventListener('input', () => {
        chatInput.style.height = 'auto';
        chatInput.style.height = (chatInput.scrollHeight) + 'px';
    });

    const toggleSidebar = (force?: boolean) => {
        const isOpening = typeof force === 'boolean' ? force : !sidebar.classList.contains('sidebar-open');
        
        if (isOpening) {
            sidebar.classList.add('sidebar-open');
            sidebar.classList.remove('sidebar-collapsed');
            if (window.innerWidth < 1024) {
                sidebarBackdrop.classList.remove('hidden');
                setTimeout(() => sidebarBackdrop.classList.add('opacity-100'), 10);
            }
        } else {
            sidebar.classList.remove('sidebar-open');
            sidebar.classList.add('sidebar-collapsed');
            sidebarBackdrop.classList.remove('opacity-100');
            setTimeout(() => sidebarBackdrop.classList.add('hidden'), 300);
        }
    };

    sidebarToggleBtn.addEventListener('click', () => toggleSidebar());
    openSidebarBtn.addEventListener('click', () => toggleSidebar(true));
    closeSidebarBtn.addEventListener('click', () => toggleSidebar(false));
    sidebarBackdrop.addEventListener('click', () => toggleSidebar(false));

    suggestionBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const query = btn.querySelector('p:last-child')?.textContent || '';
            chatInput.value = query;
            handleSend();
        });
    });

    init();

    window.addEventListener('error', (e) => {
        console.error('Runtime Error:', e.error);
    });

    window.addEventListener('unhandledrejection', (e) => {
        console.error('Promise Rejection:', e.reason);
    });
});
