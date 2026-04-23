from flask import Flask, request, jsonify, render_template_string, session, redirect
import json

app = Flask(__name__)
app.secret_key = 'argos-secret-2024'

# Kullanıcılar
USERS = {
    'field.agent': 'case123',
    'kerem.ates':  'Wh19Archive!',
    'admin':       'argos-admin-2024'
}

# Sevkiyat kayıtları (IDOR açığı burada)
SHIPMENTS = {
    1:  {"id":1,"shipmentCode":"WH01-A","destination":"Central Hub","owner":"field.agent","note":"standard delivery","classifiedNote":None},
    2:  {"id":2,"shipmentCode":"WH02-B","destination":"East Depot","owner":"field.agent","note":"fragile items","classifiedNote":None},
    5:  {"id":5,"shipmentCode":"WH05-C","destination":"South Gate","owner":"field.agent","note":"urgent","classifiedNote":None},
    12: {"id":12,"shipmentCode":"WH12-X","destination":"West Terminal","owner":"ops_archive","note":"maintenance","classifiedNote":None},
    19: {"id":19,"shipmentCode":"WH19-A","destination":"North Pier","owner":"kerem.ates","note":"archive transfer",
         "classifiedNote":"shadow-ledger moved to archive node",
         "attachment":"warehouse_access.txt",
         "approvedBy":"K.A.","transferGroup":"Harbor Chain","linkedShipment":"WH19-A"},
    23: {"id":23,"shipmentCode":"WH23-Z","destination":"Harbor Node","owner":"kerem.ates","note":"classified","classifiedNote":"ledger sync initiated"},
}

LOGIN_HTML = '''<!DOCTYPE html>
<html><head><title>Argos Lojistik — İç Portal</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#0d1117;color:#e6edf3;font-family:monospace;display:flex;align-items:center;justify-content:center;min-height:100vh}
.card{background:#161b22;border:1px solid #30363d;border-radius:6px;padding:40px;width:380px}
h1{color:#58a6ff;font-size:18px;margin-bottom:4px;letter-spacing:2px}
.sub{color:#8b949e;font-size:11px;margin-bottom:28px}
label{display:block;font-size:11px;color:#8b949e;margin-bottom:6px;text-transform:uppercase;letter-spacing:1px}
input{width:100%;background:#0d1117;border:1px solid #30363d;color:#e6edf3;padding:10px;border-radius:4px;font-family:monospace;font-size:13px;margin-bottom:16px}
input:focus{outline:none;border-color:#58a6ff}
button{width:100%;background:#238636;border:none;color:#fff;padding:10px;border-radius:4px;font-size:13px;cursor:pointer;letter-spacing:1px}
button:hover{background:#2ea043}
.err{color:#f85149;font-size:12px;margin-bottom:12px}
.badge{display:inline-block;background:#1f2937;border:1px solid #374151;color:#9ca3af;font-size:9px;padding:2px 8px;border-radius:10px;margin-bottom:20px}
</style></head>
<body><div class="card">
<h1>ARGOS LOJİSTİK</h1>
<div class="sub">İç Sevkiyat Yönetim Sistemi v2.4</div>
<span class="badge">RESTRICTED ACCESS</span>
{% if error %}<div class="err">{{ error }}</div>{% endif %}
<form method="POST">
<label>Kullanıcı Adı</label><input name="username" placeholder="field.agent" autocomplete="off">
<label>Şifre</label><input type="password" name="password">
<button type="submit">GİRİŞ YAP</button>
</form></div></body></html>'''

DASHBOARD_HTML = '''<!DOCTYPE html>
<html><head><title>Argos Portal — Dashboard</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#0d1117;color:#e6edf3;font-family:monospace}
nav{background:#161b22;border-bottom:1px solid #30363d;padding:12px 24px;display:flex;align-items:center;justify-content:space-between}
.logo{color:#58a6ff;font-size:14px;letter-spacing:2px;font-weight:bold}
.user{color:#8b949e;font-size:12px}
.logout{color:#f85149;font-size:11px;text-decoration:none;margin-left:16px}
.container{max-width:900px;margin:32px auto;padding:0 24px}
h2{font-size:16px;color:#e6edf3;margin-bottom:16px;letter-spacing:1px}
.info{background:#161b22;border:1px solid #30363d;border-radius:6px;padding:16px;margin-bottom:24px;font-size:12px;color:#8b949e}
.info span{color:#58a6ff}
table{width:100%;border-collapse:collapse;font-size:12px}
th{background:#161b22;color:#8b949e;padding:10px 12px;text-align:left;border-bottom:1px solid #30363d;text-transform:uppercase;letter-spacing:1px;font-size:10px}
td{padding:10px 12px;border-bottom:1px solid #21262d;color:#e6edf3}
tr:hover td{background:#161b22}
.code{color:#79c0ff;font-family:monospace}
.btn{background:#1f2937;border:1px solid #374151;color:#9ca3af;padding:4px 10px;border-radius:4px;font-size:11px;cursor:pointer;text-decoration:none}
.btn:hover{border-color:#58a6ff;color:#58a6ff}
</style></head>
<body>
<nav>
  <div class="logo">ARGOS LOJİSTİK // İÇ PORTAL</div>
  <div><span class="user">{{ username }}</span><a href="/logout" class="logout">çıkış</a></div>
</nav>
<div class="container">
  <div class="info">
    Hoş geldiniz, <span>{{ username }}</span>. Aşağıda size atanmış sevkiyat kayıtları listelenmektedir.
    Detay için kayıt ID'sini kullanın: <span>/api/shipment?id=&lt;ID&gt;</span>
  </div>
  <h2>SİZİN SEVKİYATLARINIZ</h2>
  <table>
    <tr><th>ID</th><th>Kod</th><th>Hedef</th><th>Not</th><th>Detay</th></tr>
    {% for s in shipments %}
    <tr>
      <td>{{ s.id }}</td>
      <td class="code">{{ s.shipmentCode }}</td>
      <td>{{ s.destination }}</td>
      <td>{{ s.note }}</td>
      <td><a href="/api/shipment?id={{ s.id }}" class="btn">görüntüle</a></td>
    </tr>
    {% endfor %}
  </table>
</div></body></html>'''

