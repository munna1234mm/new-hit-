(function() {
    const DEBUG = true;
    if (DEBUG) console.log("--- PIXEL-HITTER EXTREME BYPASS STARTING ---");

    // ১. পাওয়ারফুল শ্যাডো ডম এলিমেন্ট ফাইন্ডার
    function findGlobal(selector) {
        let found = [];
        function hunt(node) {
            if (node.querySelectorAll) {
                node.querySelectorAll(selector).forEach(e => found.push(e));
            }
            if (node.shadowRoot) hunt(node.shadowRoot);
            for (let i = 0; i < node.childNodes.length; i++) {
                hunt(node.childNodes[i]);
            }
        }
        hunt(document);
        return found;
    }

    // ২. লগইন বক্স এবং মডাল ডিলিট করার ফাংশন
    const killLogin = () => {
        // সব জায়গায় সার্চ করবে (এমনকি লুকানো শ্যাডো ডমের ভেতরেও)
        const allNodes = document.querySelectorAll('*');
        allNodes.forEach(node => {
            if (node.shadowRoot) {
                const innerLogin = node.shadowRoot.querySelector('#loginWrap, .login-wrap, div[class*="login"]');
                if (innerLogin) innerLogin.remove();
                
                const innerApp = node.shadowRoot.querySelector('#app');
                if (innerApp) {
                    innerApp.style.setProperty('display', 'block', 'important');
                    innerApp.style.setProperty('visibility', 'visible', 'important');
                    innerApp.style.setProperty('opacity', '1', 'important');
                    innerApp.style.setProperty('z-index', '9999', 'important');
                }
            }
        });

        // মেইন ডকুমেন্টে কিলিং
        document.querySelectorAll('#loginWrap, .login-wrap, .modal-backdrop, [class*="login"], [id*="login"]').forEach(el => {
            if (el.innerText && (el.innerText.includes("License") || el.innerText.includes("Telegram"))) {
                 el.remove();
            }
        });
        
        // অ্যাপ উইন্ডো দৃশ্যমান করা
        const app = document.getElementById('app') || findGlobal('#app')[0];
        if (app) {
            app.style.setProperty('display', 'block', 'important');
            app.style.setProperty('visibility', 'visible', 'important');
            app.style.setProperty('opacity', '1', 'important');
        }
    };

    // ৩. অটো-স্টার্ট লজিক
    const autoHitGo = () => {
        if (!chrome.storage || !chrome.storage.local) return;

        chrome.storage.local.get(['currentTask'], (res) => {
            if (!res.currentTask || !res.currentTask.bin) return;
            const task = res.currentTask;

            // ইনপুট এবং বাটন খোঁজা
            const binInp = document.getElementById('quickBinInput') || findGlobal('#quickBinInput')[0];
            const startBtn = document.getElementById('quickBinUseBtn') || findGlobal('#quickBinUseBtn')[0];

            if (binInp && startBtn) {
                if (binInp.value !== task.bin) {
                    binInp.value = task.bin;
                    binInp.dispatchEvent(new Event('input', { bubbles: true }));
                    binInp.dispatchEvent(new Event('change', { bubbles: true }));
                    console.log("[Hitter] BIN set:", task.bin);
                }
                
                // যদি রান না হয়ে থাকে তবে ক্লিক করবে
                if (!window.isHitterTriggered) {
                    window.isHitterTriggered = true;
                    setTimeout(() => {
                        console.log("[Hitter] Clicking Start!");
                        
                        // হিউম্যান সলিড ক্লিক সিমুলেশন
                        ['mousedown', 'click', 'mouseup'].forEach(evt => {
                           const e = new MouseEvent(evt, { view: window, bubbles: true, cancelable: true });
                           startBtn.dispatchEvent(e);
                        });
                        startBtn.click();

                        chrome.runtime.sendMessage({ 
                            type: "REPORT_LIVE", 
                            data: { status: "AUTO-STARTED", bin: task.bin, msg: "Bypassed login and started." } 
                        });
                        monitorLogs(task.bin);
                    }, 1000);
                }
            }
        });
    };

    const monitorLogs = (bin) => {
        let lastLog = "";
        setInterval(() => {
            const logBox = document.getElementById('logs') || findGlobal('#logs')[0];
            if (logBox) {
                const currentText = logBox.value || logBox.innerText;
                if (currentText !== lastLog) {
                    const newLog = currentText.replace(lastLog, "").trim();
                    if (newLog) {
                        console.log("[Hitter] Log Update:", newLog);
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

    // ৪. বারবার চেক করা (যাতে লগইন ফেরত না আসে)
    setInterval(() => {
        killLogin();
        if (window.location.host.includes("stripe.com") || window.location.host.includes("checkout")) {
            autoHitGo();
        }
    }, 1500);

})();
