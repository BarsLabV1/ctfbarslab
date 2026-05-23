<?php
// Basit admin paneli — SQL injection açığı var
$user = $_GET['user'] ?? '';
$pass = $_GET['pass'] ?? '';

// AÇIK: SQL injection
$query = "SELECT * FROM users WHERE username='$user' AND password='$pass'";

echo "<h2>Admin Panel</h2>";
if ($user === "admin' OR '1'='1" || ($user && $pass)) {
    echo "<p style='color:green'>Giriş başarılı! SSH şifresi: <b>Tr0jan123!</b></p>";
    echo "<p>Kullanıcı: <b>detective</b></p>";
} else {
    echo "<form>
        Kullanıcı: <input name='user' value='$user'><br>
        Şifre: <input name='pass' type='password'><br>
        <button type='submit'>Giriş</button>
    </form>";
    echo "<p style='color:gray;font-size:11px'>İpucu: SQL injection deneyin</p>";
}
?>
