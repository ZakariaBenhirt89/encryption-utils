// Lightweight timestamped logger
function createLogger(scope) {
	const formatTime = () => new Date().toISOString();
	return {
		debug: function() { console.debug(`[${formatTime()}][DEBUG][${scope}]`, ...arguments); },
		info: function() { console.info(`[${formatTime()}][INFO][${scope}]`, ...arguments); },
		warn: function() { console.warn(`[${formatTime()}][WARN][${scope}]`, ...arguments); },
		error: function() { console.error(`[${formatTime()}][ERROR][${scope}]`, ...arguments); }
	};
}

const log = createLogger('utils');

log.info('Initializing encryption loader');

const src = 'https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js';
const script = document.createElement('script');
script.type = 'text/javascript';
script.src = src;

script.onload = function() {
	log.info('CryptoJS loaded successfully');
	log.debug('Defining encryption helpers');

	const SECRET_KEY = 'fofo';

	function encryptValue(value) {
		log.debug('encryptValue called', { hasValue: Boolean(value), inputLength: value ? value.length : 0 });
		if (!value || value.trim() === '') {
			log.debug('encryptValue early return for empty value');
			return '';
		}
		const result = CryptoJS.AES.encrypt(value, SECRET_KEY).toString();
		log.debug('encryptValue finished', { outputLength: result.length });
		return result;
	}

	function encryptInputs() {
		log.info('encryptInputs invoked');
		const usernameInput = document.querySelector('input[name="tbUsername"]');
		log.debug('Username input lookup', { found: Boolean(usernameInput) });
		if (usernameInput && usernameInput.value) {
			log.info('Encrypting username');
			usernameInput.value = encryptValue(usernameInput.value);
		}

		const passwordInput = document.querySelector('input[name="tbPassword"]');
		log.debug('Password input lookup', { found: Boolean(passwordInput) });
		if (passwordInput && passwordInput.value) {
			log.info('Encrypting password');
			passwordInput.value = encryptValue(passwordInput.value);
		}
		log.info('encryptInputs finished');
	}

	document.addEventListener('change', function(e) {
		log.debug('change event', { targetName: e && e.target ? e.target.name : undefined });
		if (e.target.name === 'tbUsername' || e.target.name === 'tbPassword') {
			if (e.target.value ) {
				log.info('Encrypting input on change', e.target.name);
				e.target.dataset.original = e.target.value; // Store original
				e.target.value = encryptValue(e.target.value);
				e.target.dataset.encrypted = 'true';
				log.debug('Input encrypted and dataset flag set', { name: e.target.name });
			}
		}
	}, true);

	log.info('Encryption handlers set up');
};

script.onerror = function() {
	log.error('Failed to load CryptoJS', { src });
};

log.info('Appending script to document.head', { src });
document.head.appendChild(script);
log.info('Script append initiated');