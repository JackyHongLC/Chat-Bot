import { $, $$ } from '../utils/dom.js';
import { getConversations, saveConversations } from '../state.js';

const historyList = $('#history-list');
const menuToggle = $('#menu-toggle');
const sidebar = $('.sidebar');

let conversations = [];
let activeConversationId = null;
let onConversationSelect = () => {};

function renderHistory() {
    historyList.innerHTML = '';
    conversations.forEach(convo => {
        const item = document.createElement('div');
        item.className = 'history-item';
        item.textContent = convo.title;
        item.dataset.id = convo.id;
        if (convo.id === activeConversationId) {
            item.classList.add('active');
        }
        item.addEventListener('click', () => {
            setActiveConversation(convo.id);
            onConversationSelect(convo);
            sidebar.classList.remove('open');
        });
        historyList.appendChild(item);
    });
}

export function setActiveConversation(id) {
    activeConversationId = id;
    renderHistory();
}

export function createNewConversation(personaId) {
    const newConvo = {
        id: `convo-${Date.now()}`,
        title: '新的對話',
        messages: [],
        personaId: personaId,
    };
    conversations.unshift(newConvo); // Add to the top
    setActiveConversation(newConvo.id);
    saveConversations(conversations);
    return newConvo;
}

export function addMessageToCurrentConversation(role, content) {
    if (!activeConversationId) return;

    const convo = conversations.find(c => c.id === activeConversationId);
    if (!convo) return;

    convo.messages.push({ role, content });

    // Update title with the first user message
    if (convo.messages.length === 1 && role === 'user') {
        convo.title = content.substring(0, 30);
    }

    saveConversations(conversations);
    renderHistory(); // Re-render to update title if it changed
}

export function getCurrentConversation() {
    return conversations.find(c => c.id === activeConversationId);
}

export function initSidebar(conversationSelectHandler) {
    onConversationSelect = conversationSelectHandler;
    conversations = getConversations();

    if (conversations.length > 0) {
        setActiveConversation(conversations[0].id);
        onConversationSelect(conversations[0]);
    }

    renderHistory();

    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
    });

    document.body.addEventListener('click', (e) => {
        if (sidebar.classList.contains('open') && !sidebar.contains(e.target) && e.target !== menuToggle) {
             sidebar.classList.remove('open');
        }
    });
}
