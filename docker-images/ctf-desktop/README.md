# CTF Desktop Image

BarsLab CTF platformu için tarayıcı üzerinden erişilebilen Kali benzeri masaüstü ortamı.

## Build

```bash
docker build -t ctf-desktop:latest .
```

## Test (manuel çalıştır)

```bash
docker run -d --name test-desktop -p 30000:6080 ctf-desktop:latest
# Tarayıcıda aç: http://localhost:30000/vnc.html
# VNC şifresi: ctf2024
```

## İçindeki Araçlar

### 🌐 Web / OSINT
| Araç | Açıklama |
|------|----------|
| `nmap` | Port tarama |
| `gobuster` | Dizin/subdomain brute force |
| `ffuf` | Web fuzzing |
| `sqlmap` | SQL injection otomasyonu |
| `nikto` | Web zafiyet tarayıcı |
| `dirb` | Dizin tarama |
| `curl` / `wget` | HTTP istekleri |
| `whois` / `dig` | DNS / WHOIS sorguları |

### 🔬 Forensics
| Araç | Açıklama |
|------|----------|
| `binwalk` | Firmware/dosya analizi |
| `foremost` | Dosya kurtarma |
| `steghide` | Steganografi (gizli veri) |
| `exiftool` | Metadata analizi |
| `strings` | Binary'den metin çıkarma |
| `xxd` | Hex dump |
| `file` | Dosya türü tespiti |
| `tshark` / `tcpdump` | Ağ trafiği analizi |
| `wireshark-common` | PCAP analizi |

### 🔐 Crypto
| Araç | Açıklama |
|------|----------|
| `openssl` | Şifreleme/çözme |
| `gpg` | PGP işlemleri |
| `pycryptodome` (Python) | Crypto kütüphanesi |
| `z3-solver` (Python) | SMT solver |
| `CyberChef` | Offline, port 8888 |

### ⚙️ Reverse Engineering
| Araç | Açıklama |
|------|----------|
| `radare2` | Binary analiz framework |
| `gdb` | Debugger |
| `objdump` / `readelf` | ELF analizi |
| `ltrace` / `strace` | Sistem çağrısı takibi |
| `angr` (Python) | Binary analiz framework |

### 💣 PWN / Exploit
| Araç | Açıklama |
|------|----------|
| `pwntools` (Python) | Exploit geliştirme |
| `gdb` | Debugger |
| `netcat` | Bağlantı aracı |

### 🔑 Password Cracking
| Araç | Açıklama |
|------|----------|
| `john` | John the Ripper |
| `hashcat` | GPU hash kırma |
| `hydra` | Brute force |
| `rockyou.txt` | `/usr/share/wordlists/rockyou.txt` |

### 🐍 Python Kütüphaneleri
- `pwntools`, `pycryptodome`, `requests`, `beautifulsoup4`
- `scapy`, `impacket`, `paramiko`, `pillow`
- `stegano`, `exifread`, `pyOpenSSL`, `z3-solver`, `angr`

## Kaynak Limitleri (API tarafından uygulanır)
- RAM: 512 MB
- CPU: %50 (0.5 core)
- Süre: 2 saat (uzatılabilir, max 4 saat)
