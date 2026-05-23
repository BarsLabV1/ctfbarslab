# sqlite_detectivectf_db_file

File: DetectiveCTF.API\detectivectf.db
Generated: 2026-05-19 21:36:31

## Tables

| Table | Rows |
| --- | --- |
| BoardCards | 3 |
| BoardStates | 3 |
| Cases | 6 |
| Challenges | 28 |
| Evidences | 3 |
| TeamCaseProgresses | 0 |
| TeamMembers | 2 |
| Teams | 1 |
| UserCaseProgresses | 0 |
| UserChallengeProgresses | 10 |
| Users | 4 |
| VMInstances | 6 |

## BoardCards

Rows: 3

| Id | CaseId | Type | Title | Content | FileUrl | ExternalUrl | DockerImage | PosX | PosY | Rotation | Color | UnlockedByChallenge | CreatedAt |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 7 | note | sifre : | cGFzc3dvcmQxMjM0IQ== |  |  |  | 400 | 400 | 0.0 | #bacb9a |  | 2026-04-22 00:35:41.3867841 |
| 2 | 7 | video |  |  | /uploads/071895e1-4598-40a6-acde-396818ea164b.mp4 |  |  | 400 | 400 | 0.0 | #bacb9a |  | 2026-04-22 00:36:07.8281327 |
| 3 | 7 | note | YOL | CEO'nun masasındaki kağıtta bulunan kod çözüldü.<br>Bu kodun CEO'nun bilgisayar şifresi olduğu düşünülüyor. |  |  |  | 400 | 400 | 0.0 | #bacb9a | 25 | 2026-04-22 00:39:04.1996809 |

## BoardStates

Rows: 3

| Id | CaseId | TeamId | UserId | StateJson | UpdatedAt |
| --- | --- | --- | --- | --- | --- |
| 16 | 8 |  | 1 | {"userNotes":[{"id":"note_1776964456381","title":"DarkNews Sitesi","text":"URL: http://10.10.74.179:32780/\nKullanici: reporter\nSifre: news2024","x":400,"y":1200,"color":"#bacb9a","rot":-1},{"id":"note_1776964588653","title":"PCAP Bulgulari","text":"darknews.local:8080\nreporter / news2024","x":600,"y":1200,"color":"#bacb9a","rot":-1}],"strings":[],"suspects":[]} | 2026-04-23 17:16:28.6993176 |
| 17 | 8 |  | 5 | {"userNotes":[{"id":"note_1776970463293","title":"CEO SSH","text":"Kullanici: ceo\nSifre: ceo_pass_2024","x":400,"y":1200,"color":"#bacb9a","rot":-1},{"id":"note_1776970484605","title":"DarkNews Sitesi","text":"URL: http://10.10.74.179:32780/\nKullanici: reporter\nSifre: news2024","x":600,"y":1200,"color":"#bacb9a","rot":-1}],"strings":[],"suspects":[]} | 2026-04-23 18:54:44.6115323 |
| 18 | 8 | 1 |  | {"userNotes":[{"id":"note_1776976312476","title":"CEO SSH","text":"Kullanici: ceo\nSifre: ceo_pass_2024","x":400,"y":1200,"color":"#bacb9a","rot":-1},{"id":"note_1776976481875","title":"DarkNews Sitesi","text":"URL: http://10.10.74.179:32780/\nKullanici: reporter\nSifre: news2024","x":600,"y":1200,"color":"#bacb9a","rot":-1}],"strings":[],"suspects":[]} | 2026-04-23 20:34:42.6188311 |

## Cases

Rows: 6

