(function() {
    const DEBUG = true;
    if (DEBUG) console.log("--- PIXEL-HITTER FINAL AUTO-START ---");

    // ১. গ্লোবাল সার্চ ফাংশন (যেকোনো এলিমেন্ট খুঁজে পাওয়ার জন্য)
    function findGlobal(selector, textContent = null) {
        let found = [];
        function hunt(node) {
            if (node.querySelectorAll) {
                node.querySelectorAll(selector).forEach(e => {
                    if (!textContent || (e.innerText && e.innerText.includes(textContent))) {
                        found.push(e);
                    }
                });
            }
            if (node.shadowRoot) hunt(node.shadowRoot);
            for (let i = 0; i < node.childNodes.length; i++) {
                hunt(node.childNodes[i]);
            }
        }
        hunt(document);
        return found;
    }

    const autoHitGo = () => {
        if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) return;

        chrome.storage.local.get(['currentTask'], (res) => {
            if (!res.currentTask || !res.currentTask.bin) return;
            const task = res.currentTask;

            // ১. # BIN ট্যাবে ক্লিক করা (যাতে ইনপুট বক্স দেখা যায়)
            const binTab = document.getElementById('bin-tab') || findGlobal('button', '# BIN')[0];
            if (binTab && !binTab.classList.contains('active')) {
                binTab.click();
            }

            // ২. ইনপুট এবং স্টার্ট বাটন খোঁজা
            const binInp = document.getElementById('quickBinInput') || findGlobal('#quickBinInput')[0] || findGlobal('input[placeholder*="BIN"]')[0];
            const startBtn = document.getElementById('quickBinUseBtn') || findGlobal('#quickBinUseBtn')[0];

            if (binInp && startBtn) {
                // বিন বসানো
                if (binInp.value !== task.bin) {
                    binInp.value = task.bin;
                    binInp.dispatchEvent(new Event('input', { bubbles: true }));
                    binInp.dispatchEvent(new Event('change', { bubbles: true }));
                    console.log("[Hitter] BIN set:", task.bin);
                }
                
                // অটো-স্টার্ট চালু করা (যদি বাটন দেখা যায়)
                if (!window.isHitterTriggered) {
                    window.isHitterTriggered = true;
                    setTimeout(() => {
                        console.log("[Hitter] Clicking Start!");
                        
                        // হিউম্যান ক্লিক সিমুলেশন
                        ['mousedown', 'click', 'mouseup'].forEach(evt => {
                           const e = new MouseEvent(evt, { view: window, bubbles: true, cancelable: true });
                           startBtn.dispatchEvent(e);
                        });
                        startBtn.click();

                        chrome.runtime.sendMessage({ 
                            type: "REPORT_LIVE", 
                            data: { status: "AUTO-STARTED", bin: task.bin, msg: "Automation running..." } 
                        });
                        monitorLogs(task.bin);
                    }, 500);
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
        // লগইন বক্স ব্লক করা
        const login = document.getElementById('loginWrap') || findGlobal('#loginWrap')[0];
        if (login) login.style.setProperty('display', 'none', 'important');

        const app = document.getElementById('app') || findGlobal('#app')[0];
        if (app) app.style.setProperty('display', 'block', 'important');

        if (window.location.host.includes("stripe.com") || window.location.host.includes("checkout")) {
            autoHitGo();
        }
    }, 1500);

})();
