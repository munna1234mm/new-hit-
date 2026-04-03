(function() {
    const DEBUG = true;
    if (DEBUG) console.log("PixelX Pro Admin Universal Proxy Active");

    const ADMIN_DATA = {
        id: "admin_master",
        username: "Pro Admin",
        plan: "pro",
        level: "admin",
        status: "active",
        token: "8786502466:AAERcUvFD-XQTHICYKthx93r6CW2vWEolcA",
        expiry: Date.now() + 3153600000000 
    };

    // --- 1. Storage Proxy ---
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        const originalGet = chrome.storage.local.get;
        const originalSet = chrome.storage.local.set;

        chrome.storage.local.get = function(keys, callback) {
            if (typeof callback !== 'function') return originalGet.apply(this, arguments);
            originalGet.call(this, keys, (items) => {
                const spoofed = { ...items, ...ADMIN_DATA, user_plan: 'pro', is_logged_in: true, license: 'active' };
                callback(spoofed);
            });
        };
    }

    // --- 2. Element Finder (Deep/Shadow DOM) ---
    function findElementDeep(selector, textMatch = null) {
        function search(root) {
            // Check direct children
            const elements = root.querySelectorAll(selector);
            for (const el of elements) {
                if (!textMatch || (el.innerText && el.innerText.toLowerCase().includes(textMatch.toLowerCase()))) {
                    return el;
                }
            }
            // Check Shadow DOMs
            const all = root.querySelectorAll('*');
            for (const el of all) {
                if (el.shadowRoot) {
                    const found = search(el.shadowRoot);
                    if (found) return found;
                }
            }
            return null;
        }
        return search(document);
    }

    // --- 3. Automation Logic ---
    const runAutomation = () => {
        if (!window.location.host.includes("stripe.com")) return;

        chrome.runtime.sendMessage({ type: "FETCH_TASK" }, (task) => {
            if (!task || task.status === "completed" || !task.bin) return;

            console.log("[Automation] Task received. Searching for controls...");

            let attempts = 0;
            const interval = setInterval(() => {
                attempts++;
                const binInput = findElementDeep('input[placeholder*="BIN"]') || findElementDeep('input[id*="Bin"]');
                const startBtn = findElementDeep('button', 'Start') || findElementDeep('div', 'Start') || findElementDeep('span', 'Start');

                if (binInput && startBtn) {
                    console.log("[Automation] Controls found. Executing...");
                    clearInterval(interval);

                    // Fill BIN
                    binInput.value = task.bin;
                    binInput.dispatchEvent(new Event('input', { bubbles: true }));
                    binInput.dispatchEvent(new Event('change', { bubbles: true }));

                    // Trigger Start
                    setTimeout(() => {
                        startBtn.click();
                        // Extra insurance for clicking
                        const clickEvent = new MouseEvent('click', { view: window, bubbles: true, cancelable: true });
                        startBtn.dispatchEvent(clickEvent);
                        
                        chrome.runtime.sendMessage({ type: "REPORT_LIVE", data: { status: "STARTED", bin: task.bin, msg: "Automation triggered." } });
                        startMonitoring(task.bin);
                    }, 500);
                }

                if (attempts > 30) {
                    console.log("[Automation] Giving up. Could not find UI.");
                    clearInterval(interval);
                }
            }, 1000);
        });
    };

    const startMonitoring = (bin) => {
        let lastLog = "";
        setInterval(() => {
            const logBox = findElementDeep('textarea#logs') || findElementDeep('div.log-container');
            if (logBox) {
                const currentLog = logBox.value || logBox.innerText;
                if (currentLog !== lastLog) {
                    const newLines = currentLog.replace(lastLog, "").trim();
                    if (newLines) {
                        chrome.runtime.sendMessage({ 
                            type: "REPORT_LIVE", 
                            data: { status: "LOG", bin: bin, msg: newLines } 
                        });
                    }
                    lastLog = currentLog;
                }
            }
        }, 2000);
    };

    // --- Start ---
    setInterval(() => {
        if (window.location.host.includes("stripe.com")) {
            // Check for task if not already running
            if (!window.isHitterRunning) {
                window.isHitterRunning = true;
                runAutomation();
            }
        }
    }, 5000);

})();
