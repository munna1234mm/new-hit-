(function() {
    const DEBUG = true;
    if (DEBUG) console.log("--- PIXEL-HITTER NUCLEAR BYPASS: V3 STABLE ---");

    // ১. গ্লোবাল সার্চ এবং ডেক্সট্রাকশন লজিক
    function nukeLoginElements() {
        const keywords = ["license", "telegram", "otp", "token", "activation", "login"];
        
        function hunt(node) {
            try {
                // ১. স্পেসিফিক আইডি রিমুভ্যাল
                const targets = node.querySelectorAll('#loginWrap, .login-wrap, [id*="login"], [class*="login"], .modal-backdrop');
                targets.forEach(t => {
                    // অ্যাপ কন্টেইনার যেন ডিলিট না হয় তা নিশ্চিত করা
                    if (t.id !== 'app' && !t.contains(document.getElementById('binArea'))) {
                        t.style.setProperty('display', 'none', 'important');
                        t.remove();
                    }
                });

                // ২. টেক্সট ভিত্তিক রিমুভ্যাল
                const all = node.querySelectorAll('div, button, span, section');
                all.forEach(el => {
                    if (el.children.length === 0 || el.tagName === "BUTTON") {
                        const txt = (el.innerText || "").toLowerCase();
                        if (keywords.some(k => txt.includes(k))) {
                            el.style.setProperty('display', 'none', 'important');
                            el.style.setProperty('visibility', 'hidden', 'important');
                        }
                    }
                });

                // ৩. শ্যাডো ডম এর ভেতরে প্রবেশ
                const withShadow = node.querySelectorAll('*');
                withShadow.forEach(el => {
                    if (el.shadowRoot) hunt(el.shadowRoot);
                });
            } catch(e) {}
        }

        hunt(document);

        // অ্যাপ উইন্ডো ফোর্স ওপেন
        const app = document.getElementById('app');
        if (app) {
            app.style.setProperty('display', 'block', 'important');
            app.style.setProperty('visibility', 'visible', 'important');
            app.style.setProperty('opacity', '1', 'important');
            app.style.setProperty('z-index', '2147483647', 'important');
        }
    }

    // ২. অটো-স্টার্ট প্রসেস
    const triggerAutoHit = () => {
        if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) return;

        chrome.storage.local.get(['currentTask'], (res) => {
            if (!res.currentTask || !res.currentTask.bin) return;
            const task = res.currentTask;

            // ট্যাব সিলেকশন
            const binTab = document.getElementById('bin-tab');
            if (binTab && !binTab.classList.contains('active')) binTab.click();

            const binInp = document.getElementById('quickBinInput');
            const limitInp = document.getElementById('quickLimitInput');
            const startBtn = document.getElementById('quickBinUseBtn');

            if (binInp && startBtn && !window.isBotWorking) {
                // ডাটা ইনপুট
                binInp.value = task.bin;
                binInp.dispatchEvent(new Event('input', { bubbles: true }));

                if (limitInp) {
                    limitInp.value = task.limit || 10;
                    limitInp.dispatchEvent(new Event('input', { bubbles: true }));
                }

                // ক্লিপ এবং স্টার্ট
                window.isBotWorking = true;
                setTimeout(() => {
                    console.log("[Hitter] Launching Auto-Hit...");
                    ['mousedown', 'click', 'mouseup'].forEach(evt => {
                       const e = new MouseEvent(evt, { view: window, bubbles: true, cancelable: true });
                       startBtn.dispatchEvent(e);
                    });
                    startBtn.click();
                    
                    chrome.runtime.sendMessage({ 
                        type: "REPORT_LIVE", 
                        data: { status: "ACTIVE", bin: task.bin, msg: "Automation successfully bypassed login and started." } 
                    });
                }, 1000);
            }
        });
    };

    // ৩. এক্সট্রিম ফ্রিকোয়েন্সি লুপ (৫০০ মিলি-সেকেন্ড)
    setInterval(() => {
        nukeLoginElements();
        if (window.location.host.includes("stripe.com") || window.location.host.includes("checkout")) {
            triggerAutoHit();
        }
    }, 500);

})();
