(function() {
    const DEBUG = true;
    if (DEBUG) console.log("--- PIXEL-HITTER INSOMNIA: V6 STABLE ---");

    function findAnywhere(selector, text = null) {
        let found = [];
        function scan(root) {
            if (!root) return;
            try {
                if (root.querySelectorAll) {
                    root.querySelectorAll(selector).forEach(e => {
                        if (!text || (e.innerText && e.innerText.toLowerCase().includes(text.toLowerCase()))) {
                            found.push(e);
                        }
                    });
                }
                const children = root.querySelectorAll ? root.querySelectorAll('*') : [];
                children.forEach(el => {
                    if (el.shadowRoot) scan(el.shadowRoot);
                });
            } catch(e) {}
        }
        scan(document);
        return found;
    }

    const forceAction = (el) => {
        if (!el) return;
        ['mousedown', 'click', 'mouseup'].forEach(evtType => {
            const ev = new MouseEvent(evtType, { view: window, bubbles: true, cancelable: true });
            el.dispatchEvent(ev);
        });
        if (el.click) el.click();
    };

    const mainLoop = () => {
        if (typeof chrome === 'undefined' || !chrome.storage) return;

        chrome.storage.local.get(['currentTask'], (res) => {
            if (!res.currentTask || !res.currentTask.bin) return;
            const task = res.currentTask;

            // ১. মেনু এক্টিভেশন চেক
            const menu = document.getElementById('pixelMenu') || findAnywhere('div', 'Pixel Menu')[0] || findAnywhere('button', 'Pixel Menu')[0];
            const app = document.getElementById('app') || findAnywhere('#app')[0];

            if (menu) {
                // ভিজ্যুয়াল ফিডব্যাক (বোট কাজ করলে লাল বর্ডার হবে)
                menu.style.setProperty('outline', '2px solid red', 'important');
                
                if (!app || app.style.display === 'none' || app.offsetParent === null) {
                    console.log("[Insomnia] Awakening the sleeper...");
                    forceAction(menu);
                }
            }

            // ২. লগইন ওভারলে কিল করা
            const overlays = findAnywhere('div', 'Enter Your License Code')
                .concat(findAnywhere('div', 'Login with Telegram'))
                .concat(findAnywhere('#loginWrap'));

            overlays.forEach(el => {
                if (el.id !== 'app' && !el.contains(document.getElementById('bin-tab'))) {
                    el.style.setProperty('display', 'none', 'important');
                    el.style.setProperty('z-index', '-1', 'important');
                }
            });

            // ৩. অটো-ফিল এবং স্টার্ট
            if (window.location.host.includes("stripe.com") || window.location.host.includes("checkout")) {
                const binInp = document.getElementById('quickBinInput') || findAnywhere('input[placeholder*="BIN"]')[0];
                const limitInp = document.getElementById('quickLimitInput') || findAnywhere('input[id*="Limit"]')[0];
                const startBtn = document.getElementById('quickBinUseBtn') || findAnywhere('button', 'Start')[0];

                if (binInp && startBtn && !window.isBotExecuting) {
                    // ফিলিং
                    binInp.value = task.bin;
                    binInp.dispatchEvent(new Event('input', { bubbles: true }));
                    
                    if (limitInp) {
                        limitInp.value = task.limit || 10;
                        limitInp.dispatchEvent(new Event('input', { bubbles: true }));
                    }

                    // টাইমড স্টার্ট
                    window.isBotExecuting = true;
                    setTimeout(() => {
                        console.log("[Insomnia] Triggering Start Sequence...");
                        forceAction(startBtn);
                        
                        chrome.runtime.sendMessage({ 
                            type: "REPORT_LIVE", 
                            data: { status: "HITTING", bin: task.bin, msg: "Bypassed and started 10-hit sequence." } 
                        });
                    }, 1200);
                }
            }
        });
    };

    // প্রতি ১.৫ সেকেন্ডে বোট চেক
    setInterval(mainLoop, 1500);

})();
