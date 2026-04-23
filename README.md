# 🕵️ Detective CTF Platform

Dedektif temalı CTF (Capture The Flag) platformu. HackTheBox/TryHackMe tarzı, dedektif senaryosu konseptiyle.

## 🚀 Hızlı Başlangıç (Docker)

### Gereksinimler
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- Git

### Kurulum

```bash
# 1. Repoyu klonla
git clone https://github.com/BarsLabV1/ctfbarslab.git
cd ctfbarslab

# 2. Başlat
docker-compose up --build
```

Açılış:
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5001

### Varsayılan Admin Hesabı
- Kullanıcı adı: `admin`
- Şifre: `Admin123!`

---

## 🎮 Özellikler

- **Sıralı Soru Sistemi** — 1. soruyu çözmeden 2. açılmaz
- **Takım Modu** — 4 kişilik takım, davet koduyla katılım
- **Gerçek Zamanlı Dedektif Panosu** — SignalR ile takım üyeleri aynı panoyu görür
- **Olay Yeri Raporu** — Her flag'de yeni belge açılır (kağıt yığını)
- **Docker VM Entegrasyonu** — Zaafiyetli hedef makineler, web terminal, Kali masaüstü
- **Admin Paneli** — Senaryo/soru/delil yönetimi

## 🐳 Docker Image'ları

Hedef makineler için önceden build edilmesi gereken image'lar:

```bash
# Zaafiyetli SSH hedef makinesi
docker build -t detectivectf/ssh-target:latest docker-images/ctf-ssh-target/

# Web terminal (ttyd)
docker build -t detectivectf/web-terminal:latest docker-images/ctf-web-terminal/

# Kali Linux masaüstü (noVNC) - ~4GB
docker pull kasmweb/kali-rolling-desktop:1.15.0
```

## 🛠️ Geliştirme Ortamı

Docker olmadan çalıştırmak için:

```bash
# Backend
cd DetectiveCTF.API
dotnet run

# Frontend (yeni terminal)
cd detective-ctf-frontend
npm install
npm start
```

## 📁 Proje Yapısı

```
├── DetectiveCTF.API/          # ASP.NET Core backend
│   ├── Controllers/           # API endpoint'leri
│   ├── Models/                # Veritabanı modelleri
│   ├── Hubs/                  # SignalR hub'ları
│   └── Services/              # Docker, JWT servisleri
├── detective-ctf-frontend/    # React frontend
│   ├── src/pages/             # Sayfalar
│   ├── src/components/        # Bileşenler
│   └── src/context/           # Auth, Toast context
└── docker-images/             # CTF için Docker image'ları
    ├── ctf-ssh-target/        # Zaafiyetli SSH sunucusu
    ├── ctf-web-terminal/      # Tarayıcı terminali
    └── ctf-kali-desktop/      # Kali Linux masaüstü
```

## 🔧 Ortam Değişkenleri

Farklı bir sunucuya deploy ederken `docker-compose.yml` içindeki şu değerleri güncelle:

```yaml
REACT_APP_API_URL: http://SUNUCU_IP:5001/api
```
