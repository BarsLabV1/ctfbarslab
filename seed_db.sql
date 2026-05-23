USE DetectiveCTFDb;
GO

-- Clean up existing data to prevent duplicate key errors
DELETE FROM Evidences;
DELETE FROM UserChallengeProgresses;
DELETE FROM VMInstances;
DELETE FROM Challenges;
DELETE FROM BoardCards;
DELETE FROM Cases;
DELETE FROM Users;

-- Seed Admin User
SET IDENTITY_INSERT Users ON;
INSERT INTO Users (Id, Username, Email, PasswordHash, IsAdmin, TotalScore, CreatedAt)
VALUES (1, N'admin', N'admin@detectivectf.com', N'$2a$11$b6l.bF18V5hP0hWqW1.SseXv0Zk6N6M6tG0aG7nJ7yF6uD7sC8G3e', 1, 0, GETUTCDATE());
SET IDENTITY_INSERT Users OFF;

-- Seed Case
SET IDENTITY_INSERT Cases ON;
INSERT INTO Cases (Id, Title, Description, Story, Difficulty, TotalPoints, ImageUrl, IsActive, CreatedAt, HasVM, DockerImage, Domain)
VALUES (1, N'Siber Suikast: Şirket İçi Komplo', N'Bir teknoloji CEO''su evinde ölü bulundu. Tüm kanıtlar dijital dünyada...', N'John Smith, büyük bir teknoloji şirketinin CEO''su, evinde ölü bulundu. Güvenlik kameraları, bilgisayar logları ve şirket içi sistemler incelenmeli. Her ipucu sizi bir sonraki adıma götürecek.', 3, 1500, N'', 1, GETUTCDATE(), 0, NULL, NULL);
SET IDENTITY_INSERT Cases OFF;

-- Seed Challenges (explicitly inserting IDs to set up parent/child dependencies)
SET IDENTITY_INSERT Challenges ON;

-- Challenge 1: OSINT
INSERT INTO Challenges (Id, CaseId, Title, Description, Category, [Order], Points, Flag, HasVM, DockerImage, Hints, UnlockContent, CreatedAt, RequiredChallengeId, Files, VMConnectionInfo)
VALUES (1, 1, N'Güvenlik Kamerası Kaydı', N'Olay gecesi güvenlik kamerası kaydını analiz edin. Video dosyasında şüpheli bir kişi görülüyor. Kim olduğunu bulun.', N'OSINT', 1, 100, N'CTF{sarah_johnson_23:15}', 0, NULL, 
N'[{"Text":"Kamera kaydının 23:15 dakikasına dikkat edin","PenaltyPercent":10},{"Text":"Şüpheli kişinin yaka kartına bakın","PenaltyPercent":25}]',
N'{"reportSection":{"title":"ŞÜPHELİ TESPİT EDİLDİ","type":"suspect","content":"Güvenlik kamerası analizi sonucunda 23:15''te binaya giren kişi tespit edildi. Yaka kartında ''Sarah Johnson - CFO'' yazmaktadır. Şirketin mali işlerinden sorumlu olan Johnson, olay gecesi binada bulunduğunu inkâr etmişti."},"boardSuspect":{"name":"Sarah Johnson","role":"CFO","motive":"Henüz belirsiz — mali kayıtlar incelenmeli"}}',
GETUTCDATE(), NULL, N'[{"name":"security_cam_23_00.mp4","url":"/evidence/case1/security_cam.mp4","type":"video"}]', NULL);

-- Challenge 2: Forensics
INSERT INTO Challenges (Id, CaseId, Title, Description, Category, [Order], Points, Flag, HasVM, DockerImage, Hints, UnlockContent, CreatedAt, RequiredChallengeId, Files, VMConnectionInfo)
VALUES (2, 1, N'Sistem Log Analizi', N'Maktulün bilgisayarından alınan sistem loglarını inceleyin. Şüpheli aktiviteler var.', N'Forensics', 2, 150, N'CTF{192.168.1.100_unauthorized_access}', 0, NULL,
N'[{"Text":"grep komutuyla ''FAILED'' kelimesini arayın","PenaltyPercent":10},{"Text":"192.168.1.x aralığındaki IP''lere bakın","PenaltyPercent":20}]',
N'{"reportSection":{"title":"YETKİSİZ ERİŞİM TESPİT EDİLDİ","type":"evidence","content":"Sistem logları incelendi. 192.168.1.100 IP adresinden gece 23:10-23:22 arasında CEO''nun bilgisayarına 14 başarısız giriş denemesi yapılmış, ardından 23:23''te erişim sağlanmıştır. Bu IP adresi şirket içi ağa aittir."},"boardNote":{"title":"Kritik IP: 192.168.1.100","text":"23:10-23:22 arası 14 başarısız giriş\n23:23''te erişim sağlandı\nŞirket içi ağ — kimin bilgisayarı?"}}',
GETUTCDATE(), 1, N'[{"name":"system.log","url":"/evidence/case1/system.log","type":"document"}]', NULL);

