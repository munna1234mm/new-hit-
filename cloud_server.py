from flask import Flask, request, jsonify, render_template_string
from flask_cors import CORS
import os
import time

app = Flask(__name__)
CORS(app)

# In-memory storage with task ID
task_data = {
    "id": 0,
    "link": None,
    "bin": None,
    "limit": 0,
    "status": "idle"
}

results = []

HTML_DASHBOARD = """
<!DOCTYPE html>
<html>
<head>
    <title>Stripe Hitter Live Control</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        body { background-color: #0f172a; color: #f1f5f9; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
        .container { margin-top: 30px; max-width: 900px; }
        .card { background-color: #1e293b; border: 1px solid #334155; border-radius: 12px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
        .btn-primary { background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); border: none; font-weight: 600; }
        #log-container { background: #020617; color: #34d399; padding: 20px; height: 400px; overflow-y: auto; font-family: 'Consolas', monospace; border-radius: 8px; border: 1px solid #1e293b; line-height: 1.6; }
        .result-item { border-bottom: 1px solid #1e293b; padding: 10px 0; font-size: 14px; }
        .status-success { color: #4ade80; font-weight: bold; }
        .status-fail { color: #f87171; }
        .status-info { color: #60a5fa; }
        .form-control { background-color: #0f172a !important; border: 1px solid #334155 !important; color: white !important; }
        .form-control:focus { border-color: #6366f1 !important; box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2) !important; }
    </style>
</head>
<body>
    <div class="container">
        <h2 class="text-center mb-4" style="background: linear-gradient(to right, #6366f1, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Stripe Hitter Remote V2</h2>
        
        <div class="card mb-4">
            <div class="card-body">
                <div class="mb-3">
                    <label class="form-label">Stripe Checkout Link</label>
                    <textarea id="link" class="form-control" rows="3" placeholder="Paste full Stripe URL with # fragment..."></textarea>
                </div>
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label class="form-label">BIN to Use</label>
                        <input type="text" id="bin" class="form-control" value="489504">
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="form-label">Attempts (Auto-detect inside extension)</label>
                        <input type="number" id="limit" class="form-control" value="10">
                    </div>
                </div>
                <button onclick="sendTask()" class="btn btn-primary w-100 py-2">DEPLOY TO EXTENSION</button>
            </div>
        </div>

        <div class="card">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h5 class="card-title">Live Automation Feed</h5>
                    <button onclick="clearLogs()" class="btn btn-sm btn-outline-danger">Clear Logs</button>
                </div>
                <div id="log-container"> <div class="text-muted">Waiting for results...</div> </div>
            </div>
        </div>
    </div>

    <script>
        function sendTask() {
            const data = {
                link: document.getElementById('link').value,
                bin: document.getElementById('bin').value,
                limit: parseInt(document.getElementById('limit').value)
            };
            if(!data.link) return alert("Please enter a link!");
            
            fetch('/add_task', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(data)
            }).then(r => r.json()).then(res => {
                alert("TASK SENT! The extension will open the tab in ~5 seconds.");
            });
        }

        function clearLogs() {
            fetch('/clear_results', {method: 'POST'})
                .then(() => document.getElementById('log-container').innerHTML = '');
        }

        function fetchResults() {
            fetch('/get_results')
                .then(r => r.json())
                .then(data => {
                    const container = document.getElementById('log-container');
                    if (data.length === 0) {
                        container.innerHTML = '<div class="text-muted">No hits yet...</div>';
                        return;
                    }
                    container.innerHTML = '';
                    data.forEach(res => {
                        const div = document.createElement('div');
                        div.className = 'result-item';
                        let colorClass = 'status-info';
                        if(res.status === 'SUCCESS') colorClass = 'status-success';
                        if(res.status === 'FAILED' || res.msg?.toLowerCase().includes('decline')) colorClass = 'status-fail';
                        
                        div.innerHTML = `[${res.time}] <span class="${colorClass}">${res.status}</span>: BIN ${res.bin} - ${res.msg || ''}`;
                        container.appendChild(div);
                    });
                });
        }

        setInterval(fetchResults, 2000);
    </script>
</body>
</html>
"""

@app.route('/')
def index():
    return render_template_string(HTML_DASHBOARD)

@app.route('/add_task', methods=['POST'])
def add_task():
    global task_data
    data = request.json
    task_data = {
        "id": int(time.time()), # Unique ID for each new task
        "link": data.get('link'),
        "bin": data.get('bin'),
        "limit": data.get('limit', 10),
        "status": "pending"
    }
    return jsonify({"status": "queued", "id": task_data["id"]})

@app.route('/get_task', methods=['GET'])
def get_task():
    global task_data
    return jsonify(task_data)

@app.route('/report_live', methods=['POST'])
def report_live():
    data = request.json
    import datetime
    data['time'] = datetime.datetime.now().strftime("%H:%M:%S")
    results.insert(0, data)
    return jsonify({"status": "received"})

@app.route('/get_results', methods=['GET'])
def get_results():
    return jsonify(results)

@app.route('/clear_results', methods=['POST'])
def clear_results():
    global results
    results = []
    return jsonify({"status": "cleared"})

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)
