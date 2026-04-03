(function() {
    const DEBUG = true;
    if (DEBUG) console.log("--- PIXEL-HITTER SENTINEL: V4 FINAL ---");

    // ১. গ্লোবাল শ্যাডো ডম এলিমেন্ট ফাইন্ডার (সুপার পাওয়ারফুল)
    function findAnywhere(selector, text = null) {
        let found = [];
        function search(root) {
            if (!root) return;
            try {
                if (root.querySelectorAll) {
                    root.querySelectorAll(selector).forEach(e => {
                        if (!text || (e.innerText && e.innerText.toLowerCase().includes(text.toLowerCase()))) {
                            found.push(e);
                        }
                    });
                }
            } catch(e) {}
            
            const children = root.querySelectorAll ? root.querySelectorAll('*') : [];
            children.forEach(el => {
                if (el.shadowRoot) search(el.shadowRoot);
            });
            
            if (root.childNodes) {
                root.childNodes.forEach(child => search(child));
            }
        }
        search(document);
        return found;
    }

    // ২. মেনু জাগানো এবং ড্যাশবোর্ড ক্লিয়ার করা
    const sentinelLoop = () => {
        // 'Pixel Menu' বাটন খুঁজে ক্লিক করা
        const menuBtn = document.getElementById('pixelMenu') || findAnywhere('div', 'Pixel Menu')[0] || findAnywhere('button', 'Pixel Menu')[0];
        const appWindow = document.getElementById('app') || findAnywhere('#app')[0];

        if (menuBtn && (!appWindow || appWindow.style.display === 'none' || appWindow.offsetParent === null)) {
            console.log("[Sentinel] Menu is collapsed. Awakening...");
            menuBtn.click();
        }

        // লগইন বক্স এবং মডাল ডিলিট করা
        const loginTargets = findAnywhere('#loginWrap')
            .concat(findAnywhere('.login-wrap'))
            .concat(findAnywhere('div', 'Enter Your License Code'))
            .concat(findAnywhere('button', 'Login with Telegram'));

        loginTargets.forEach(el => {
            if (el.id !== 'app' && !el.contains(document.getElementById('binArea'))) {
                el.style.setProperty('display', 'none', 'important');
                el.remove();
            }
        });

        // অ্যাপ এরিয়া দৃশ্যমান রাখা
        if (appWindow) {
            appWindow.style.setProperty('display', 'block', 'important');
            appWindow.style.setProperty('visibility', 'visible', 'important');
            appWindow.style.setProperty('opacity', '1', 'important');
        }
    };

    // ৩. অটো-রান টাস্ক
    const processTask = () => {
        if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) return;

        chrome.storage.local.get(['currentTask'], (res) => {
            if (!res.currentTask || !res.currentTask.bin) return;
            const task = res.currentTask;

            // ট্যাব ঠিক করা
            const binTab = document.getElementById('bin-tab') || findAnywhere('button', '# BIN')[0];
            if (binTab && !binTab.classList.contains('active')) binTab.click();

            // ইনপুট এবং বাটন ডিটেকশন
            const binInp = document.getElementById('quickBinInput') || findAnywhere('input[placeholder*="BIN"]')[0];
            const limitInp = document.getElementById('quickLimitInput') || findAnywhere('input[id*="Limit"]')[0];
            const startBtn = document.getElementById('quickBinUseBtn') || findAnywhere('button', 'Start')[0];

            if (binInp && startBtn && !window.botIsWorking) {
                // বিন এবং লিমিট বসানো
                binInp.value = task.bin;
                binInp.dispatchEvent(new Event('input', { bubbles: true }));
                
                if (limitInp) {
                    limitInp.value = task.limit || 10;
                    limitInp.dispatchEvent(new Event('input', { bubbles: true }));
                }

                // স্টার্ট ক্লিক
                window.botIsWorking = true;
                setTimeout(() => {
                    console.log("[Sentinel] Auto-Starting Hitter!");
                    ['mousedown', 'click', 'mouseup'].forEach(evt => {
                       const e = new MouseEvent(evt, { view: window, bubbles: true, cancelable: true });
                       startBtn.dispatchEvent(e);
                    });
                    startBtn.click();

                    chrome.runtime.sendMessage({ 
                        type: "REPORT_LIVE", 
                        data: { status: "SUCCESS", bin: task.bin, msg: "Bypassed and started hitting with limit: " + (task.limit || 10) } 
                    });
                    
                    monitorLogs(task.bin);
                }, 1000);
            }
        });
    };

    const monitorLogs = (bin) => {
        let lastLog = "";
        setInterval(() => {
            const logBox = document.getElementById('logs') || findAnywhere('#logs')[0] || findAnywhere('textarea#logs')[0];
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
        }, 2000);
    };

    // লুপ যা সব কিছু সচল রাখবে
    setInterval(() => {
        sentinelLoop();
        if (window.location.href.includes("stripe.com") || window.location.href.includes("checkout")) {
            processTask();
        }
    }, 1500);

})();
