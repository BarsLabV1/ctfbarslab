# CTF Full Machine — TechCorp Senaryosu

## Build

```bash
docker build -t ctf/techcorp:latest .
```

## Admin Panelde Ayarla

- **Docker Image:** `ctf/techcorp:latest`
- **Domain:** `techcorp.ctf` (opsiyonel)

## Senaryo Akışı

### Soru 1 — Keşif (OSINT/Network) — 100p
**Başlık:** Hedef Sistemin Açık Portlarını Bul  
**Açıklama:** Verilen IP adresine nmap taraması yap. Açık portları ve servisleri tespit et.  
**Flag:** `CTF{22_80_open_ports}`  
**İpucu:** `nmap -sV <IP>`

### Soru 2 — Web Keşfi (Web) — 150p
**Başlık:** Gizli Dizini Bul  
**Açıklama:** Web sitesinin robots.txt dosyasını incele. Gizli yedekleme dizinini bul ve flag'i al.  
**Flag:** `CTF{w3b_r3con_m4st3r}`  
**İpucu:** `http://<IP>/robots.txt` → `/secret-backup/flag.txt`

### Soru 3 — SQL Injection (Web) — 200p
**Başlık:** Admin Paneline Gir  
**Açıklama:** `/admin-panel/` dizinindeki giriş formuna SQL injection uygula. SSH bilgilerini ele geçir.  
**Flag:** `CTF{sql_1nj3ct10n_pwn3d}`  
**İpucu:** `' OR '1'='1` payload'ını dene

### Soru 4 — SSH Erişimi (Network) — 150p
**Başlık:** Sisteme SSH ile Bağlan  
**Açıklama:** Ele geçirdiğin bilgilerle SSH bağlantısı kur. User flag'ini bul.  
**Flag:** `CTF{ssh_br0k3n_4uth}`  
**İpucu:** `ssh detective@<IP> -p <PORT>` → `cat user.txt`

### Soru 5 — Privilege Escalation (PWN) — 300p
**Başlık:** Root Yetkisi Al  
**Açıklama:** SUID binary'yi kullanarak admin kullanıcısına geç ve root flag'ini oku.  
**Flag:** `CTF{pr1v_3sc_g0d}`  
**İpucu:** `find / -perm -4000 2>/dev/null` → python3-helper ile shell al

## Kullanıcılar
- `detective` / `Tr0jan123!` (SSH)
- `admin` / `S3cr3tP@ss` (root flag sahibi)
