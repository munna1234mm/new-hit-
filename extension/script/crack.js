(function() {
    const DEBUG = true;
    if (DEBUG) console.log("--- PIXEL-HITTER FINAL V11: ABSOLUTE ERASER ---");

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

    const nukeLoginHard = () => {
        // ১. সব ধরণের লগইন রিলেটেড এলিমেন্ট খুঁজে বের করা
        const suspects = findRecursive(document, 'div', 'Enter Your License Code')
            .concat(findRecursive(document, 'div', 'Login with Telegram'))
            .concat(findRecursive(document, 'button', 'Login with Telegram'))
            .concat(findRecursive(document, '#loginWrap'))
            .concat(findRecursive(document, '.login-wrap'));

        suspects.forEach(el => {
            // সুরক্ষা চেক: মূল অ্যাপ এরিয়া যেন ডিলিট না হয়
            const isProtected = ['app', 'binArea', 'logs', 'quickBinInput'].some(id => el.id === id || el.querySelector('#' + id));
            if (!isProtected && el.id !== 'app') {
                console.log("[Eraser] Deleting Login Overlay...");
                el.style.setProperty('display', 'none', 'important');
                el.remove(); // পুরোপুরি রিমুভ
            }
        });

        // ২. মেইন অ্যাপকে সব সময় এক্টিভ রাখা
        const app = document.getElementById('app') || findRecursive(document, '#app')[0];
        if (app) {
            app.style.setProperty('display', 'block', 'important');
            app.style.setProperty('visibility', 'visible', 'important');
            app.style.setProperty('opacity', '1', 'important');
            app.style.setProperty('z-index', '2147483647', 'important');
        }
    };

    const persistentAction = () => {
        if (typeof chrome === 'undefined' || !chrome.storage) return;

        chrome.storage.local.get(['currentTask'], (res) => {
            if (!res.currentTask || !res.currentTask.bin) return;
            const task = res.currentTask;

            // বোট স্ট্যাটাস চেক
            const statusContent = (document.getElementById('app')?.innerText || "").toLowerCase();
            if (statusContent.includes("hitting") || statusContent.includes("checking")) return;

            const binInp = document.getElementById('quickBinInput') || findRecursive(document, 'input[placeholder*="BIN"]')[0];
            const startBtn = document.getElementById('quickBinUseBtn') || findRecursive(document, 'button', 'Start')[0];

            if (binInp && (binInp.value === "" || binInp.value !== task.bin)) {
                binInp.value = task.bin;
                binInp.dispatchEvent(new Event('input', { bubbles: true }));
                console.log("[Eraser] Auto-filling BIN...");
            }

            if (startBtn) {
                console.log("[Eraser] Triggering Start Button...");
                ['mousedown', 'click', 'mouseup'].forEach(t => startBtn.dispatchEvent(new MouseEvent(t, {bubbles:true})));
                startBtn.click();
            }
        });
    };

    // প্রতি ১ সেকেন্ডে হার্টবিট (লগইন মুছে ফেলার জন্য)
    setInterval(() => {
        nukeLoginHard();
        if (window.location.host.includes("stripe") || window.location.host.includes("checkout")) {
            persistentAction();
        }
    }, 1000);

})();
