const src = 'https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js';
const script = document.createElement('script');
script.type = 'text/javascript';
script.src = src;

script.onload = function() {
    console.log('CryptoJS loaded successfully!');
    
    const SECRET_KEY = 'fofo';
    
    function encryptValue(value) {
        if (!value || value.trim() === '') return '';
        return CryptoJS.AES.encrypt(value, SECRET_KEY).toString();
    }
    
    function encryptInputs() {
        const usernameInput = document.querySelector('input[name="tbUsername"]');
        if (usernameInput && usernameInput.value) {
            console.log('Encrypting username...');
            usernameInput.value = encryptValue(usernameInput.value);
        }
        
        const passwordInput = document.querySelector('input[name="tbPassword"]');
        if (passwordInput && passwordInput.value) {
            console.log('Encrypting password...');
            passwordInput.value = encryptValue(passwordInput.value);
        }
    }
    
    document.addEventListener('blur', function(e) {
        if (e.target.name === 'tbUsername' || e.target.name === 'tbPassword') {
            if (e.target.value && !e.target.dataset.encrypted) {
                console.log('Encrypting input:', e.target.name);
                e.target.dataset.original = e.target.value; // Store original
                e.target.value = encryptValue(e.target.value);
                e.target.dataset.encrypted = 'true';
            }
        }
    }, true);
    
    
    console.log('Encryption handlers set up!');
};

script.onerror = function() {
    console.error('Failed to load CryptoJS');
};

document.head.appendChild(script);