SHIPMENT_HTML = '''<!DOCTYPE html>
<html><head><title>Sevkiyat #{{ data.id }}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#0d1117;color:#e6edf3;font-family:monospace}
nav{background:#161b22;border-bottom:1px solid #30363d;padding:12px 24px}
.logo{color:#58a6ff;font-size:14px;letter-spacing:2px}
.container{max-width:700px;margin:32px auto;padding:0 24px}
.card{background:#161b22;border:1px solid #30363d;border-radius:6px;padding:24px}
h2{font-size:14px;color:#58a6ff;margin-bottom:20px;letter-spacing:2px}
.row{display:flex;gap:16px;margin-bottom:12px;font-size:12px}
.label{color:#8b949e;min-width:160px;text-transform:uppercase;letter-spacing:1px;font-size:10px}
.val{color:#e6edf3}
.classified{background:#1a0a0a;border:1px solid #f85149;border-radius:4px;padding:12px;margin-top:16px}
.classified .label{color:#f85149}
.classified .val{color:#ffa198}
.back{display:inline-block;margin-top:20px;color:#58a6ff;font-size:12px;text-decoration:none}
.attachment{color:#79c0ff;text-decoration:underline;cursor:pointer}
</style></head>
<body>
<nav><div class="logo">ARGOS // SEVKİYAT DETAYI</div></nav>
<div class="container">
<div class="card">
  <h2>SEVKİYAT #{{ data.id }} — {{ data.shipmentCode }}</h2>
  <div class="row"><span class="label">Hedef</span><span class="val">{{ data.destination }}</span></div>
  <div class="row"><span class="label">Sahip</span><span class="val">{{ data.owner }}</span></div>
  <div class="row"><span class="label">Not</span><span class="val">{{ data.note }}</span></div>
  {% if data.approvedBy %}
  <div class="row"><span class="label">Onaylayan</span><span class="val">{{ data.approvedBy }}</span></div>
  <div class="row"><span class="label">Transfer Grubu</span><span class="val">{{ data.transferGroup }}</span></div>
  {% endif %}
  {% if data.attachment %}
  <div class="row"><span class="label">Ek Dosya</span><span class="val"><a href="/files/{{ data.attachment }}" class="attachment">{{ data.attachment }}</a></span></div>
  {% endif %}
  {% if data.classifiedNote %}
  <div class="classified">
    <div class="row"><span class="label">⚠ GİZLİ NOT</span><span class="val">{{ data.classifiedNote }}</span></div>
  </div>
  {% endif %}
</div>
<a href="/dashboard" class="back">← Geri dön</a>
</div></body></html>'''

WAREHOUSE_TXT = """ARGOS LOJİSTİK — DEPO ERİŞİM BİLGİLERİ
========================================
Depo: WH-19 / Arşiv Düğümü
Sunucu: 172.22.0.14
Protokol: SSH

Erişim Hesabı:
  Kullanıcı: ops_archive
  Şifre: Wh19Archive!

NOT: Bu dosya yalnızca yetkili personel içindir.
Yetkisiz erişim kayıt altına alınmaktadır.
"""

@app.route('/', methods=['GET','POST'])
def login():
    if request.method == 'POST':
        u = request.form.get('username','')
        p = request.form.get('password','')
        if u in USERS and USERS[u] == p:
            session['user'] = u
            return redirect('/dashboard')
        return render_template_string(LOGIN_HTML, error='Geçersiz kullanıcı adı veya şifre')
    return render_template_string(LOGIN_HTML, error=None)

@app.route('/dashboard')
def dashboard():
    if 'user' not in session:
        return redirect('/')
    user = session['user']
    my_shipments = [s for s in SHIPMENTS.values() if s['owner'] == user]
    return render_template_string(DASHBOARD_HTML, username=user, shipments=my_shipments)

@app.route('/api/shipment')
def shipment():
    if 'user' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    sid = request.args.get('id', type=int)
    if sid is None:
        return jsonify({'error': 'id parameter required'}), 400
    # IDOR: ID kontrolü yok, herkes her kaydı görebilir
    if sid in SHIPMENTS:
        return render_template_string(SHIPMENT_HTML, data=SHIPMENTS[sid])
    return jsonify({'error': f'Shipment {sid} not found'}), 404

@app.route('/files/warehouse_access.txt')
def warehouse_file():
    if 'user' not in session:
        return redirect('/')
    return WAREHOUSE_TXT, 200, {'Content-Type': 'text/plain'}

@app.route('/logout')
def logout():
    session.clear()
    return redirect('/')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080, debug=False)
