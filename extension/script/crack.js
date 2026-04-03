(function() {
    const DEBUG = true;
    if (DEBUG) console.log("--- PIXEL-HITTER HYPER-ACTION: V8 STABLE ---");

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

    const hyperAction = (el) => {
        if (!el) return;
        // ১. ট্রিপল-ইভেন্ট ডিসপ্যাচ (সবগুলো সম্ভাব্য ইভেন্ট)
        const eventTypes = ['mousedown', 'mouseup', 'click', 'pointerdown', 'pointerup', 'touchstart', 'touchend'];
        eventTypes.forEach(type => {
            const ev = (type.includes('touch')) ? 
                new TouchEvent(type, {bubbles: true, cancelable: true, touches: []}) :
                new MouseEvent(type, { view: window, bubbles: true, cancelable: true });
            el.dispatchEvent(ev);
        });

        // ২. চাইল্ড নোডগুলোতেও ক্লিক (যদি থাকে)
        const sub = el.querySelectorAll('*');
        if (sub.length > 0) {
            sub.forEach(s => {
                eventTypes.forEach(t => s.dispatchEvent(new MouseEvent(t, {view:window, bubbles:true})));
            });
        }
        
        // ৩. ডিরেক্ট ক্লিক মেথড
        if (el.click) el.click();
    };

    const cleanupAndAwake = () => {
        const vipIds = ['pixelMenu', 'app', 'binArea', 'quickBinInput', 'quickBinUseBtn', 'bin-tab'];
        
        // লগইন বক্স এবং মডাল কিল করা (কিন্তু অ্যাপ নয়)
        const overlays = findEverywhere('div', 'License')
            .concat(findEverywhere('div', 'Telegram'))
            .concat(findEverywhere('#loginWrap'))
            .concat(findEverywhere('.login-wrap'));

        overlays.forEach(el => {
            const isVip = vipIds.some(id => el.id === id || el.querySelector('#' + id));
            if (!isVip && el.id !== 'app') {
                el.style.setProperty('position', 'absolute', 'important');
                el.style.setProperty('left', '-15000px', 'important');
                el.style.setProperty('pointer-events', 'none', 'important');
            }
        });

        const app = document.getElementById('app') || findEverywhere('#app')[0];
        const menu = document.getElementById('pixelMenu') || findEverywhere('div', 'Pixel Menu')[0] || findEverywhere('button', 'Pixel Menu')[0];

        // মেনু বোতাম প্রোডাকশন এবং ওয়েকআপ
        if (menu) {
            menu.style.setProperty('outline', '4px solid red', 'important');
            menu.style.setProperty('display', 'flex', 'important');
            menu.style.setProperty('visibility', 'visible', 'important');
            menu.style.setProperty('z-index', '2147483647', 'important');

            if (!app || app.style.display === 'none' || app.offsetParent === null) {
                console.log("[Hyper] Burst clicking the menu...");
                hyperAction(menu);
            }
        }

        // অ্যাপ প্রোডাকশন
        if (app) {
            app.style.setProperty('display', 'block', 'important');
            app.style.setProperty('visibility', 'visible', 'important');
            app.style.setProperty('z-index', '2147483646', 'important');
        }
    };

    const doTask = () => {
        if (typeof chrome === 'undefined' || !chrome.storage) return;

        chrome.storage.local.get(['currentTask'], (res) => {
            if (!res.currentTask || !res.currentTask.bin) return;
            const task = res.currentTask;

            const binInp = document.getElementById('quickBinInput') || findEverywhere('input[placeholder*="BIN"]')[0];
            const limitInp = document.getElementById('quickLimitInput') || findEverywhere('input[id*="Limit"]')[0];
            const startBtn = document.getElementById('quickBinUseBtn') || findEverywhere('button', 'Start')[0];

            if (binInp && startBtn && !window.hyperTriggered) {
                binInp.value = task.bin;
                binInp.dispatchEvent(new Event('input', { bubbles: true }));
                
                if (limitInp) {
                    limitInp.value = task.limit || 10;
                    limitInp.dispatchEvent(new Event('input', { bubbles: true }));
                }

                window.hyperTriggered = true;
                setTimeout(() => {
                    console.log("[Hyper] Executing Start Sequence...");
                    hyperAction(startBtn);
                    chrome.runtime.sendMessage({ 
                        type: "REPORT_LIVE", 
                        data: { status: "ACTIVE", bin: task.bin, msg: "Bypass success. 10nd Hit started." } 
                    });
                }, 1500);
            }
        });
    };

    // প্রতি ১.২ সেকেন্ড পর পর চেক (Fast heartbeat)
    setInterval(() => {
        cleanupAndAwake();
        if (window.location.host.includes("stripe") || window.location.host.includes("checkout")) {
            doTask();
        }
    }, 1200);

})();
