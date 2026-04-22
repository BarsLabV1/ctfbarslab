from flask import Flask, request, render_template_string, session, redirect
import sqlite3, os

app = Flask(__name__)
app.secret_key = 'shadow-ledger-secret'

DB = '/tmp/ledger.db'

def init_db():
    conn = sqlite3.connect(DB)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        username TEXT,
        password TEXT,
        role TEXT
    )''')
    c.execute('''CREATE TABLE IF NOT EXISTS records (
        id INTEGER PRIMARY KEY,
        ref TEXT,
        amount INTEGER,
        approved_by TEXT,
        group_name TEXT,
        note TEXT,
        flag TEXT
    )''')
    # Kullanıcılar
    c.execute("INSERT OR IGNORE INTO users VALUES (1,'admin','SL@dm1n2024','admin')")
    c.execute("INSERT OR IGNORE INTO users VALUES (2,'viewer','view123','viewer')")
    # Kayıtlar
    c.execute("INSERT OR IGNORE INTO records VALUES (1,'SL-001',15000,'K.A.','Harbor Chain','standard','NULL')")
    c.execute("INSERT OR IGNORE INTO records VALUES (2,'SL-002',87000,'K.A.','Harbor Chain','priority transfer','NULL')")
    c.execute("INSERT OR IGNORE INTO records VALUES (3,'SL-019',250000,'K.A.','Harbor Chain','WH19-A linked','flag{shadow_ledger_cozuldu}')")
    conn.commit()
    conn.close()

init_db()

LOGIN_HTML = '''<!DOCTYPE html>
<html><head><title>Shadow Ledger — Secure Access</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#080b0f;color:#e2e8f0;font-family:monospace;display:flex;align-items:center;justify-content:center;min-height:100vh}
.card{background:#0d1117;border:1px solid #1e293b;border-top:2px solid #f5c518;border-radius:4px;padding:40px;width:400px}
.logo{color:#f5c518;font-size:20px;font-weight:900;letter-spacing:4px;margin-bottom:4px}
.sub{color:#475569;font-size:10px;letter-spacing:2px;margin-bottom:32px}
label{display:block;font-size:10px;color:#475569;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:6px}
input{width:100%;background:#080b0f;border:1px solid #1e293b;color:#e2e8f0;padding:10px 12px;border-radius:3px;font-family:monospace;font-size:13px;margin-bottom:16px}
input:focus{outline:none;border-color:#f5c518}
button{width:100%;background:#f5c518;border:none;color:#000;padding:11px;border-radius:3px;font-size:12px;font-weight:900;letter-spacing:2px;cursor:pointer}
button:hover{background:#ffd700}
.err{background:rgba(248,113,113,0.1);border:1px solid rgba(248,113,113,0.3);color:#f87171;padding:10px;border-radius:3px;font-size:12px;margin-bottom:16px}
.hint{color:#334155;font-size:10px;margin-top:16px;text-align:center}
</style></head>
<body><div class="card">
<div class="logo">SHADOW LEDGER</div>
<div class="sub">// RESTRICTED FINANCIAL SYSTEM</div>
{% if error %}<div class="err">{{ error }}</div>{% endif %}
<form method="POST">
<label>Username</label>
<input name="username" placeholder="username" autocomplete="off">
<label>Password</label>
<input type="password" name="password" placeholder="••••••••">
<button type="submit">AUTHENTICATE</button>
</form>
<div class="hint">Authorized personnel only. All access is logged.</div>
</div></body></html>'''

DASHBOARD_HTML = '''<!DOCTYPE html>
<html><head><title>Shadow Ledger — Dashboard</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#080b0f;color:#e2e8f0;font-family:monospace}
nav{background:#0d1117;border-bottom:1px solid #1e293b;padding:12px 24px;display:flex;justify-content:space-between;align-items:center}
.logo{color:#f5c518;font-size:14px;font-weight:900;letter-spacing:3px}
.user{color:#475569;font-size:11px}
a.logout{color:#f87171;font-size:11px;text-decoration:none;margin-left:12px}
.container{max-width:900px;margin:32px auto;padding:0 24px}
.alert{background:rgba(245,197,24,0.08);border:1px solid rgba(245,197,24,0.2);color:#f5c518;padding:12px 16px;border-radius:3px;font-size:12px;margin-bottom:24px}
h2{font-size:13px;color:#94a3b8;letter-spacing:2px;margin-bottom:16px;text-transform:uppercase}
table{width:100%;border-collapse:collapse;font-size:12px}
th{background:#0d1117;color:#475569;padding:10px 12px;text-align:left;border-bottom:1px solid #1e293b;font-size:10px;letter-spacing:1px;text-transform:uppercase}
td{padding:10px 12px;border-bottom:1px solid #0f172a;color:#e2e8f0}
tr:hover td{background:#0d1117}
.flag{color:#00ff88;font-family:monospace;font-weight:bold}
.ref{color:#f5c518}
</style></head>
<body>
<nav>
  <div class="logo">SHADOW LEDGER</div>
  <div><span class="user">{{ username }} [{{ role }}]</span><a href="/logout" class="logout">logout</a></div>
</nav>
<div class="container">
  <div class="alert">⚠ CLASSIFIED — Harbor Chain transfer records. Unauthorized access is a federal offense.</div>
  <h2>Financial Records — Harbor Chain</h2>
  <table>
    <tr><th>REF</th><th>Amount</th><th>Approved By</th><th>Group</th><th>Note</th><th>Flag</th></tr>
    {% for r in records %}
    <tr>
      <td class="ref">{{ r[1] }}</td>
      <td>{{ r[2] | int | format_currency }}</td>
      <td>{{ r[3] }}</td>
      <td>{{ r[4] }}</td>
      <td>{{ r[5] }}</td>
      <td class="flag">{{ r[6] if r[6] != "NULL" else "—" }}</td>
    </tr>
    {% endfor %}
  </table>
</div></body></html>'''

@app.template_filter('format_currency')
def format_currency(value):
    return f"${value:,}"

@app.route('/', methods=['GET','POST'])
def login():
    if 'user' in session:
        return redirect('/dashboard')
    if request.method == 'POST':
        username = request.form.get('username','')
        password = request.form.get('password','')
        # SQL INJECTION AÇIĞI — kasıtlı
        conn = sqlite3.connect(DB)
        c = conn.cursor()
        query = f"SELECT * FROM users WHERE username='{username}' AND password='{password}'"
        try:
            c.execute(query)
            user = c.fetchone()
        except Exception as e:
            conn.close()
            return render_template_string(LOGIN_HTML, error=f"DB Error: {e}")
        conn.close()
        if user:
            session['user'] = user[1]
            session['role'] = user[3]
            return redirect('/dashboard')
        return render_template_string(LOGIN_HTML, error='Invalid credentials')
    return render_template_string(LOGIN_HTML, error=None)

@app.route('/dashboard')
def dashboard():
    if 'user' not in session:
        return redirect('/')
    conn = sqlite3.connect(DB)
    c = conn.cursor()
    c.execute("SELECT * FROM records")
    records = c.fetchall()
    conn.close()
    return render_template_string(DASHBOARD_HTML,
        username=session['user'], role=session.get('role','?'), records=records)

@app.route('/logout')
def logout():
    session.clear()
    return redirect('/')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080, debug=False)
