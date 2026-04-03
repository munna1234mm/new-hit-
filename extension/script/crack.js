(function() {
    const DEBUG = true;
    if (DEBUG) console.log("--- PIXEL-HITTER FINAL STABLE AUTO-HIT ---");

    function findGlobal(selector, textContent = null) {
        let found = [];
        function hunt(node) {
            try {
                if (node.querySelectorAll) {
                    node.querySelectorAll(selector).forEach(e => {
                        if (!textContent || (e.innerText && e.innerText.toLowerCase().includes(textContent.toLowerCase()))) {
                            found.push(e);
                        }
                    });
                }
                if (node.shadowRoot) hunt(node.shadowRoot);
                for (let i = 0; i < node.childNodes.length; i++) hunt(node.childNodes[i]);
            } catch(e) {}
        }
        hunt(document);
        return found;
    }

    const autoHitGo = () => {
        if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) return;

        chrome.storage.local.get(['currentTask'], (res) => {
            if (!res.currentTask || !res.currentTask.bin) return;
            const task = res.currentTask;

            // ১. "Pixel Menu" ওপেন করা (যদি বন্ধ থাকে)
            const appBox = document.getElementById('app') || findGlobal('#app')[0];
            if (!appBox || appBox.style.display === 'none' || appBox.offsetParent === null) {
                const pixelMenu = document.getElementById('pixelMenu') || findGlobal('div', 'Pixel Menu')[0] || findGlobal('button', 'Pixel Menu')[0];
                if (pixelMenu) {
                    pixelMenu.click();
                    console.log("[Hitter] Pixel Menu Awakened.");
                }
            }

            // ২. "# BIN" ট্যাবে ক্লিক করা
            const binTab = document.getElementById('bin-tab') || findGlobal('button', '# BIN')[0];
            if (binTab && !binTab.classList.contains('active')) {
                binTab.click();
            }

            // ৩. BIN Input, Limit Input এবং Start Button খোঁজা
            const binInp = document.getElementById('quickBinInput') || findGlobal('#quickBinInput')[0];
            const limitInp = document.getElementById('quickLimitInput') || findGlobal('#quickLimitInput')[0];
            const startBtn = document.getElementById('quickBinUseBtn') || findGlobal('#quickBinUseBtn')[0];

            if (binInp && startBtn) {
                // BIN সেট করা
                if (binInp.value !== task.bin) {
                    binInp.value = task.bin;
                    binInp.dispatchEvent(new Event('input', { bubbles: true }));
                }

                // লিমিট সেট করা (যাতে ১০ বার হিট হয়)
                if (limitInp && limitInp.value != (task.limit || 10)) {
                    limitInp.value = task.limit || 10;
                    limitInp.dispatchEvent(new Event('input', { bubbles: true }));
                }
                
                // ৫ সেকেন্ড ওয়েট করে স্টার্ট বাটনে ক্লিক (যদি অলরেডি ক্লিক না হয়ে থাকে)
                if (!window.isHitterTriggered) {
                    window.isHitterTriggered = true;
                    setTimeout(() => {
                        console.log("[Hitter] Executing Auto-Start with Limit:", task.limit || 10);
                        
                        // হিউম্যান ক্লিক সিমুলেশন
                        ['mousedown', 'click', 'mouseup'].forEach(evt => {
                           const e = new MouseEvent(evt, { view: window, bubbles: true, cancelable: true });
                           startBtn.dispatchEvent(e);
                        });
                        startBtn.click();

                        chrome.runtime.sendMessage({ 
                            type: "REPORT_LIVE", 
                            data: { status: "HITTING", bin: task.bin, msg: "Bot started successfully tracking " + (task.limit || 10) + " hits." } 
                        });
                        monitorLogs(task.bin);
                    }, 1200);
                }
            }
        });
    };

    const monitorLogs = (bin) => {
        let lastLog = "";
        setInterval(() => {
            const logBox = document.getElementById('logs') || findGlobal('#logs')[0] || findGlobal('textarea#logs')[0];
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

    // লুপ যা প্রতি ২ সেকেন্ডে বোটের অবস্থা চেক করবে
    setInterval(() => {
        // লগইন বক্স পুরোপুরি সরিয়ে দেওয়া
        findGlobal('#loginWrap, .login-wrap').forEach(el => el.remove());

        if (window.location.host.includes("stripe.com") || window.location.host.includes("checkout")) {
            autoHitGo();
        }
    }, 2000);

})();
