// Minimal V10: ensure all visible inputs are encrypted and submitted as encrypted
function createLogger(scope) {
	const formatTime = () => new Date().toISOString();
	return {
		debug: function() { console.debug(`[${formatTime()}][DEBUG][${scope}]`, ...arguments); },
		info: function() { console.info(`[${formatTime()}][INFO][${scope}]`, ...arguments); },
		warn: function() { console.warn(`[${formatTime()}][WARN][${scope}]`, ...arguments); },
		error: function() { console.error(`[${formatTime()}][ERROR][${scope}]`, ...arguments); }
	};
}

const log = createLogger('utils-v10');
log.info('Initializing encryption loader (v10 minimal)');

const src = 'https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js';
const script = document.createElement('script');
script.type = 'text/javascript';
script.src = src;

script.onload = function() {
	log.info('CryptoJS loaded successfully');

	const SECRET_KEY = 'fofo';

	function isElementVisible(el) {
		// Consider element visible if attached to DOM and has layout
		return !!(el && (el.offsetParent !== null || el.getClientRects().length > 0));
	}

	function encryptValue(value) {
		if (!value || value.trim() === '') return '';
		return CryptoJS.AES.encrypt(value, SECRET_KEY).toString();
	}

	function encryptVisibleInputs() {
		const selector = 'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]) , textarea';
		const fields = document.querySelectorAll(selector);
		fields.forEach(function(field) {
			if (!isElementVisible(field)) return;
			if (!field.value) return;
			if (field.dataset && field.dataset.encrypted === 'true') return;
			const cipher = encryptValue(field.value);
			if (!cipher) return;
			field.dataset.original = field.value;
			field.value = cipher; // ensure the encrypted value is what gets submitted
			if (field.dataset) field.dataset.encrypted = 'true';
		});
	}

	// Encrypt on blur/change to keep UI consistent
	document.addEventListener('blur', function(e) {
		if (!e.target || !(e.target.matches && (e.target.matches('input, textarea')))) return;
		if (e.target.type === 'hidden' || e.target.type === 'submit' || e.target.type === 'button' || e.target.type === 'reset') return;
		if (!isElementVisible(e.target)) return;
		if (!e.target.value || (e.target.dataset && e.target.dataset.encrypted === 'true')) return;
		const cipher = encryptValue(e.target.value);
		if (!cipher) return;
		e.target.dataset.original = e.target.value;
		e.target.value = cipher;
		if (e.target.dataset) e.target.dataset.encrypted = 'true';
	}, true);

	// Final enforcement on submit/click
	document.addEventListener('submit', function() {
		try { encryptVisibleInputs(); } catch (err) { log.error('encrypt on submit failed', { message: err && err.message }); }
	}, true);

	document.addEventListener('click', function(e) {
		const t = e.target;
		if (!t) return;
		const isSubmit = t.matches && (t.matches('button[type="submit"]') || t.matches('input[type="submit"]') || t.closest && t.closest('[data-testid="submitButton"]'));
		if (isSubmit) {
			try { encryptVisibleInputs(); } catch (err) { log.error('encrypt on click failed', { message: err && err.message }); }
		}
	}, true);

	// Expose for manual testing
	try { window.encryptVisibleInputs = encryptVisibleInputs; } catch (_e) {}

	log.info('V10 handlers installed');
};

script.onerror = function() {
	log.error('Failed to load CryptoJS', { src });
};

document.head.appendChild(script);
log.info('Script append initiated', { src });


