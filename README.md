# Dedektif CTF Platformu

Profesyonel CTF (Capture The Flag) platformu. HackTheBox ve TryHackMe tarzında, dedektif temalı siber güvenlik yarışma platformu.

## 🎯 Özellikler

### Oyun Modları
- **Solo Mod**: Tek başına challenge'ları çöz
- **Takım Modu**: 4 kişilik takımlar kur veya katıl

### Rol Sistemi
- 🔍 **OSINT** - Açık kaynak istihbaratı
- 🌐 **Web Exploitation** - Web güvenlik açıkları
- 🔬 **Forensics** - Dijital adli bilişim
- 🔐 **Cryptography** - Şifreleme ve kriptografi
- ⚙️ **Reverse Engineering** - Tersine mühendislik
- 💣 **Binary Exploitation** - Binary sömürü
- 🌐 **Network** - Ağ güvenliği

### Challenge Sistemi
- ✅ Sıralı challenge açılma (1. çözülmeden 2. açılmaz)
- 🎥 Video/kamera kayıtları (delil olarak)
- 📄 Gerçek polis raporu görünümü
- 🔍 Dedektif panosu (raptiyeli notlar, kırmızı iplikler)
- 🐳 Docker ile gerçek sanal makineler
- 🏆 Puan ve liderlik sistemi

### Teknik Özellikler
- ASP.NET Core 8.0 Backend
- React 18 Frontend
- SQLite Veritabanı
- Docker Container Yönetimi
- JWT Authentication
- Real-time VM Management

## 🚀 Kurulum

### Gereksinimler
- .NET 8.0 SDK
- Node.js 18+
- Docker Desktop
- Git

### Backend Kurulumu
```bash
cd DetectiveCTF.API
dotnet restore
dotnet run
```

Backend: http://localhost:5001

### Frontend Kurulumu
```bash
cd detective-ctf-frontend
npm install
npm start
```

Frontend: http://localhost:3000

### Docker Sanal Makineleri
```bash
# Tüm challenge VM'lerini başlat
docker-compose up -d

# Sadece SSH sunucusu
docker-compose up -d ssh-server

# Sadece Web challenge
docker-compose up -d web-challenge

# Kali Linux
docker-compose up -d kali-linux
```

## 🎮 Kullanım

1. **Kayıt Ol / Giriş Yap**
2. **Lobiye Git**
   - Solo veya Takım modu seç
   - Rolünü seç (OSINT, Web, Forensics, vb.)
3. **Vaka Seç**
4. **Challenge'ları Çöz**
   - Olay yeri raporunu incele
   - Delilleri topla (video, log, vb.)
   - VM'leri başlat ve hackle
   - Flag'leri bul ve gönder
5. **Puan Kazan ve Liderlik Tablosunda Yüksel**

## 📁 Proje Yapısı

```
DetectiveCTF/
├── DetectiveCTF.API/          # Backend API
│   ├── Controllers/           # API Controllers
│   ├── Models/               # Database Models
│   ├── Services/             # Business Logic
│   └── Data/                 # Database Context
├── detective-ctf-frontend/    # React Frontend
│   ├── src/
│   │   ├── components/       # React Components
│   │   ├── pages/           # Page Components
│   │   ├── services/        # API Services
│   │   └── context/         # React Context
├── docker-compose.yml        # Docker Services
└── challenges/               # Challenge Data
    ├── ssh-data/
    ├── ftp-data/
    ├── kali-data/
    └── mysql-data/
```

## 🔐 Admin Paneli

Admin kullanıcısı ile giriş yaparak:
- Yeni vakalar oluştur
- Challenge'lar ekle
- Delil dosyaları yükle
- Kullanıcı istatistiklerini gör

**Default Admin:**
- Username: `admin`
- Password: `Admin123!`

## 🐳 Docker Challenge'lar

### SSH Server
- Port: 2222
- Username: admin
- Password: P@ssw0rd123

### FTP Server
- Port: 21
- Username: ftpuser
- Password: ftppass123

### Web Challenge (DVWA)
- URL: http://localhost:8080
- Username: admin
- Password: password

### Kali Linux
- Port: 2223
- Root access

### MySQL Database
- Port: 3306
- Username: ctfuser
- Password: ctfpass123

## 📝 Challenge Oluşturma

Admin panelinden yeni challenge oluşturabilirsiniz:

1. Vaka oluştur
2. Challenge ekle
   - Başlık, açıklama
   - Kategori (OSINT, Web, vb.)
   - Sıra numarası
   - Puan
   - Flag (CTF{...} formatında)
   - Gerekli challenge (opsiyonel)
   - Docker image (opsiyonel)
3. Delil dosyaları ekle
   - Video kayıtları
   - Log dosyaları
   - Resimler
   - Dökümanlar

## 🎯 Örnek Vaka: Siber Suikast

5 aşamalı challenge:

1. **OSINT** - Güvenlik kamerası analizi (100 puan)
2. **Forensics** - Sistem log analizi (150 puan)
3. **Web** - SSH sunucu hack (250 puan)
4. **Crypto** - Şifreli email çözme (200 puan)
5. **Final** - Katili tespit et (800 puan)

**Toplam:** 1500 puan

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Push yapın (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📄 Lisans

MIT License

## 🎓 Eğitim Amaçlı

Bu platform eğitim amaçlıdır. Gerçek sistemlere karşı kullanmayın.

## 📞 İletişim

Sorularınız için issue açabilirsiniz.
