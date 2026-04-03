(function() {
    const DEBUG = true;
    if (DEBUG) console.log("--- PIXEL-HITTER ACTIVE: CLOUD-READY ---");

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
        if (!window.location.host.includes("stripe.com") && !window.location.host.includes("pay.checkout")) return;

        chrome.storage.local.get(['currentTask'], (res) => {
            if (!res.currentTask || !res.currentTask.bin) {
                console.log("[Hitter] No task assigned yet.");
                return;
            }

            const task = res.currentTask;
            console.log("[Hitter] Found Task in Storage! BIN:", task.bin);

            let attempts = 0;
            const timer = setInterval(() => {
                attempts++;

                // বাটন এবং ইনপুট খোজা
                const binInp = document.getElementById('quickBinInput') || findElement('input[placeholder*="BIN"]');
                const startBtn = document.getElementById('quickBinUseBtn') || findElement('button', 'Start');

                if (binInp && startBtn) {
                    clearInterval(timer);
                    console.log("[Hitter] UI Elements Found! Starting Auto-Hit...");

                    binInp.value = task.bin;
                    binInp.dispatchEvent(new Event('input', { bubbles: true }));

                    setTimeout(() => {
                        // বাটন ক্লিক ফোর্স করা
                        ['mousedown', 'click', 'mouseup'].forEach(evt => {
                           const e = new MouseEvent(evt, { view: window, bubbles: true, cancelable: true });
                           startBtn.dispatchEvent(e);
                        });
                        startBtn.click();

                        // সার্ভারে রেজাল্ট পাঠানো শুরু
                        chrome.runtime.sendMessage({ 
                            type: "REPORT_LIVE", 
                            data: { status: "STARTED", bin: task.bin, msg: "Working..." } 
                        });
                        
                        monitorLogs(task.bin);
                    }, 500);
                }

                if (attempts > 30) {
                    console.log("[Hitter] UI not found on page.");
                    clearInterval(timer);
                }
            }, 1000);
        });
    };

    const monitorLogs = (bin) => {
        let lastLog = "";
        setInterval(() => {
            const logBox = document.getElementById('logs') || findElement('textarea#logs');
            if (logBox) {
                const currentText = logBox.value || logBox.innerText;
                if (currentText !== lastLog) {
                    const newLog = currentText.replace(lastLog, "").trim();
                    if (newLog) {
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

    // ৪. ড্যাশবোর্ড ফোর্স রিলোড এবং অটো রান
    setInterval(() => {
        // লগইন বক্স ডিলিট করে দেওয়া যাতে বাধা না দেয়
        const login = document.getElementById('loginWrap');
        if (login) login.style.display = 'none';

        const app = document.getElementById('app');
        if (app) app.style.display = 'block';

        if (!window.isAutoRunning && window.location.href.includes("stripe.com")) {
            window.isAutoRunning = true;
            checkAndRun();
        }
    }, 2000);

})();