| Id | Title | Description | Story | Difficulty | TotalPoints | ImageUrl | IsActive | CreatedAt |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Siber Suikast: Şirket İçi Komplo | Bir teknoloji CEO'su evinde ölü bulundu. Tüm kanıtlar dijital dünyada... | John Smith, büyük bir teknoloji şirketinin CEO'su, evinde ölü bulundu. Güvenlik kameraları, bilgisayar logları ve şirket içi sistemler incelenmeli. Her ipucu sizi bir sonraki adıma götürecek. | 3 | 1500 |  | 1 | 2026-04-21 23:52:16.0878103 |
| 4 | Dijital Iz: Bir CTOnun Olumu | Siber guvenlik sirketinin CTOsu Marcus Webb ofisinde olu bulundu. | Marcus Webb, TechSecure sirketinin CTOsu, Sali sabahi ofisinde olu bulundu. Resmi aciklama kalp krizi. Ama IT departmani o gece sunucularda anormal aktiviteler fark etti. | 3 | 2000 |  | 1 | 2026-04-22 00:03:20.4389418 |
| 5 | 23:17den Sonra | Ic denetim uzmani Deniz Erkan, kilitli arsiv ofisinde olu bulundu. | 14 Nisan gecesi, Novacore Finansin 5. kat arsiv ofisinde calisan ic denetim uzmani Deniz Erkan olu bulunmustur. Odanin kapisi iceriden kilitliydi. Acik bilgisayarda tek bir cumle: Rozetim 23:17den sonra kullanildiysa, o ben degilim. | 2 | 2000 |  | 1 | 2026-04-22 00:03:20.5756729 |
| 6 | Golgede Iz: Argos Operasyonu | Bir muhbirin evinde bulunan kodlanmis not, kucuk bir lojistik sirketinin ic sistemlerine uzanan karanlik bir operasyonu gozler onune seriyor. | Bir muhbir, Argos Lojistik adli bir sirketin ic sistemlerinde yasadisi mal transferleri yapildigini ihbar etti. Muhbirin evinde bulunan tek ipucu:<br><br>aW50ZXJuYWxfc2hpcG1lbnRfcGFuZWw= | 3 | 2500 |  | 1 | 2026-04-22 00:03:20.6995583 |
| 7 | CEO SÜİKASTİ | Bir teknoloji şirketinin CEO’su ofisinde öldürülür.<br>Kapıdan uzanan bir kol silah sıkar. | saldırganın kolunda özel bir dövme var<br>bu dövme sadece şirket kurucusunun ailesinde bulunuyor | 2 | 1000 |  | 1 | 2026-04-22 00:34:46.7527041 |
| 8 | Kan ve Kod: CEO Suikasti | Bir sirketin CEOsu ofisinde olduruldu. Saldirganin kolunda ozel bir aile armasi dovmesi goruldu. | Novatek Teknoloji CEOsu Ahmet Yilmaz, Carsamba gunu ofisinde vurularak olduruldu. Guvenlik kamerasi kaydinda kapidan uzanan bir kol ve kolda ozel bir aile armasi dovmesi goruldu. Bu dovme sadece sirket kurucusunun ailesinde bulunuyor.<br><br>CEOnun masasinda bir kagit bulundu:<br><br>WTZwX3Bhc3NfMjAyNA==<br><br>Sorusturma basliyor. | 3 | 2000 |  | 1 | 2026-04-22 01:20:19.8277834 |

## Challenges

Rows: 28

