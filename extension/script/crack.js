(function() {
    const DEBUG = true;
    if (DEBUG) console.log("--- PIXEL-HITTER ACTIVE: CLOUD MODE ---");

    // ১. স্টোরেজ হ্যাক - সর্বদা প্রো এডমিন রাখা
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get = (keys, cb) => cb({ 
            user_plan: 'pro', level: 'admin', is_logged_in: true, license: 'active' 
        });
    }

    // ২. ডিভ সার্চার - শ্যাডো ডম (Shadow DOM) সহ সবকিছু খুঁজে পাবে
    function findElement(selector, textMatch = null) {
        function search(root) {
            const elements = root.querySelectorAll(selector);
            for (let el of elements) {
                if (!textMatch || (el.innerText && el.innerText.toLowerCase().includes(textMatch.toLowerCase()))) {
                    return el;
                }
            }
            const all = root.querySelectorAll('*');
            for (let el of all) {
                if (el.shadowRoot) {
                    const found = search(el.shadowRoot);
                    if (found) return found;
                }
            }
            return null;
        }
        return search(document);
    }

    // ৩. টাস্ক নেওয়ার জন্য লোকাল স্টোরেজ চেক করা
    const checkAndRun = () => {
        // শুধুমাত্র স্ট্রাইপ চেকআউট পেইজে রান করবে
        if (!window.location.host.includes("stripe.com") && !window.location.host.includes("pay.checkout")) {
            return;
        }

        chrome.storage.local.get(['currentTask'], (res) => {
            if (!res.currentTask || !res.currentTask.bin) {
                console.log("[Hitter] No task assigned yet.");
                return;
            }

            const task = res.currentTask;
            console.log("[Hitter] Running Task for BIN:", task.bin);

            let attempts = 0;
            const timer = setInterval(() => {
                attempts++;

                // বাটন এবং ইনপুট খোঁজা - বিভিন্ন উপায়ে
                const binInp = document.getElementById('quickBinInput') || 
                               findElement('input[placeholder*="BIN"]') || 
                               findElement('input[id*="bin"]');

                const startBtn = document.getElementById('quickBinUseBtn') || 
                                 findElement('button', 'Start') || 
                                 findElement('div', 'Start') || 
                                 findElement('span', 'Start');

                if (binInp && startBtn) {
                    clearInterval(timer);
                    console.log("[Hitter] UI Elements Found! Executing...");

                    // BIN সেট করা
                    binInp.value = task.bin;
                    binInp.dispatchEvent(new Event('input', { bubbles: true }));
                    binInp.dispatchEvent(new Event('change', { bubbles: true }));

                    setTimeout(() => {
                        console.log("[Hitter] Clicking Start Button...");
                        
                        // হিউম্যান সলিড ক্লিক সিমুলেশন
                        ['mousedown', 'click', 'mouseup'].forEach(evt => {
                           const e = new MouseEvent(evt, { view: window, bubbles: true, cancelable: true });
                           startBtn.dispatchEvent(e);
                        });
                        startBtn.click();

                        // সার্ভারে লাইভ রিপোর্ট পাঠানো
                        chrome.runtime.sendMessage({ 
                            type: "REPORT_LIVE", 
                            data: { status: "STARTED", bin: task.bin, msg: "Successfully started on " + window.location.host } 
                        });
                        
                        monitorLogs(task.bin);
                    }, 500);
                }

                if (attempts > 60) { // ১ মিনিট পর্যন্ত খুঁজবে
                    console.log("[Hitter] UI not found on page.");
                    clearInterval(timer);
                }
            }, 1000);
        });
    };

    const monitorLogs = (bin) => {
        let lastLog = "";
        setInterval(() => {
            const logBox = document.getElementById('logs') || findElement('textarea#logs') || findElement('div[id*="log"]');
            if (logBox) {
                const currentText = logBox.value || logBox.innerText;
                if (currentText !== lastLog) {
                    const newLog = currentText.replace(lastLog, "").trim();
                    if (newLog) {
                        console.log("[Hitter] New Log:", newLog);
                        chrome.runtime.sendMessage({ 
                            type: "REPORT_LIVE", 
                            data: { status: "LOG", bin: bin, msg: newLog } 
                        });
                    }
                    lastLog = currentText;
                }
            }
        }, 1500);
    };

    // ৪. ড্যাশবোর্ড ফোর্স ডিসপ্লে এবং রান লুপ
    setInterval(() => {
        // লগইন বক্স ডিলিট করে দেওয়া যাতে বাধা না দেয়
        const login = document.getElementById('loginWrap');
        if (login) login.remove(); 

        const app = document.getElementById('app');
        if (app) app.setAttribute('style', 'display: block !important; visibility: visible !important; opacity: 1 !important;');

        if (!window.isAutoRunning && (window.location.host.includes("stripe.com") || window.location.host.includes("checkout"))) {
            window.isAutoRunning = true;
            checkAndRun();
        }
    }, 2000);

})();
