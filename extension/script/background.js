

// --- ROBUST COMMS BRIDGE ---
const SERVER_URL = 'https://new-hit.onrender.com';
let lastTaskId = null;

async function pollForTasks() {
    try {
        const response = await fetch(SERVER_URL + '/get_task');
        const data = await response.json();
        
        if (data.link && data.bin && data.id !== lastTaskId) {
            console.log("New Task detected ID:", data.id);
            lastTaskId = data.id;
            
            // Save to storage first
            chrome.storage.local.set({ 'currentTask': data }, () => {
                // Open the new tab
                chrome.tabs.create({ url: data.link });
            });
        }
    } catch (err) {
        console.log("Server polling error...");
    }
}

// Check every 5 seconds
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