-- Challenge 3: Web
INSERT INTO Challenges (Id, CaseId, Title, Description, Category, [Order], Points, Flag, HasVM, DockerImage, Hints, UnlockContent, CreatedAt, RequiredChallengeId, Files, VMConnectionInfo)
VALUES (3, 1, N'Şirket SSH Sunucusu', N'192.168.1.100 adresindeki SSH sunucusuna erişim sağlayın. Çalışan kayıtlarına ulaşın.', N'Web', 3, 250, N'CTF{employee_access_granted}', 1, N'detectivectf/ssh-target:latest',
N'[{"Text":"Varsayılan şifreler genellikle admin:admin veya admin:password olur","PenaltyPercent":15},{"Text":"SSH bağlantısı için: ssh admin@192.168.1.100","PenaltyPercent":30}]',
N'{"reportSection":{"title":"ÇALIŞAN KAYITLARINA ERİŞİLDİ","type":"document","content":"SSH sunucusuna erişim sağlandı. Çalışan kayıtları incelendi. Sarah Johnson''ın bilgisayarına (192.168.1.100) olay gecesi 23:10''da uzaktan bağlandığı tespit edildi. Ayrıca ''financial_report_Q3_DELETED.xlsx'' adlı silinmiş bir dosya bulundu."},"boardNote":{"title":"Silinmiş Dosya Bulundu","text":"financial_report_Q3_DELETED.xlsx\nSilme tarihi: Olay gecesi 23:25\nKim sildi: s.johnson"}}',
GETUTCDATE(), 2, NULL, N'{"port":22,"username":"admin","hint":"Default credentials"}');

-- Challenge 4: Crypto
INSERT INTO Challenges (Id, CaseId, Title, Description, Category, [Order], Points, Flag, HasVM, DockerImage, Hints, UnlockContent, CreatedAt, RequiredChallengeId, Files, VMConnectionInfo)
VALUES (4, 1, N'Şifreli Email Mesajı', N'Maktulün email hesabında şifreli bir mesaj bulundu. Şifreyi çözün.', N'Crypto', 4, 200, N'CTF{financial_fraud_exposed}', 0, NULL,
N'[{"Text":"Caesar cipher ile şifrelenmiş olabilir","PenaltyPercent":10},{"Text":"ROT13 deneyin","PenaltyPercent":25}]',
N'{"reportSection":{"title":"ŞİFRELİ MESAJ ÇÖZÜLDÜ — MALİ DOLANDIRICILIK","type":"evidence","content":"Şifreli email çözüldü. Mesaj içeriği: ''John her şeyi biliyor. Q3 raporunu imha et, yoksa ikimiz de biteriz. — S.J.'' Mesaj, Sarah Johnson''ın kişisel email hesabından CEO''nun özel asistanı Michael Reed''e gönderilmiştir. Gönderim tarihi: Olay gününden 3 saat önce."},"boardNote":{"title":"Şifreli Mesaj İçeriği","text":"Gönderen: s.johnson@şirket.com\nAlıcı: m.reed@şirket.com\n''John her şeyi biliyor. Q3 raporunu imha et''\nGönderim: Olay gününden 3 saat önce"}}',
GETUTCDATE(), 3, N'[{"name":"encrypted_email.txt","url":"/evidence/case1/encrypted.txt","type":"document"}]', NULL);

-- Challenge 5: Final
INSERT INTO Challenges (Id, CaseId, Title, Description, Category, [Order], Points, Flag, HasVM, DockerImage, Hints, UnlockContent, CreatedAt, RequiredChallengeId, Files, VMConnectionInfo)
VALUES (5, 1, N'Katili Tespit Et', N'Tüm delilleri topladınız. Şimdi katili bulma zamanı. Katilin tam adını girin.', N'Final', 5, 800, N'CTF{Sarah_Johnson}', 0, NULL,
N'[{"Text":"Güvenlik kamerasında gördüğünüz kişiyi hatırlayın","PenaltyPercent":20}]',
N'{"reportSection":{"title":"DAVA KAPATILDI — KATİL TESPİT EDİLDİ","type":"suspect","content":"Tüm dijital deliller Sarah Johnson''ı işaret etmektedir. Güvenlik kamerası kaydı, sistem logları, SSH erişim kayıtları ve şifreli email mesajı birlikte değerlendirildiğinde Johnson''ın CEO John Smith''i mali dolandırıcılığını örtbas etmek amacıyla öldürdüğü sonucuna varılmıştır. Tutuklama kararı çıkarıldı."}}',
GETUTCDATE(), 4, NULL, NULL);

SET IDENTITY_INSERT Challenges OFF;

-- Seed Evidences
SET IDENTITY_INSERT Evidences ON;
INSERT INTO Evidences (Id, ChallengeId, Title, Type, FileUrl, Description, Metadata, [Order])
VALUES (1, 1, N'Güvenlik Kamerası - Ana Giriş', N'video', N'/evidence/case1/cam1_23_00.mp4', N'23:00-23:30 arası ana giriş kamera kaydı', N'{"duration":"30:00","resolution":"1920x1080","fps":30}', 1);

INSERT INTO Evidences (Id, ChallengeId, Title, Type, FileUrl, Description, Metadata, [Order])
VALUES (2, 1, N'Güvenlik Kamerası - Otopark', N'video', N'/evidence/case1/cam2_23_00.mp4', N'23:00-23:30 arası otopark kamera kaydı', N'{"duration":"30:00","resolution":"1280x720","fps":25}', 2);

INSERT INTO Evidences (Id, ChallengeId, Title, Type, FileUrl, Description, Metadata, [Order])
VALUES (3, 2, N'Sistem Access Log', N'document', N'/evidence/case1/access.log', N'Son 24 saatin sistem erişim kayıtları', NULL, 1);
SET IDENTITY_INSERT Evidences OFF;
