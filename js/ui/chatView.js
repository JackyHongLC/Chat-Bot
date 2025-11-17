import { $ } from '../utils/dom.js';
import { setInputEnabled } from './inputHandler.js';

const chatContainer = $('#chat-container');
let onSuggestionClick = () => {};

/**
 * Custom renderer for marked.js to add language attribute to <pre> tags.
 */
const renderer = new marked.Renderer();
const originalCodeRenderer = renderer.code;
renderer.code = function(code, language) {
    const renderedCode = originalCodeRenderer.call(this, code, language);
    // Add data-lang attribute to the <pre> tag for the CSS pseudo-element
    return renderedCode.replace('<pre>', `<pre data-lang="${language || ''}">`);
};

marked.setOptions({
    renderer: renderer,
    highlight: function(code, lang) {
        const language = hljs.getLanguage(lang) ? lang : 'plaintext';
        return hljs.highlight(code, { language }).value;
    },
    langPrefix: 'hljs language-', // Used by highlight.js
    gfm: true,
    breaks: true,
});

function createMessageBubble(message) {
    const wrapper = document.createElement('div');
    wrapper.className = `message-wrapper ${message.role}`;

    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';

    if (message.role === 'error') {
        bubble.classList.add('error-message-bubble');
        bubble.textContent = message.content;
    } else if (message.role === 'user') {
        bubble.textContent = message.content;
    } else if (message.role === 'ai') {
        // AI message content is an object: { answer, suggestions }
        const parsedMarkdown = marked.parse(message.content.answer);
        bubble.innerHTML = parsedMarkdown;

        // Add language attribute to pre tags for CSS styling
        bubble.querySelectorAll('pre code').forEach(block => {
            const lang = block.className.replace('hljs language-', '');
            if (block.parentElement) {
                 block.parentElement.setAttribute('data-lang', lang || 'text');
            }
        });

        if (message.content.suggestions && message.content.suggestions.length > 0) {
            const suggestionsContainer = document.createElement('div');
            suggestionsContainer.className = 'suggestions-container';
            message.content.suggestions.forEach(text => {
                const btn = document.createElement('button');
                btn.className = 'suggestion-btn';
                btn.textContent = text;
                btn.onclick = () => onSuggestionClick(text);
                suggestionsContainer.appendChild(btn);
            });
            wrapper.appendChild(suggestionsContainer);
        }
    }

    wrapper.prepend(bubble); // bubble is prepended to be before suggestions
    return wrapper;
}


export function appendMessage(message) {
    const messageElement = createMessageBubble(message);
    chatContainer.appendChild(messageElement);
    scrollToBottom();
}

export function showLoadingIndicator() {
    setInputEnabled(false);
    const loadingMessage = { role: 'ai', content: { answer: '思考中...', suggestions: [] } };
    const bubble = createMessageBubble(loadingMessage);
    bubble.id = 'loading-indicator';
    bubble.querySelector('.message-bubble').innerHTML = `<div class="typing-indicator"><span></span><span></span><span></span></div>`;
    chatContainer.appendChild(bubble);
    scrollToBottom();
}

export function hideLoadingIndicator() {
    setInputEnabled(true);
    const indicator = $('#loading-indicator');
    if (indicator) {
        indicator.remove();
    }
}

export function renderConversation(messages) {
    chatContainer.innerHTML = '';
    messages.forEach(msg => appendMessage(msg));
}

export function initChatView(suggestionHandler) {
    onSuggestionClick = suggestionHandler;
}

function scrollToBottom() {
    chatContainer.scrollTop = chatContainer.scrollHeight;
}
