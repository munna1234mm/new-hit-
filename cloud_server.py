from flask import Flask, request, jsonify, render_template_string
import os

app = Flask(__name__)

# In-memory storage for the current task and results
task_data = {
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
    <title>Stripe Hitter Remote Dashboard</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        body { background-color: #121212; color: #e0e0e0; }
        .container { margin-top: 50px; max-width: 800px; }
        .card { background-color: #1e1e1e; border: 1px solid #333; color: white; }
        .btn-primary { background-color: #6200ee; border: none; }
        #log-container { background: #000; color: #0f0; padding: 15px; height: 300px; overflow-y: auto; font-family: monospace; border: 1px solid #444; }
        .result-item { border-bottom: 1px solid #333; padding: 5px 0; }
        .status-success { color: #00ff00; }
        .status-fail { color: #ff0000; }
    </style>
</head>
<body>
    <div class="container">
        <h2 class="text-center mb-4">Stripe Hitter Control Panel</h2>
        
        <div class="card mb-4">
            <div class="card-body">
                <h5 class="card-title">New Task</h5>
                <div class="mb-3">
                    <label class="form-label">Stripe Checkout Link</label>
                    <textarea id="link" class="form-control bg-dark text-white" rows="3" placeholder="Paste long URL here..."></textarea>
                </div>
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label class="form-label">BIN</label>
                        <input type="text" id="bin" class="form-control bg-dark text-white" value="489504">
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="form-label">Total Retries</label>
                        <input type="number" id="limit" class="form-control bg-dark text-white" value="10">
                    </div>
                </div>
                <button onclick="sendTask()" class="btn btn-primary w-100">Send to Extension</button>
            </div>
        </div>

        <div class="card">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h5 class="card-title">Live Results</h5>
                    <button onclick="clearLogs()" class="btn btn-sm btn-outline-danger">Clear</button>
                </div>
                <div id="log-container"></div>
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
            
            fetch('/add_task', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(data)
            }).then(r => r.json()).then(res => {
                alert("Task Sent! The extension will pick it up automatically.");
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
                    container.innerHTML = '';
                    data.forEach(res => {
                        const div = document.createElement('div');
                        div.className = 'result-item';
                        const color = res.status === 'SUCCESS' ? 'status-success' : 'status-fail';
                        div.innerHTML = `[${res.time}] BIN: ${res.bin} - <span class="${color}">${res.status}</span> - ${res.msg || ''}`;
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
        "link": data.get('link'),
        "bin": data.get('bin'),
        "limit": data.get('limit', 10),
        "status": "pending"
    }
    return jsonify({"status": "queued"})

@app.route('/get_task', methods=['GET'])
def get_task():
    global task_data
    return jsonify(task_data)

@app.route('/report_live', methods=['POST'])
def report_live():
    data = request.json
    import datetime
    data['time'] = datetime.datetime.now().strftime("%H:%M:%S")
    results.insert(0, data) # Newest first
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
