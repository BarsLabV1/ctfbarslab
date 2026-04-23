from flask import Flask, request, render_template_string, session, redirect, jsonify

app = Flask(__name__)
app.secret_key = 'darknews-secret-2024'

USERS = {
    'reporter': {'password': 'news2024', 'id': 1, 'role': 'reporter'},
    'editor':   {'password': 'edit2024', 'id': 2, 'role': 'editor'},
    'admin':    {'password': 'Adm1n@DN', 'id': 3, 'role': 'admin'},
}

# Mesajlar — IDOR açığı: /api/messages?user_id=X ile herkes erişebilir
MESSAGES = {
    1: [
        {"id": 1, "from": "reporter", "to": "editor", "msg": "Haber hazır. Yayınlayalım mı?", "ts": "2024-04-13 20:11"},
        {"id": 2, "from": "editor",   "to": "reporter", "msg": "Bekle. K.A. onay vermedi.", "ts": "2024-04-13 20:15"},
    ],
    2: [
        {"id": 3, "from": "editor",   "to": "admin", "msg": "K.A. bu gece harekete geçiyor.", "ts": "2024-04-13 22:00"},
        {"id": 4, "from": "admin",    "to": "editor", "msg": "Anlıyorum. Ofis kamerası 23:00-23:30 arası devre dışı.", "ts": "2024-04-13 22:05"},
        {"id": 5, "from": "editor",   "to": "admin", "msg": "K.A. = Kerem Ateş. Şirket kurucusunun yeğeni. Kolundaki dövmeyi tanıdın mı?", "ts": "2024-04-13 22:10"},
        {"id": 6, "from": "admin",    "to": "editor", "msg": "Evet. Aile arması. Sadece onlarda var. flag{mesajlar_ifsa_edildi}", "ts": "2024-04-13 22:12"},
    ],
    3: [
        {"id": 7, "from": "admin", "to": "editor", "msg": "Operasyon tamamlandı. CEO artık sorun değil.", "ts": "2024-04-14 00:45"},
        {"id": 8, "from": "admin", "to": "editor", "msg": "Kerem Ateş bu işi organize etti. Delilleri imha et.", "ts": "2024-04-14 00:47"},
    ],
}

LOGIN_HTML = '''<!DOCTYPE html>
<html><head><title>DarkNews — Secure Channel</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#0a0a0a;color:#00ff41;font-family:monospace;display:flex;align-items:center;justify-content:center;min-height:100vh}
.card{background:#111;border:1px solid #00ff41;border-radius:4px;padding:40px;width:380px}
h1{font-size:20px;letter-spacing:4px;margin-bottom:4px;color:#00ff41}
.sub{color:#005500;font-size:10px;letter-spacing:2px;margin-bottom:28px}
label{display:block;font-size:10px;color:#005500;margin-bottom:6px;letter-spacing:1px;text-transform:uppercase}
input{width:100%;background:#000;border:1px solid #003300;color:#00ff41;padding:10px;font-family:monospace;font-size:13px;margin-bottom:16px}
input:focus{outline:none;border-color:#00ff41}
button{width:100%;background:#003300;border:1px solid #00ff41;color:#00ff41;padding:10px;font-size:12px;letter-spacing:2px;cursor:pointer}
button:hover{background:#00ff41;color:#000}
.err{color:#ff0000;font-size:12px;margin-bottom:12px}
.hint{color:#003300;font-size:9px;margin-top:12px;text-align:center}
</style></head>
<body><div class="card">
<h1>DARKNEWS</h1>
<div class="sub">// SECURE COMMUNICATION CHANNEL</div>
{% if error %}<div class="err">{{ error }}</div>{% endif %}
<form method="POST">
<label>Username</label><input name="username" autocomplete="off">
<label>Password</label><input type="password" name="password">
<button>ACCESS</button>
</form>
<div class="hint">Authorized personnel only. All sessions logged.</div>
</div></body></html>'''

INBOX_HTML = '''<!DOCTYPE html>
<html><head><title>DarkNews — Inbox</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#0a0a0a;color:#00ff41;font-family:monospace}
nav{background:#111;border-bottom:1px solid #003300;padding:12px 24px;display:flex;justify-content:space-between}
.logo{color:#00ff41;font-size:14px;letter-spacing:3px}
.user{color:#005500;font-size:11px}
a{color:#00ff41;text-decoration:none}
.container{max-width:800px;margin:32px auto;padding:0 24px}
.info{background:#111;border:1px solid #003300;padding:12px 16px;font-size:11px;color:#005500;margin-bottom:20px}
.info span{color:#00ff41}
h2{font-size:13px;letter-spacing:2px;margin-bottom:16px;color:#005500}
.msg{background:#111;border:1px solid #003300;border-radius:2px;padding:14px;margin-bottom:10px}
.msg-header{display:flex;justify-content:space-between;margin-bottom:8px;font-size:10px;color:#005500}
.msg-from{color:#00ff41}
.msg-body{font-size:13px;color:#00ff41;line-height:1.6}
.flag{color:#ffff00;font-weight:bold}
.api-hint{color:#003300;font-size:10px;margin-top:20px}
</style></head>
<body>
<nav>
  <div class="logo">DARKNEWS // SECURE</div>
  <div><span class="user">{{ username }} [{{ role }}]</span> | <a href="/logout">logout</a></div>
</nav>
<div class="container">
  <div class="info">
    Gelen kutusu: <span>{{ username }}</span> | 
    API: <span>/api/messages?user_id={{ user_id }}</span>
  </div>
  <h2>INBOX</h2>
  {% for msg in messages %}
  <div class="msg">
    <div class="msg-header">
      <span class="msg-from">FROM: {{ msg.from }} → TO: {{ msg.to }}</span>
      <span>{{ msg.ts }}</span>
    </div>
    <div class="msg-body {% if 'flag{' in msg.msg %}flag{% endif %}">{{ msg.msg }}</div>
  </div>
  {% endfor %}
  <div class="api-hint">// Tip: /api/messages?user_id=1, 2, 3 dene</div>
</div></body></html>'''

@app.route('/', methods=['GET','POST'])
def login():
    if 'user' in session:
        return redirect('/inbox')
    if request.method == 'POST':
        u = request.form.get('username','')
        p = request.form.get('password','')
        if u in USERS and USERS[u]['password'] == p:
            session['user'] = u
            session['user_id'] = USERS[u]['id']
            session['role'] = USERS[u]['role']
            return redirect('/inbox')
        return render_template_string(LOGIN_HTML, error='Invalid credentials')
    return render_template_string(LOGIN_HTML, error=None)

@app.route('/inbox')
def inbox():
    if 'user' not in session:
        return redirect('/')
    uid = session['user_id']
    msgs = MESSAGES.get(uid, [])
    return render_template_string(INBOX_HTML,
        username=session['user'],
        role=session['role'],
        user_id=uid,
        messages=msgs)

# IDOR açığı: user_id parametresi kontrol edilmiyor
@app.route('/api/messages')
def api_messages():
    if 'user' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    uid = request.args.get('user_id', type=int)
    if uid is None:
        return jsonify({'error': 'user_id required'}), 400
    # IDOR: kendi ID'si olmayan mesajlara da erişebilir
    msgs = MESSAGES.get(uid, [])
    return jsonify({'user_id': uid, 'messages': msgs})

@app.route('/logout')
def logout():
    session.clear()
    return redirect('/')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080, debug=False)
