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

	const SECRET_KEY = SECRET_KEY;
    

	log.info('V11 handlers installed');
};
// Intercept and modify FETCH requests
const originalFetch = window.fetch;
window.fetch = function(...args) {
    const [url, options = {}] = args;

    // Check if this is a request we want to modify
    if (options.body && (options.body.includes('bhCandidateNewName') || options.body.includes('bhCandidateNewPW'))) {
        
        

        try {
            // Parse the body (could be FormData, JSON, or URL-encoded)
            let modifiedBody = options.body;

            // Handle JSON
            if (typeof options.body === 'string' && options.body.startsWith('{')) {
                const jsonData = JSON.parse(options.body);
                if (jsonData.bhCandidateNewName) {
                    jsonData.bhCandidateNewName = CryptoJS.AES.encrypt(jsonData.bhCandidateNewName, SECRET_KEY).toString();
                }
                if (jsonData.bhCandidateNewPW) {
                    jsonData.bhCandidateNewPW = CryptoJS.AES.encrypt(jsonData.bhCandidateNewPW, SECRET_KEY).toString();
                }
                modifiedBody = JSON.stringify(jsonData);
            }

            // Handle URL-encoded data
            else if (typeof options.body === 'string' && options.body.includes('=')) {
                const params = new URLSearchParams(options.body);
                if (params.has('bhCandidateNewName') && params.get('bhCandidateNewName')) {
                    const encrypted = CryptoJS.AES.encrypt(params.get('bhCandidateNewName'), SECRET_KEY).toString();
                    params.set('bhCandidateNewName', encrypted);
                }
                if (params.has('bhCandidateNewPW') && params.get('bhCandidateNewPW')) {
                    const encrypted = CryptoJS.AES.encrypt(params.get('bhCandidateNewPW'), SECRET_KEY).toString();
                    params.set('bhCandidateNewPW', encrypted);
                }
                modifiedBody = params.toString();
            }

            
            options.body = modifiedBody;
            args[1] = options; // Update the options

        } catch (error) {
            console.error('Error modifying fetch body:', error);
        }
    }

    return originalFetch.apply(this, args);
};

// Intercept and modify XHR requests
const originalXHROpen = XMLHttpRequest.prototype.open;
const originalXHRSend = XMLHttpRequest.prototype.send;

XMLHttpRequest.prototype.open = function(...args) {
    this._url = args[1]; // Store the URL
    this._method = args[0]; // Store the method
    return originalXHROpen.apply(this, args);
};

XMLHttpRequest.prototype.send = function(body) {
    // Check if this request contains sensitive data
    if (body && (body.includes('bhCandidateNewName') || body.includes('bhCandidateNewPW'))) {
        
        

        try {
            let modifiedBody = body;

            // Handle URL-encoded data
            if (typeof body === 'string' && body.includes('=')) {
                const params = new URLSearchParams(body);
                if (params.has('bhCandidateNewName') && params.get('bhCandidateNewName')) {
                    const encrypted = CryptoJS.AES.encrypt(params.get('bhCandidateNewName'), SECRET_KEY).toString();
                    params.set('bhCandidateNewName', encrypted);
                }
                if (params.has('bhCandidateNewPW') && params.get('bhCandidateNewPW')) {
                    const encrypted = CryptoJS.AES.encrypt(params.get('bhCandidateNewPW'), SECRET_KEY).toString();
                    params.set('bhCandidateNewPW', encrypted);
                }
                modifiedBody = params.toString();
            }

            // Handle JSON
            else if (typeof body === 'string' && body.startsWith('{')) {
                const jsonData = JSON.parse(body);
                if (jsonData.bhCandidateNewName) {
                    jsonData.bhCandidateNewName = CryptoJS.AES.encrypt(jsonData.bhCandidateNewName, SECRET_KEY).toString();
                }
                if (jsonData.bhCandidateNewPW) {
                    jsonData.bhCandidateNewPW = CryptoJS.AES.encrypt(jsonData.bhCandidateNewPW, SECRET_KEY).toString();
                }
                modifiedBody = JSON.stringify(jsonData);
            }

            
            body = modifiedBody;
        } catch (error) {
            console.error('Error modifying XHR body:', error);
        }
    }

    return originalXHRSend.call(this, body);
};

script.onerror = function() {
	log.error('Failed to load CryptoJS', { src });
};

document.head.appendChild(script);
log.info('Script append initiated', { src });


