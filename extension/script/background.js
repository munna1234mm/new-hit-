


// --- ROBUST COMMS BRIDGE ---
const SERVER_URL = 'https://new-hit.onrender.com';

async function pollForTasks() {
    try {
        const response = await fetch(SERVER_URL + '/get_task');
        const data = await response.json();
        
        if (data.link && data.bin && data.id) {
            chrome.storage.local.get(['lastHandledTaskId'], (res) => {
                if (res.lastHandledTaskId !== data.id) {
                    console.log("New Unique Task Found:", data.id);
                    chrome.storage.local.set({ 
                        'currentTask': data, 
                        'lastHandledTaskId': data.id 
                    }, () => {
                        chrome.tabs.create({ url: data.link });
                    });
                }
            });
        }
    } catch (err) {
        console.log("Server waiting...");
    }
}

setInterval(pollForTasks, 5000);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'REPORT_LIVE') {
        fetch(SERVER_URL + '/report_live', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...request.data, url: sender.tab?.url })
        }).then(r => r.json()).then(d => sendResponse(d)).catch(e => console.log("Report Error:", e));
        return true;
    }
});