| Id | CaseId | Title | Description | Category | Order | Points | Flag | RequiredChallengeId | HasVM | DockerImage | VMConnectionInfo | Files | Hints | UnlockContent | CreatedAt |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 1 | Güvenlik Kamerası Kaydı | Olay gecesi güvenlik kamerası kaydını analiz edin. Video dosyasında şüpheli bir kişi görülüyor. Kim olduğunu bulun. | OSINT | 1 | 100 | CTF{sarah_johnson_23:15} |  | 0 |  |  | [{"name":"security_cam_23_00.mp4","url":"/evidence/case1/security_cam.mp4","type":"video"}] | [{"Text":"Kamera kaydının 23:15 dakikasına dikkat edin","PenaltyPercent":10},{"Text":"Şüpheli kişinin yaka kartına bakın","PenaltyPercent":25}] | {"reportSection":{"title":"ŞÜPHELİ TESPİT EDİLDİ","type":"suspect","content":"Güvenlik kamerası analizi sonucunda 23:15'te binaya giren kişi tespit edildi. Yaka kartında 'Sarah Johnson - CFO' yazmaktadır. Şirketin mali işlerinden sorumlu olan Johnson, olay gecesi binada bulunduğunu inkâr etmişti."},"boardSuspect":{"name":"Sarah Johnson","role":"CFO","motive":"Henüz belirsiz — mali kayıtlar incelenmeli"}} | 2026-04-21 23:52:16.0878363 |
| 2 | 1 | Sistem Log Analizi | Maktulün bilgisayarından alınan sistem loglarını inceleyin. Şüpheli aktiviteler var. | Forensics | 2 | 150 | CTF{192.168.1.100_unauthorized_access} | 1 | 0 |  |  | [{"name":"system.log","url":"/evidence/case1/system.log","type":"document"}] | [{"Text":"grep komutuyla 'FAILED' kelimesini arayın","PenaltyPercent":10},{"Text":"192.168.1.x aralığındaki IP'lere bakın","PenaltyPercent":20}] | {"reportSection":{"title":"YETKİSİZ ERİŞİM TESPİT EDİLDİ","type":"evidence","content":"Sistem logları incelendi. 192.168.1.100 IP adresinden gece 23:10-23:22 arasında CEO'nun bilgisayarına 14 başarısız giriş denemesi yapılmış, ardından 23:23'te erişim sağlanmıştır. Bu IP adresi şirket içi ağa aittir."},"boardNote":{"title":"Kritik IP: 192.168.1.100","text":"23:10-23:22 arası 14 başarısız giriş\n23:23'te erişim sağlandı\nŞirket içi ağ — kimin bilgisayarı?"}} | 2026-04-21 23:52:16.0878539 |
| 3 | 1 | Şirket SSH Sunucusu | 192.168.1.100 adresindeki SSH sunucusuna erişim sağlayın. Çalışan kayıtlarına ulaşın. | Web | 3 | 250 | CTF{employee_access_granted} | 2 | 1 | detectivectf/ssh-target:latest | {"port":22,"username":"admin","hint":"Default credentials"} |  | [{"Text":"Varsayılan şifreler genellikle admin:admin veya admin:password olur","PenaltyPercent":15},{"Text":"SSH bağlantısı için: ssh admin@192.168.1.100","PenaltyPercent":30}] | {"reportSection":{"title":"ÇALIŞAN KAYITLARINA ERİŞİLDİ","type":"document","content":"SSH sunucusuna erişim sağlandı. Çalışan kayıtları incelendi. Sarah Johnson'ın bilgisayarına (192.168.1.100) olay gecesi 23:10'da uzaktan bağlandığı tespit edildi. Ayrıca 'financial_report_Q3_DELETED.xlsx' adlı silinmiş bir dosya bulundu."},"boardNote":{"title":"Silinmiş Dosya Bulundu","text":"financial_report_Q3_DELETED.xlsx\nSilme tarihi: Olay gecesi 23:25\nKim sildi: s.johnson"}} | 2026-04-21 23:52:16.0878628 |
| 4 | 1 | Şifreli Email Mesajı | Maktulün email hesabında şifreli bir mesaj bulundu. Şifreyi çözün. | Crypto | 4 | 200 | CTF{financial_fraud_exposed} | 3 | 0 |  |  | [{"name":"encrypted_email.txt","url":"/evidence/case1/encrypted.txt","type":"document"}] | [{"Text":"Caesar cipher ile şifrelenmiş olabilir","PenaltyPercent":10},{"Text":"ROT13 deneyin","PenaltyPercent":25}] | {"reportSection":{"title":"ŞİFRELİ MESAJ ÇÖZÜLDÜ — MALİ DOLANDIRICILIK","type":"evidence","content":"Şifreli email çözüldü. Mesaj içeriği: 'John her şeyi biliyor. Q3 raporunu imha et, yoksa ikimiz de biteriz. — S.J.' Mesaj, Sarah Johnson'ın kişisel email hesabından CEO'nun özel asistanı Michael Reed'e gönderilmiştir. Gönderim tarihi: Olay gününden 3 saat önce."},"boardNote":{"title":"Şifreli Mesaj İçeriği","text":"Gönderen: s.johnson@şirket.com\nAlıcı: m.reed@şirket.com\n'John her şeyi biliyor. ...[TRUNCATED in md; CSV has full value] | 2026-04-21 23:52:16.0878709 |
| 5 | 1 | Katili Tespit Et | Tüm delilleri topladınız. Şimdi katili bulma zamanı. Katilin tam adını girin. | Final | 5 | 800 | CTF{Sarah_Johnson} | 4 | 0 |  |  |  | [{"Text":"Güvenlik kamerasında gördüğünüz kişiyi hatırlayın","PenaltyPercent":20}] | {"reportSection":{"title":"DAVA KAPATILDI — KATİL TESPİT EDİLDİ","type":"suspect","content":"Tüm dijital deliller Sarah Johnson'ı işaret etmektedir. Güvenlik kamerası kaydı, sistem logları, SSH erişim kayıtları ve şifreli email mesajı birlikte değerlendirildiğinde Johnson'ın CEO John Smith'i mali dolandırıcılığını örtbas etmek amacıyla öldürdüğü sonucuna varılmıştır. Tutuklama kararı çıkarıldı."}} | 2026-04-21 23:52:16.0878802 |
| 8 | 4 | Sosyal Medya Analizi | Marcus Webbin LinkedIn profilini analiz edin. Olumunden 48 saat once supheyli bir kisiyle iletisime gecmis. O kisinin kullanici adini bulun. | OSINT | 1 | 100 | CTF{@d4rk_h4ck3r_99} |  | 0 |  |  |  |  | {"reportSection":{"title":"SUPHEYLI DIJITAL TEMAS","type":"evidence","content":"@d4rk_h4ck3r_99 kullanicisiyla DM trafigi tespit edildi. Hesap olumden sonra silindi."},"boardNote":{"title":"Supheyli Hesap","text":"@d4rk_h4ck3r_99\nHesap olumden sonra silindi"}} | 2026-04-22 00:05:33.5141611 |
| 9 | 4 | Email Analizi | Marcus un is emaillerinden bir .eml dosyasi ele gecirildi. Base64 encoded attachment incelenmeli. | Forensics | 2 | 150 | CTF{m33t_m3_4t_m1dn1ght} | 8 | 0 |  |  |  |  | {"reportSection":{"title":"GIZLI BULUSMA MESAJI","type":"document","content":"Sifreli email cozuldu: Gece yarisi depoda buluş. Gonderici: elena.v@protonmail.com"},"boardSuspect":{"name":"Elena Vasquez","role":"Rakip sirket ajani","motive":"Henuz belirsiz"}} | 2026-04-22 00:05:33.5336021 |
| 10 | 4 | Sirket Web Sunucusu | Sirketin eski web sunucusuna erisin. SQL injection ile admin bypass. | Web | 3 | 250 | CTF{pr0j3ct_ph03n1x_d3l3t3d} | 9 | 0 |  |  |  |  | {"reportSection":{"title":"SILINEN PROJE BULUNDU","type":"evidence","content":"Project Phoenix adli dosya olumden 1 saat once silindi."}} | 2026-04-22 00:05:33.5509561 |
| 11 | 4 | Sifreli Email | Maktulun email hesabinda sifreli mesaj. ROT13 veya Caesar cipher. | Crypto | 4 | 200 | CTF{financial_fraud_exposed} | 10 | 0 |  |  |  |  | {"reportSection":{"title":"MALI DOLANDIRICILIK","type":"evidence","content":"Sifreli mesaj cozuldu: John her seyi biliyor. Q3 raporunu imha et."}} | 2026-04-22 00:05:33.5666804 |
| 12 | 4 | Katili Tespit Et | Tum delilleri topladınız. Katilin tam adini girin. | Final | 5 | 800 | CTF{Sarah_Johnson} | 11 | 0 |  |  |  |  | {"reportSection":{"title":"DAVA KAPATILDI","type":"suspect","content":"Sarah Johnson tutuklandı."}} | 2026-04-22 00:05:33.5835776 |
| 13 | 5 | Acik Bilgisayar | aW50ZXJuYWxfc2hpcG1lbnRfcGFuZWw= - Base64 coz, B dolabinin kodunu bul. | Forensics | 1 | 100 | CTF{LOCKER-B:8742} |  | 0 |  |  |  |  | {"reportSection":{"title":"ROZET ARKASINDA KOD","type":"evidence","content":"QR etiket cozuldu: LOCKER-B:8742"},"boardNote":{"title":"B Dolabi Kodu","text":"Kod: 8742"}} | 2026-04-22 00:06:12.5372977 |
| 14 | 5 | Gece Vardiyasi Arsivi | nightshift.zip sifre korumalı. Okan Aksunun acik kaynak bilgileri: kosu kulubu takim no 17, kopek adi Atlas. | OSINT | 2 | 150 | CTF{atlas17} | 13 | 0 |  |  |  |  | {"reportSection":{"title":"ARSIV ACILDI","type":"document","content":"Parola: atlas17 (Okan Aksu - takim 17 + kopek Atlas)"},"boardSuspect":{"name":"Okan Aksu","role":"Operasyon Muduru","motive":"Arsiv erisimi"}} | 2026-04-22 00:06:12.5504638 |
| 15 | 5 | Giris Kaydi Analizi | entry_log.csv: 23:17 oda kilitlendi, 23:21 DZ-8821 rozeti tekrar kullanildi. Kritik tutarsizligi bul. | Forensics | 3 | 200 | CTF{23:21_rozet_kullanildi} | 14 | 0 |  |  |  |  | {"reportSection":{"title":"OLUM SONRASI ROZET","type":"evidence","content":"23:17 oda kilitlendi. 23:21 maktulun rozeti tekrar kullanildi."}} | 2026-04-22 00:06:12.5605392 |
| 16 | 5 | Kayip Token | Arsiv paneli: o.aksu / roof-17-open. lost_token_ticket.txt - Burak tokenini kaybetmisti. | Web | 4 | 200 | CTF{ticket_7741} | 15 | 0 |  |  |  |  | {"reportSection":{"title":"TEKNIK IZ SAPTIRMA","type":"document","content":"Burak tokenini kaybettigini bildirmisti (Ticket 7741). Biri kasitli iz birakti."}} | 2026-04-22 00:06:12.5719456 |
| 17 | 5 | Otopark Fisi | garage_ticket.jpg: 06 OA 3_7 plaka 23:26da North Garagea girdi. Park izin kayitlari: Okan Aksu - 06 OA 317. | OSINT | 5 | 200 | CTF{06OA317_okan_geri_dondu} | 16 | 0 |  |  |  |  | {"reportSection":{"title":"ALIBI COKTU","type":"suspect","content":"06 OA 317 plaka 23:26da geri dondu. Okan sehir disinda degildi."}} | 2026-04-22 00:06:12.5831874 |
| 18 | 5 | Sifreli Son Not | final_note.enc - OpenSSL AES. Parola: otopark fisindeki plaka (bosluksuz). | Crypto | 6 | 250 | CTF{06OA317} | 17 | 0 |  |  |  |  | {"reportSection":{"title":"FINAL NOT ACILDI","type":"document","content":"Tum parcalar Okan Aksuda birlesıyor."}} | 2026-04-22 00:06:12.5932772 |
| 19 | 5 | 23:17den Sonra Geri Donen | Katili tam adiyla girin. | Final | 7 | 750 | CTF{Okan_Aksu} | 18 | 0 |  |  |  |  | {"reportSection":{"title":"DAVA KAPATILDI","type":"suspect","content":"Okan Aksu tutuklandı."}} | 2026-04-22 00:06:12.601905 |
| 20 | 6 | Kodlanmis Not | aW50ZXJuYWxfc2hpcG1lbnRfcGFuZWw= - Base64 coz. | Crypto | 1 | 100 | flag{internal_shipment_panel} |  | 0 |  |  |  |  | {"reportSection":{"title":"OLAY YERI NOTU","type":"evidence","content":"Cozuldu: internal_shipment_panel. Sirket: Argos Lojistik. Giris: field.agent / case123"},"boardNote":{"title":"Argos Portal","text":"field.agent / case123\nIDOR: /api/shipment?id="}} | 2026-04-22 00:06:44.9123722 |
| 21 | 6 | Argos Sevkiyat Portali | Makineyi baslat, web sitesini ac.\nGiris: field.agent / case123\nIDOR: /api/shipment?id= parametresini degistir, id=19 kaydi bul. | Web | 2 | 250 | flag{sevkiyat_kaydi_sizdirildi} | 20 | 1 | argos/portal:latest |  |  |  | {"reportSection":{"title":"SEVKIYAT 19","type":"document","content":"kerem.ates / WH-19 / shadow-ledger moved to archive node"},"boardSuspect":{"name":"Kerem Ates","role":"Argos Lojistik","motive":"Yasadisi transfer"}} | 2026-04-22 00:06:44.926205 |
| 22 | 6 | Arsiv SSH | ssh ops_archive@<IP> / Wh19Archive!\ncat /opt/shadow-ledger/config.json | Network | 3 | 300 | flag{ic_servis_bilgisi_bulundu} | 21 | 1 | argos/ssh-target:latest |  |  |  | {"reportSection":{"title":"SHADOW LEDGER","type":"evidence","content":"API Key: SL-archive-ops-2931\nDashboard: http://172.22.0.20:8080"}} | 2026-04-22 00:06:44.9410365 |
| 23 | 6 | Shadow Ledger Dashboard | Makineyi baslat, web sitesini ac.\nSQL Injection: username = admin OR 1=1 --\nFinans kayitlarinda flag var. | Web | 4 | 400 | flag{shadow_ledger_cozuldu} | 22 | 1 | argos/sqli-login:latest |  |  |  | {"reportSection":{"title":"MALI ANALIZ","type":"suspect","content":"K.A. onayli transferler. Harbor Chain / WH19-A. Kostebek: Kerem Ates"}} | 2026-04-22 00:06:44.9532755 |
| 24 | 6 | Icerdeki Kostebek | Tum deliller toplandı. Icerdeki kostebek kim? (kucuk harf, alt cizgi) | Final | 5 | 1000 | flag{kerem_ates_kostebek} | 23 | 0 |  |  |  |  | {"reportSection":{"title":"OPERASYON KAPATILDI","type":"suspect","content":"Kerem Ates tutuklandı."}} | 2026-04-22 00:06:44.967439 |
| 25 | 7 | CEO nun şifresi ne | kağıtta random ifadeler var kriptolu olabilir | OSINT | 1 | 100 | CTF{password1234!} |  | 0 |  |  |  |  |  | 2026-04-22 00:38:28.5606517 |
| 26 | 8 | Masadaki Kagit | CEOnun masasinda bulunan kagit:<br><br>WTZwX3Bhc3NfMjAyNA==<br><br>Base64 ile coz. Sonuc CEOnun SSH sifresi. | Crypto | 1 | 100 | flag{ceo_pass_d3c0d3d} |  | 0 |  |  |  | [{"Text":"echo WTZwX3Bhc3NfMjAyNA== \| base64 -d","PenaltyPercent":15}] | {"reportSection":{"title":"CEO SIFRESI BULUNDU","type":"evidence","content":"Base64 cozuldu: ceo_pass_2024\nSSH: ceo / ceo_pass_2024"},"boardNote":{"title":"CEO SSH","text":"Kullanici: ceo\nSifre: ceo_pass_2024"}} | 2026-04-22 01:21:18.1393495 |
| 27 | 8 | CEOnun Makinesi | Makineyi baslat.<br><br>Nmap ile tara:<br>nmap -sV <IP><br><br>SSH ile baglan:<br>ssh ceo@<IP> -p <PORT><br>Sifre: ceo_pass_2024<br><br>Makinede note.txt ve traffic.pcap dosyalari var.<br>Flag note.txt icinde. | Network | 2 | 200 | flag{ssh_access_granted} | 26 | 1 | ceo/ssh-target:latest |  |  | [{"Text":"ssh ceo@<IP> -p <PORT> / sifre: ceo_pass_2024","PenaltyPercent":15}] | {"reportSection":{"title":"CEO MAKINESINE ERISIM","type":"evidence","content":"CEO makinesine erisim saglandi.\nnote.txt: K.A. bu isin icinde. darknews sitesi.\ntraffic.pcap: Dis site trafigi tespit edildi."},"boardNote":{"title":"DarkNews Sitesi","text":"URL: http://10.10.74.179:32780/\nKullanici: reporter\nSifre: news2024"}} | 2026-04-22 01:21:18.8360645 |

_Showing 25 of 28 rows in markdown. CSV contains all rows._

## Evidences

Rows: 3

| Id | ChallengeId | Title | Type | FileUrl | Description | Metadata | Order |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 1 | Güvenlik Kamerası - Ana Giriş | video | /evidence/case1/cam1_23_00.mp4 | 23:00-23:30 arası ana giriş kamera kaydı | {"duration":"30:00","resolution":"1920x1080","fps":30} | 1 |
| 2 | 1 | Güvenlik Kamerası - Otopark | video | /evidence/case1/cam2_23_00.mp4 | 23:00-23:30 arası otopark kamera kaydı | {"duration":"30:00","resolution":"1280x720","fps":25} | 2 |
| 3 | 2 | Sistem Access Log | document | /evidence/case1/access.log | Son 24 saatin sistem erişim kayıtları |  | 1 |

## TeamCaseProgresses

Rows: 0

| Id | TeamId | CaseId | IsCompleted | Score | StartedAt | CompletedAt |
| --- | --- | --- | --- | --- | --- | --- |

## TeamMembers

Rows: 2

| Id | TeamId | UserId | Role | JoinedAt |
| --- | --- | --- | --- | --- |
| 1 | 1 | 7 | Network | 2026-04-23 20:29:42.0695565 |
| 2 | 1 | 6 | Forensics | 2026-04-23 20:29:50.8088219 |

## Teams

Rows: 1

| Id | Name | Description | LeaderId | MaxMembers | TotalScore | IsActive | InviteCode | CreatedAt |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | cyber red | salsdırgan beyaz team | 7 | 4 | 300 | 1 | 3TB5H7 | 2026-04-23 20:29:41.987497 |

## UserCaseProgresses

Rows: 0

| Id | UserId | CaseId | IsCompleted | Score | StartedAt | CompletedAt | HackedSystemIds | DiscoveredClueIds |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |

## UserChallengeProgresses

Rows: 10

| Id | UserId | ChallengeId | TeamId | IsSolved | Attempts | SolvedAt | StartedAt | AssignedVMId | VMConnectionDetails | UsedHints |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 31 | 1 | 26 |  | 1 | 1 | 2026-04-23 15:39:23.8100916 | 2026-04-23 15:39:23.7931127 |  |  |  |
| 32 | 1 | 27 |  | 1 | 1 | 2026-04-23 17:14:16.2388023 | 2026-04-23 16:08:04.7485058 | ff6bcbe4904af63e46fa155a7ed0435cbfe0d809b1ef493ffd046bc9764bc470 | {"ip":"10.10.74.179","port":32798} |  |
| 33 | 1 | 28 |  | 1 | 2 | 2026-04-23 17:16:28.5830592 | 2026-04-23 17:15:19.250514 |  |  | [0] |
| 34 | 1 | 29 |  | 0 | 0 |  | 2026-04-23 17:16:47.9018183 | 0fc0ef4537bc922d9eeb62ba60775974cc4783817a09ac347d44cdcc749ef1e2 | {"ip":"10.10.74.179","port":32769} |  |
| 35 | 5 | 27 |  | 1 | 1 | 2026-04-23 18:54:44.5326554 | 2026-04-23 18:49:56.1542262 | ccbb05b054bb5a149bdd0cc2c2be4a166d3712b918fc0e08754780fbe7299ee8 | {"ip":"10.10.74.179","port":32771} |  |
| 36 | 5 | 26 |  | 1 | 1 | 2026-04-23 18:54:23.2155588 | 2026-04-23 18:54:23.2142411 |  |  |  |
| 37 | 7 | 26 |  | 1 | 3 | 2026-04-23 20:31:52.3645554 | 2026-04-23 20:30:58.4404747 |  |  |  |
| 38 | 6 | 26 | 1 | 1 | 0 | 2026-04-23 20:31:52.4080932 | 2026-04-23 20:31:52.4080912 |  |  |  |
| 39 | 6 | 27 |  | 1 | 1 | 2026-04-23 20:34:42.5803597 | 2026-04-23 20:34:42.5800702 |  |  |  |
| 40 | 7 | 27 | 1 | 1 | 1 | 2026-04-23 20:34:42.5844922 | 2026-04-23 20:34:42.5844912 |  |  |  |

## Users

Rows: 4

| Id | Username | Email | PasswordHash | TotalScore | IsAdmin | PreferredRole | CreatedAt |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | admin | admin@detectivectf.com | [MASKED] | 1270 | 1 |  | 2026-04-21 23:52:16.0875806 |
| 5 | taha | taha@gmail.com | [MASKED] | 300 | 0 |  | 2026-04-23 18:48:24.4877326 |
| 6 | test | test@test | [MASKED] | 200 | 0 |  | 2026-04-23 20:28:50.8397763 |
| 7 | Cyber | asdasd@gmail.com | [MASKED] | 100 | 0 |  | 2026-04-23 20:29:15.593297 |

## VMInstances

Rows: 6

| Id | ChallengeId | UserId | TeamId | ContainerId | ContainerName | IPAddress | Port | Status | CreatedAt | ExpiresAt |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 54 | 27 | 1 |  | ff6bcbe4904af63e46fa155a7ed0435cbfe0d809b1ef493ffd046bc9764bc470 | ctf_27_u1_7332f9 | 10.10.74.179 | 32798 | running | 2026-04-23 16:08:04.7052537 | 2026-04-23 18:08:04.7054267 |
| 55 |  | 1 |  | 372a2449e069463d704945642a0fc239ef2e67b4bf762ad338fa6c91ac16e500 | ctf_terminal_u1_0f7c0c | 10.10.74.179 | 32799 | running | 2026-04-23 16:08:05.5957434 | 2026-04-23 18:08:05.5957446 |
| 56 | 29 | 1 |  | 7306e07c6eb3a5fb12f32d907b870435bf01a61215e8daf42f668d2d30124495 | ctf_29_u1_d61df4 | 10.10.74.179 | 32800 | stopped | 2026-04-23 17:16:47.8893108 | 2026-04-23 19:16:47.8893138 |
| 57 |  | 1 |  | a9f45663d15592dbe9a55d84f0f1d26bf558f61e18490c677dccfdad63da3aff | ctf_terminal_u1_db13f6 | 10.10.74.179 | 32801 | running | 2026-04-23 17:16:49.0798986 | 2026-04-23 19:16:49.0799012 |
| 58 | 29 | 1 |  | 0fc0ef4537bc922d9eeb62ba60775974cc4783817a09ac347d44cdcc749ef1e2 | ctf_29_u1_a5a0ff | 10.10.74.179 | 32769 | running | 2026-04-23 18:46:19.0503975 | 2026-04-23 20:46:19.0532307 |
| 59 | 27 | 5 |  | ccbb05b054bb5a149bdd0cc2c2be4a166d3712b918fc0e08754780fbe7299ee8 | ctf_27_u5_8c8363 | 10.10.74.179 | 32771 | running | 2026-04-23 18:49:56.1491455 | 2026-04-23 20:49:56.1491466 |
