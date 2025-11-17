import { $ } from '../utils/dom.js';

const dinoIcon = $('#dino-icon');
const chatInput = $('#chat-input');
const sendBtn = $('#send-btn');

function updateDinoVisibility() {
    const hasFocus = document.activeElement === chatInput;
    const isEmpty = chatInput.value.trim() === '';

    if (!hasFocus && isEmpty) {
        dinoIcon.classList.remove('hidden');
    } else {
        dinoIcon.classList.add('hidden');
    }
}

function autoResizeTextarea() {
    chatInput.style.height = 'auto';
    let newHeight = chatInput.scrollHeight;
    // Clamp the height to a max of 150px as defined in CSS
    if (newHeight > 150) {
        newHeight = 150;
    }
    chatInput.style.height = `${newHeight}px`;
}


export function initInputHandler(onSend) {
    chatInput.addEventListener('focus', updateDinoVisibility);
    chatInput.addEventListener('blur', updateDinoVisibility);
    chatInput.addEventListener('input', () => {
        updateDinoVisibility();
        autoResizeTextarea();
    });

    const sendMessage = () => {
        const message = chatInput.value.trim();
        if (message) {
            onSend(message);
            chatInput.value = '';
            autoResizeTextarea();
            updateDinoVisibility();
            chatInput.focus();
        }
    };

    sendBtn.addEventListener('click', sendMessage);

    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Initial state check
    updateDinoVisibility();
    autoResizeTextarea();
}

export function setInputEnabled(enabled) {
    chatInput.disabled = !enabled;
    sendBtn.disabled = !enabled;
}
