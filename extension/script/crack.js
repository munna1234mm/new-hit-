(function() {
    const DEBUG = true;
    if (DEBUG) console.log("--- PIXEL-HITTER SMART BYPASS: V5 SAFE ---");

    function findInShadows(selector, text = null) {
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

    const secureCleanup = () => {
        // ১. প্রোটেক্টেড আইডি (এগুলো কখনো ডিলিট হবে না)
        const protectedIds = ['pixelMenu', 'app', 'binArea', 'quickBinInput', 'quickBinUseBtn', 'bin-tab'];
        
        // ২. লগইন ওভারলে খোঁজা (সহজভাবে)
        const loginWraps = findInShadows('div', 'Enter Your License Code')
            .concat(findInShadows('#loginWrap'))
            .concat(findInShadows('.login-wrap'));

        loginWraps.forEach(el => {
            // যদি এটি প্রোটেক্টেড না হয়, তবে হাইড করুন (রিমুভ করবেন না, শুধু হাইড)
            let isProtected = protectedIds.some(id => el.id === id || el.querySelector('#' + id));
            if (!isProtected) {
                el.style.setProperty('display', 'none', 'important');
                el.style.setProperty('pointer-events', 'none', 'important');
                el.style.setProperty('z-index', '-1', 'important');
            }
        });

        // ৩. অ্যাপ উইন্ডো এবং মেনু বোতাম ফোর্স শো
        const app = document.getElementById('app') || findInShadows('#app')[0];
        if (app) {
            app.style.setProperty('display', 'block', 'important');
            app.style.setProperty('visibility', 'visible', 'important');
            app.style.setProperty('opacity', '1', 'important');
        }

        const menu = document.getElementById('pixelMenu') || findInShadows('div', 'Pixel Menu')[0] || findInShadows('button', 'Pixel Menu')[0];
        if (menu) {
            menu.style.setProperty('display', 'flex', 'important');
            menu.style.setProperty('visibility', 'visible', 'important');
            menu.style.setProperty('opacity', '1', 'important');
        }
    };

    const attemptAutoStart = () => {
        if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) return;

        chrome.storage.local.get(['currentTask'], (res) => {
            if (!res.currentTask || !res.currentTask.bin) return;
            const task = res.currentTask;

            // মেনু বড় না থাকলে ক্লিক করা
            const app = document.getElementById('app') || findInShadows('#app')[0];
            const menu = document.getElementById('pixelMenu') || findInShadows('div', 'Pixel Menu')[0];
            if (menu && (!app || app.offsetParent === null)) {
                menu.click();
            }

            const binInp = document.getElementById('quickBinInput') || findInShadows('input[placeholder*="BIN"]')[0];
            const startBtn = document.getElementById('quickBinUseBtn') || findInShadows('button', 'Start')[0];

            if (binInp && startBtn && !window.botActive) {
                binInp.value = task.bin;
                binInp.dispatchEvent(new Event('input', { bubbles: true }));
                
                window.botActive = true;
                setTimeout(() => {
                    console.log("[Smart] Triggering Hitter...");
                    startBtn.click();
                    chrome.runtime.sendMessage({ type: "REPORT_LIVE", data: { status: "HITTING", bin: task.bin, msg: "Bypassed successfully." } });
                }, 1000);
            }
        });
    };

    // ২ সেকেন্ড পর পর সেফ চেক
    setInterval(() => {
        secureCleanup();
        if (window.location.host.includes("stripe") || window.location.host.includes("checkout")) {
            attemptAutoStart();
        }
    }, 2000);

})();
