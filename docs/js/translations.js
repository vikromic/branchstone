// Translation system
let translations = {};
let currentLang = localStorage.getItem('language') || 'en';

// Load translations
async function loadTranslations() {
    try {
        const response = await fetch('js/translations.json');
        translations = await response.json();
        applyTranslations();
    } catch (error) {
        console.error('Error loading translations:', error);
    }
}

// Get nested translation value
function getTranslation(key, lang = currentLang) {
    const keys = key.split('.');
    let value = translations[lang];
    
    for (const k of keys) {
        if (value && typeof value === 'object') {
            value = value[k];
        } else {
            return null;
        }
    }
    
    return value || null;
}

// Apply translations to all elements with data-translate attribute
function applyTranslations() {
    const elements = document.querySelectorAll('[data-translate]');
    
    elements.forEach(element => {
        const key = element.getAttribute('data-translate');
        const translation = getTranslation(key);
        
        if (translation) {
            // Handle special cases
            if (key === 'home.title') {
                // Handle multi-line title
                const lines = translation.split('\n');
                element.innerHTML = lines.map(line => line.trim()).join('<br>');
            } else if (element.tagName === 'INPUT' && element.type === 'submit') {
                element.value = translation;
            } else if (element.tagName === 'BUTTON' && !element.querySelector('svg')) {
                element.textContent = translation;
            } else if (element.hasAttribute('placeholder')) {
                element.placeholder = translation;
            } else {
                // Check if content has line breaks
                if (translation.includes('\n')) {
                    // For elements that already have <p> tags, preserve structure
                    if (element.querySelector('p')) {
                        const paragraphs = translation.split('\n').filter(p => p.trim());
                        const existingParagraphs = element.querySelectorAll('p');
                        paragraphs.forEach((text, index) => {
                            if (existingParagraphs[index]) {
                                existingParagraphs[index].textContent = text.trim();
                            }
                        });
                    } else {
                        element.innerHTML = translation.split('\n').map(p => `<p>${p.trim()}</p>`).join('');
                    }
                } else {
                    element.textContent = translation;
                }
            }
        }
    });
    
    // Update language toggle button
    const langToggle = document.getElementById('lang-toggle');
    if (langToggle) {
        langToggle.textContent = currentLang === 'en' ? 'EN | UA' : 'EN | UA';
    }
    
    // Update HTML lang attribute
    document.documentElement.lang = currentLang;
}

// Switch language
function switchLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('language', lang);
    applyTranslations();
}

// Initialize language system
document.addEventListener('DOMContentLoaded', function() {
    loadTranslations();
    
    const langToggle = document.getElementById('lang-toggle');
    if (langToggle) {
        langToggle.addEventListener('click', function() {
            const newLang = currentLang === 'en' ? 'ua' : 'en';
            switchLanguage(newLang);
        });
    }
});

// Export for use in other scripts
window.switchLanguage = switchLanguage;
window.getTranslation = getTranslation;
Object.defineProperty(window, 'currentLang', {
    get: function() { return currentLang; },
    set: function(val) { currentLang = val; }
});

