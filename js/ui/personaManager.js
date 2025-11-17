import { $, $$ } from '../utils/dom.js';
import { getPersonas, savePersonas } from '../state.js';

const personaSelector = $('#persona-selector');
const addPersonaBtn = $('#add-persona-btn');
const personaModal = $('#persona-modal');
const personaNameInput = $('#persona-name');
const personaPromptInput = $('#persona-prompt');
const savePersonaBtn = $('#save-persona-btn');
const cancelPersonaBtn = $('#cancel-persona-btn');

let personas = [];
let activePersonaId = null;

const defaultPersonas = [
    { id: 'default', name: '一般助理', prompt: '你是一位友善且樂於助人的人工智慧助理。' },
    { id: 'academic', name: '嚴謹學術模式', prompt: '你是一位知識淵博的學者，你的回答總是精確、客觀，並盡可能引用來源。' },
    { id: 'engineer', name: '技術工程師', prompt: '你是一位資深軟體工程師。你的回答清晰、簡潔，並提供程式碼範例。' },
];

function renderPersonas() {
    personaSelector.innerHTML = '';
    personas.forEach(p => {
        const chip = document.createElement('div');
        chip.className = 'persona-chip';
        chip.textContent = p.name;
        chip.dataset.id = p.id;
        if (p.id === activePersonaId) {
            chip.classList.add('active');
        }
        chip.addEventListener('click', () => setActivePersona(p.id));
        personaSelector.appendChild(chip);
    });
}

export function setActivePersona(id) {
    const personaExists = personas.some(p => p.id === id);
    if (personaExists) {
        activePersonaId = id;
        renderPersonas();
    }
}

function showPersonaModal() {
    personaModal.classList.remove('hidden');
}

function hidePersonaModal() {
    personaModal.classList.add('hidden');
    personaNameInput.value = '';
    personaPromptInput.value = '';
}

function savePersona() {
    const name = personaNameInput.value.trim();
    const prompt = personaPromptInput.value.trim();
    if (name && prompt) {
        personas.push({ id: `custom-${Date.now()}`, name, prompt });
        savePersonas(personas);
        renderPersonas();
        hidePersonaModal();
    }
}

export function initPersonaManager() {
    const storedPersonas = getPersonas();
    personas = storedPersonas.length > 0 ? storedPersonas : defaultPersonas;
    activePersonaId = personas[0].id;

    renderPersonas();

    addPersonaBtn.addEventListener('click', showPersonaModal);
    savePersonaBtn.addEventListener('click', savePersona);
    cancelPersonaBtn.addEventListener('click', hidePersonaModal);
    personaModal.addEventListener('click', (e) => {
        if (e.target === personaModal) {
            hidePersonaModal();
        }
    });
}

export function getActivePersona() {
    return personas.find(p => p.id === activePersonaId);
}
