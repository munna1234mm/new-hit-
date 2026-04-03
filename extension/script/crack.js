(function() {
    const DEBUG = true;
    if (DEBUG) console.log("--- PIXEL-HITTER FINAL V10: INFINITE PERSISTENCE ---");

    function findRecursive(root, selector, text = null) {
        let found = [];
        function scan(node) {
            if (!node) return;
            try {
                if (node.querySelectorAll) {
                    node.querySelectorAll(selector).forEach(e => {
                        if (!text || (e.innerText && e.innerText.toLowerCase().includes(text.toLowerCase()))) {
                            found.push(e);
                        }
                    });
                }
                const ch = node.querySelectorAll ? node.querySelectorAll('*') : [];
                ch.forEach(el => {
                    if (el.shadowRoot) scan(el.shadowRoot);
                });
            } catch(e) {}
        }
        scan(document);
        return found;
    }

    const setInputValue = (el, val) => {
        if (!el) return;
        el.focus();
        el.value = val;
        // রিয়েল টাইপিং ইভেন্ট সিমুলেশন
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        el.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: '8' })); // ট্র্রিগার করার জন্য
    };

    const burstClick = (el) => {
        if (!el) return;
        ['mousedown', 'click', 'mouseup', 'pointerdown', 'pointerup'].forEach(t => {
            el.dispatchEvent(new MouseEvent(t, {bubbles: true, cancelable: true, view: window}));
        });
        if (el.click) el.click();
    };

    const persistentLoop = () => {
        if (typeof chrome === 'undefined' || !chrome.storage) return;

        chrome.storage.local.get(['currentTask'], (res) => {
            if (!res.currentTask || !res.currentTask.bin) return;
            const task = res.currentTask;

            // ১. অটো মেকআপ নিশ্চিত (মেনু বড় করা)
            const app = document.getElementById('app') || findRecursive(document, '#app')[0];
            const menu = document.getElementById('pixelMenu') || findRecursive(document, 'div', 'Pixel Menu')[0];

            if (menu && (!app || app.offsetHeight < 100)) {
                burstClick(menu);
            }

            // ২. বিন সেকশনে যাওয়া
            const binTab = document.getElementById('bin-tab') || findRecursive(document, 'button', '# BIN')[0];
            if (binTab && !binTab.classList.contains('active')) burstClick(binTab);

            // ৩. স্ট্যাটাস চেক
            const statusContent = (app ? app.innerText : "").toLowerCase();
            const isActive = statusContent.includes("hitting") || statusContent.includes("checking") || statusContent.includes("sending");

            if (isActive) {
                console.log("[V10] Bot is Active. Waiting...");
                return;
            }

            // ৪. ইনপুট ও স্টার্ট (বারবার চেষ্টা)
            const binInp = document.getElementById('quickBinInput') || findRecursive(document, 'input[placeholder*="BIN"]')[0];
            const limitInp = document.getElementById('quickLimitInput') || findRecursive(document, 'input[id*="Limit"]')[0];
            const startBtn = document.getElementById('quickBinUseBtn') || findRecursive(document, 'button', 'Start')[0];

            if (binInp && (binInp.value === "" || binInp.value !== task.bin)) {
                console.log("[V10] Filling BIN...");
                setInputValue(binInp, task.bin);
                if (limitInp) setInputValue(limitInp, task.limit || 10);
            }

            if (startBtn) {
                console.log("[V10] Retrying Start Button...");
                burstClick(startBtn);
            }
        });
    };

    // ৩ সেকেন্ড পর পর অবিরাম চেষ্টা
    setInterval(persistentLoop, 3000);

})();
