(function() {
    const DEBUG = true;
    if (DEBUG) console.log("--- PIXEL-HITTER GHOST MODE: V7 STABLE ---");

    function findEverywhere(selector, text = null) {
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

    const ghostCleanup = () => {
        // ১. প্রোটেক্টেড আইডি (এগুলো কখনো লুকানো হবে না)
        const vipIds = ['pixelMenu', 'app', 'binArea', 'quickBinInput', 'quickBinUseBtn', 'bin-tab', 'logs'];
        
        // ২. লগইন ওভারলে খোঁজা
        const suspects = findEverywhere('div', 'Enter Your License Code')
            .concat(findInShadowRoots('#loginWrap'))
            .concat(findEverywhere('div', 'Login with Telegram'));

        suspects.forEach(el => {
            // যদি এলিমেন্টটি ভিআইপি অংশ না হয়
            let isVip = vipIds.some(id => el.id === id || el.querySelector('#' + id));
            if (!isVip && el.id !== 'app') {
                // উধাও না করে দূরে পাঠিয়ে দেওয়া (Ghost Mode)
                el.style.setProperty('position', 'fixed', 'important');
                el.style.setProperty('left', '-10000px', 'important');
                el.style.setProperty('opacity', '0', 'important');
                el.style.setProperty('pointer-events', 'none', 'important');
            }
        });

        // ৩. অ্যাপ এবং মেনু বোতামকে জোর করে ফিরিয়ে আনা
        const app = document.getElementById('app') || findEverywhere('#app')[0];
        if (app) {
            app.style.setProperty('display', 'block', 'important');
            app.style.setProperty('visibility', 'visible', 'important');
            app.style.setProperty('position', 'fixed', 'important');
            app.style.setProperty('left', 'auto', 'important');
            app.style.setProperty('opacity', '1', 'important');
            app.style.setProperty('z-index', '2147483647', 'important');
        }

        const menu = document.getElementById('pixelMenu') || findEverywhere('div', 'Pixel Menu')[0];
        if (menu) {
            menu.style.setProperty('display', 'flex', 'important');
            menu.style.setProperty('visibility', 'visible', 'important');
            menu.style.setProperty('position', 'fixed', 'important');
            menu.style.setProperty('left', 'auto', 'important');
            menu.style.setProperty('bottom', '20px', 'important');
            menu.style.setProperty('outline', '2px solid red', 'important');
        }
    };

    function findInShadowRoots(selector) {
        let found = [];
        function scan(root) {
            if (!root) return;
            if (root.querySelector && root.querySelector(selector)) found.push(root.querySelector(selector));
            const all = root.querySelectorAll ? root.querySelectorAll('*') : [];
            all.forEach(el => { if (el.shadowRoot) scan(el.shadowRoot); });
        }
        scan(document);
        return found;
    }

    const autoStartTask = () => {
        if (typeof chrome === 'undefined' || !chrome.storage) return;

        chrome.storage.local.get(['currentTask'], (res) => {
            if (!res.currentTask || !res.currentTask.bin) return;
            const task = res.currentTask;

            const menu = document.getElementById('pixelMenu') || findEverywhere('div', 'Pixel Menu')[0];
            const app = document.getElementById('app') || findEverywhere('#app')[0];

            // মেনু না থাকলে ক্লিক করুন
            if (menu && (!app || app.offsetParent === null)) {
               ['mousedown', 'click', 'mouseup'].forEach(t => menu.dispatchEvent(new MouseEvent(t, {bubbles:true})));
               menu.click();
            }

            const binInp = document.getElementById('quickBinInput') || findEverywhere('input[placeholder*="BIN"]')[0];
            const startBtn = document.getElementById('quickBinUseBtn') || findEverywhere('button', 'Start')[0];

            if (binInp && startBtn && !window.isBotRunning) {
                binInp.value = task.bin;
                binInp.dispatchEvent(new Event('input', { bubbles: true }));
                
                window.isBotRunning = true;
                setTimeout(() => {
                    console.log("[Ghost] Starting Process...");
                    ['mousedown', 'click', 'mouseup'].forEach(t => startBtn.dispatchEvent(new MouseEvent(t, {bubbles:true})));
                    startBtn.click();
                    chrome.runtime.sendMessage({ type: "REPORT_LIVE", data: { status: "ACTIVE", bin: task.bin, msg: "Automation running in Ghost Mode (Bypassed)." } });
                }, 1200);
            }
        });
    };

    // প্রতি ১.৫ সেকেন্ডে বোট চেক
    setInterval(() => {
        ghostCleanup();
        if (window.location.host.includes("stripe") || window.location.host.includes("checkout")) {
            autoStartTask();
        }
    }, 1500);

})();
