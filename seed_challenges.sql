INSERT INTO Challenges (CaseId, Title, Description, Category, [Order], Points, Flag, HasVM, DockerImage, Hints, UnlockContent, CreatedAt)
VALUES
(1, N'Şifreli Not', N'CEO''nun masasında Base64 ile şifrelenmiş bir not bulundu. Şifreyi çöz ve CEO''nun bilgisayar şifresini bul. Not: Y2VvX3A0c3NfNGhtM3QyMDI0', N'Crypto', 1, 100, N'flag{c30_p4ss_4hm3t2024}', 0, NULL,
N'[{"Text":"Base64 decode araci kullan","PenaltyPercent":10},{"Text":"CyberChef sitesini dene","PenaltyPercent":20}]',
N'{"reportSection":{"title":"SIFRELI NOT COZULDU","type":"evidence","content":"Not cozuldu: CEO bilgisayar sifresi bulundu. Bir sonraki adim: SSH ile CEO makinesine baglan."}}',
GETUTCDATE()),

(1, N'CEO Makinesine Eris', N'Makineyi baslatip SSH ile baglan. Kullanici adi: ceo, Sifre: ilk soruda buldugun sifre. Makinede traffic.pcap dosyasi var.', N'SSH', 2, 200, N'flag{ssh_4cc3ss_gr4nt3d}', 1, N'ceo/ssh-target:latest',
N'[{"Text":"ssh ceo@IP -p PORT komutunu kullan","PenaltyPercent":15},{"Text":"Sifre ilk soruda buldugun Base64 cozumu","PenaltyPercent":25}]',
N'{"reportSection":{"title":"CEO MAKINESINE ERILDI","type":"evidence","content":"Makinede traffic.pcap dosyasi bulundu. Ag trafigi analizi gerekiyor."}}',
GETUTCDATE()),

(1, N'Ag Trafigi Analizi', N'CEO makinesindeki traffic.pcap dosyasini analiz et. Wireshark ile supheli baglantilari bul ve saldirganlarin haberleme sitesini tespit et.', N'Forensics', 3, 300, N'flag{d4rkn3ws_l0c4l_f0und}', 0, NULL,
N'[{"Text":"Wireshark HTTP trafigine bak","PenaltyPercent":10},{"Text":"DNS sorgularini filtrele","PenaltyPercent":20}]',
N'{"reportSection":{"title":"HABERLEME SITESI TESPIT EDILDI","type":"evidence","content":"Trafik analizinde darknews.local adresine baglantilar tespit edildi."}}',
GETUTCDATE()),

(1, N'Zafiyetli Web Sitesi', N'Makineyi baslatip darknews sitesine eris. Sitede SQL injection acigi var. Admin paneline gir ve mesajlasmalari oku.', N'Web', 4, 400, N'flag{sql_1nj3ct10n_4dm1n}', 1, N'darknews/site:latest',
N'[{"Text":"Login formunda SQL injection dene","PenaltyPercent":15},{"Text":"Payload: admin OR 1=1--","PenaltyPercent":30}]',
N'{"reportSection":{"title":"MESAJLASMALAR OKUNDU","type":"evidence","content":"Mesajlarda suikastin K.A. (Kerem Ates) tarafindan organize edildigine dair kanitlar bulundu."}}',
GETUTCDATE()),

(1, N'Katili Bul', N'Tum delilleri topladın. Suikasti organize eden kisinin tam adini gir.', N'Final', 5, 500, N'flag{Kerem_Ates}', 0, NULL,
N'[{"Text":"Mesajlardaki bas harflere bak: K.A.","PenaltyPercent":20}]',
N'{"reportSection":{"title":"DAVA KAPATILDI","type":"suspect","content":"Tum dijital kanitlar Kerem Atesi isaret ediyor."}}',
GETUTCDATE());
