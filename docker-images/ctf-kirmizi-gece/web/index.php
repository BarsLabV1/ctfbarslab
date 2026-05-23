<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<title>NexGen Teknoloji - Calisan Portali</title>
<style>
  * { box-sizing: border-box; }
  body { margin:0; background:#0a0e1a; color:#c8d8e8; font-family:Arial, sans-serif; }
  .header { background:#0d1b2a; padding:20px 40px; border-bottom:2px solid #00d4ff33; display:flex; gap:16px; align-items:center; }
  .logo { color:#00d4ff; font-size:24px; font-weight:900; letter-spacing:2px; }
  .logo span { color:#ff4444; }
  .nav { margin-left:auto; display:flex; gap:20px; }
  .nav a { color:#8aa0b8; text-decoration:none; font-size:13px; }
  .hero { padding:56px 20px; text-align:center; }
  h1 { color:#edf6ff; margin-bottom:8px; }
  .login-box, .panel { background:#0d1b2a; border:1px solid #1e3a5f; border-radius:8px; padding:28px; max-width:440px; margin:24px auto; text-align:left; }
  input { width:100%; background:#07111f; border:1px solid #1e3a5f; color:#dcecff; padding:11px 14px; border-radius:4px; margin-bottom:12px; }
  button { width:100%; background:#00d4ff22; border:1px solid #00d4ff66; color:#00d4ff; padding:11px; border-radius:4px; cursor:pointer; font-weight:700; }
  .notice { background:#ff444414; border:1px solid #ff444455; border-radius:4px; padding:12px; margin-top:16px; color:#ff9b9b; font-size:12px; }
  code { color:#00ffaa; }
  .query { color:#778ca8; font-size:12px; word-break:break-all; margin-top:14px; }
  .flag { color:#00ffaa; font-size:18px; font-weight:900; }
</style>
</head>
<body>
<div class="header">
  <div class="logo">NEX<span>GEN</span></div>
  <div style="font-size:11px;color:#607086;letter-spacing:1px;">TEKNOLOJI A.S.</div>
  <nav class="nav">
    <a href="/">Portal</a>
    <a href="/robots.txt">robots.txt</a>
    <a href="/internal-docs/">Dahili Belgeler</a>
  </nav>
</div>
<div class="hero">
  <h1>Calisan Portali</h1>
  <p>NexGen ic sistemlerine erismek icin giris yapin.</p>
  <?php
    $error = null;
    $row = null;
    $query = null;
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
      $u = $_POST['username'] ?? '';
      $p = $_POST['password'] ?? '';
      $db = new PDO('sqlite:/var/www/html/data/portal.db');
      $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
      $query = "SELECT * FROM users WHERE username = '$u' AND password = '$p'";
      try {
        $row = $db->query($query)->fetch(PDO::FETCH_ASSOC);
        if (!$row) $error = 'Hatali giris.';
      } catch (Throwable $e) {
        $error = 'SQL hata mesaji: ' . $e->getMessage();
      }
    }
  ?>
  <?php if ($row): ?>
    <div class="panel">
      <h2>Admin Panel</h2>
      <p>Rol: <code><?= htmlspecialchars($row['role']) ?></code></p>
      <p><?= htmlspecialchars($row['note']) ?></p>
      <p class="flag">CTF{sqli_portal_breached}</p>
      <div class="notice">Kerem hesabina SSH ile gir ve ev dizinindeki raporu incele.</div>
      <div class="query">Calisan sorgu: <?= htmlspecialchars($query) ?></div>
    </div>
  <?php else: ?>
    <form class="login-box" method="POST">
      <input name="username" type="text" placeholder="Kullanici adi">
      <input name="password" type="password" placeholder="Sifre">
      <button type="submit">Giris Yap</button>
      <?php if ($error): ?><div class="notice"><?= htmlspecialchars($error) ?></div><?php endif; ?>
      <div class="notice">Bakim notu: Eski portal SQL sorgulari henuz parametrelenmedi.</div>
      <?php if ($query): ?><div class="query">Son sorgu: <?= htmlspecialchars($query) ?></div><?php endif; ?>
    </form>
  <?php endif; ?>
</div>
</body>
</html>
