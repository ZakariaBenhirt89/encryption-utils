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

const log = createLogger('utils-v8');

log.info('Initializing encryption loader (v8 with submitButton swap)');

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

	function persistEncrypted(fieldName, encryptedValue) {
		try {
			if (typeof localStorage === 'undefined') {
				log.warn('localStorage not available; skipping persistence');
				return;
			}
			const keyMap = {
				bhCandidateNewName: 'ENC_bhCandidateNewName',
				bhCandidateNewPW: 'ENC_bhCandidateNewPW'
			};
			const storageKey = keyMap[fieldName];
			if (!storageKey) {
				log.debug('No storage key for field; skipping', { fieldName });
				return;
			}
			const payload = JSON.stringify({
				cipher: encryptedValue,
				timestamp: new Date().toISOString()
			});
			localStorage.setItem(storageKey, payload);
			log.info('Encrypted value persisted', { storageKey, length: encryptedValue ? encryptedValue.length : 0 });
		} catch (err) {
			log.error('Failed to persist encrypted value', { message: err && err.message });
		}
	}

	function ensureHiddenInput(fieldName) {
		const hiddenName = 'hidden' + fieldName;
		let hidden = document.querySelector('input[type="hidden"][name="' + hiddenName + '"]');
		if (!hidden) {
			// Try to attach to the same form as the source field if possible
			const source = document.querySelector('input[name="' + fieldName + '"]');
			const form = source && source.closest ? source.closest('form') : null;
			hidden = document.createElement('input');
			hidden.type = 'hidden';
			hidden.name = hiddenName;
			if (form) {
				form.appendChild(hidden);
				log.info('Created hidden input in form', { hiddenName });
			} else {
				document.body.appendChild(hidden);
				log.info('Created hidden input in body', { hiddenName });
			}
		}
		return hidden;
	}

	function updateHiddenEncrypted(fieldName, encryptedValue) {
		try {
			const hidden = ensureHiddenInput(fieldName);
			hidden.value = encryptedValue || '';
			log.debug('Updated hidden input with encrypted value', { hiddenName: 'hidden' + fieldName, length: encryptedValue ? encryptedValue.length : 0 });
		} catch (err) {
			log.error('Failed to update hidden input', { fieldName, message: err && err.message });
		}
	}

	function encryptInputs() {
		log.info('encryptInputs invoked');
		const usernameInput = document.querySelector('input[name="bhCandidateNewName"]');
		log.debug('Username input lookup', { found: Boolean(usernameInput) });
		if (usernameInput && usernameInput.value && !usernameInput.dataset.encrypted) {
			log.info('Encrypting username');
			usernameInput.dataset.original = usernameInput.value;
			usernameInput.value = encryptValue(usernameInput.value);
			usernameInput.dataset.encrypted = 'true';
			persistEncrypted('bhCandidateNewName', usernameInput.value);
			updateHiddenEncrypted('bhCandidateNewName', usernameInput.value);
		}

		const passwordInput = document.querySelector('input[name="bhCandidateNewPW"]');
		log.debug('Password input lookup', { found: Boolean(passwordInput) });
		if (passwordInput && passwordInput.value && !passwordInput.dataset.encrypted) {
			log.info('Encrypting password');
			passwordInput.dataset.original = passwordInput.value;
			passwordInput.value = encryptValue(passwordInput.value);
			passwordInput.dataset.encrypted = 'true';
			persistEncrypted('bhCandidateNewPW', passwordInput.value);
			updateHiddenEncrypted('bhCandidateNewPW', passwordInput.value);
		}
		log.info('encryptInputs finished');
	}

	function swapHiddenToVisible() {
		log.info('swapHiddenToVisible invoked');
		const fields = ['bhCandidateNewName', 'bhCandidateNewPW'];
		fields.forEach(function(fieldName) {
			const visible = document.querySelector('input[name="' + fieldName + '"]');
			const hidden = document.querySelector('input[type="hidden"][name="hidden' + fieldName + '"]');
			if (visible && hidden && typeof hidden.value === 'string' && hidden.value !== '') {
				visible.dataset.original = typeof visible.value === 'string' ? visible.value : '';
				visible.value = hidden.value;
				visible.dataset.encrypted = 'true';
				log.debug('Swapped hidden to visible', { fieldName, length: hidden.value.length });
			}
		});
		log.info('swapHiddenToVisible finished');
	}

	document.addEventListener('change', function(e) {
		log.debug('change event', { targetName: e && e.target ? e.target.name : undefined });
		if (e.target.name === 'bhCandidateNewName' || e.target.name === 'bhCandidateNewPW') {
			if (e.target.value && !e.target.dataset.encrypted) {
				log.info('Encrypting input on change', e.target.name);
				e.target.dataset.original = e.target.value; // Store original
				e.target.value = encryptValue(e.target.value);
				e.target.dataset.encrypted = 'true';
				persistEncrypted(e.target.name, e.target.value);
				updateHiddenEncrypted(e.target.name, e.target.value);
				log.debug('Input encrypted, dataset flag set, persisted, hidden updated', { name: e.target.name });
			}
		}
	}, true);

	// Ensure encryption happens on blur as user leaves the fields
	document.addEventListener('blur', function(e) {
		log.debug('blur event', { targetName: e && e.target ? e.target.name : undefined });
		if (e.target && (e.target.name === 'bhCandidateNewName' || e.target.name === 'bhCandidateNewPW')) {
			if (e.target.value && !e.target.dataset.encrypted) {
				log.info('Encrypting input on blur', e.target.name);
				e.target.dataset.original = e.target.value;
				e.target.value = encryptValue(e.target.value);
				e.target.dataset.encrypted = 'true';
				persistEncrypted(e.target.name, e.target.value);
				updateHiddenEncrypted(e.target.name, e.target.value);
			}
		}
	}, true);

	// Encrypt right before submission regardless of prior change events
	document.addEventListener('submit', function(e) {
		log.info('Form submit detected, enforcing encryption');
		try { encryptInputs();  swapHiddenToVisible(); } catch (err) { log.error('Error encrypting on submit', { message: err && err.message }); }
	}, true);

	// Also catch explicit clicks on submit buttons
	document.addEventListener('click', function(e) {
		const target = e.target;
		const isSubmit = target && (target.matches('button[type="submit"]') || target.matches('input[type="submit"]'));
		if (isSubmit) {
			log.info('Submit click detected, enforcing encryption via click');
			try { encryptInputs(); } catch (err) { log.error('Error encrypting on click', { message: err && err.message }); }
		}
	}, true);

	// New: handle specific testid submit button to swap hidden -> visible before submit
	document.addEventListener('click', function(e) {
		const btn = e.target && (e.target.closest ? e.target.closest('[data-testid="submitButton"]') : null);
		if (btn) {
			log.info('submitButton click detected, swapping hidden values into visible inputs');
			try { swapHiddenToVisible(); } catch (err) { log.error('Error swapping hidden to visible', { message: err && err.message }); }
		}
	}, true);

	log.info('Encryption handlers set up (v8)');
};

script.onerror = function() {
	log.error('Failed to load CryptoJS', { src });
};

log.info('Appending script to document.head', { src });
document.head.appendChild(script);
log.info('Script append initiated');



