# docker_local_11433_container_layer

Server: localhost,11433
Database: DetectiveCTFDb
Note: Eski detectivectf-db-local container katmani


## Tables

| TABLE_SCHEMA | TABLE_NAME |
| --- | --- |
| dbo | __EFMigrationsHistory |
| dbo | ActiveInstances |
| dbo | BoardCards |
| dbo | BoardStates |
| dbo | Cases |
| dbo | Challenges |
| dbo | Evidences |
| dbo | TeamCaseProgresses |
| dbo | TeamMembers |
| dbo | Teams |
| dbo | UserCaseProgresses |
| dbo | UserChallengeProgresses |
| dbo | Users |
| dbo | VMInstances |

## dbo.__EFMigrationsHistory

Rows: 2

| MigrationId | ProductVersion |
| --- | --- |
| 20260423100359__init | 10.0.7 |
| 20260509133825_AddActiveInstances | 10.0.7 |

## dbo.ActiveInstances

Rows: 0

| Id | UserId | ContainerId | ContainerName | AssignedPort | VncUrl | CreatedAt | ExpiryDate | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |

## dbo.BoardCards

Rows: 0

| Id | CaseId | Type | Title | Content | FileUrl | ExternalUrl | DockerImage | PosX | PosY | Rotation | Color | UnlockedByChallenge | CreatedAt |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

## dbo.BoardStates

Rows: 4

| Id | CaseId | TeamId | UserId | StateJson | UpdatedAt |
| --- | --- | --- | --- | --- | --- |
| 1002 | 1 |  | 1002 | {} | 05/18/2026 18:09:18 |
| 1003 | 1 |  | 1002 | {} | 05/18/2026 18:09:18 |
| 1004 | 1 |  | 1002 | {} | 05/18/2026 18:09:18 |
| 2002 | 1 |  | 4 | {} | 05/19/2026 13:02:51 |

## dbo.Cases

Rows: 1

| Id | Title | Description | Story | Difficulty | TotalPoints | ImageUrl | IsActive | CreatedAt | DockerImage | Domain | HasVM |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Kirmizi Gece: Proje Sifir Cinayeti | Dedektiflik oyunu ile CTF hedef makinesini birleþtiren demo vaka. Görsel delillerden baþlayýp web keþfi, SQL injection, SSH eriþimi ve privilege escalation ile katili bul. | BarsLab dedektif ekibi, Orion Siber Güvenlik laboratuvarýndaki gece vardiyasý cinayetini inceliyor. Kurban Kerem, Proje Sýfýr isimli gizli bir CTF simülasyonunda kritik bir açýðý raporlamak üzereyken susturuldu. Kamera görüntüsü, silinen portal kayýtlarý ve hedef makinedeki izler ayný kiþiye iþaret ediyor. Vaka hedef makinesini baþlat, BarsBox üzerinden makineye baðlan, delilleri çöz ve finalde katilin adýný flag formatýnda teslim et. | 3 | 2100 | /evidence/kirmizi-gece/kamera-son-kare.svg | True | 05/18/2026 17:01:22 | barslab/kirmizi-gece:latest | portal.local | True |

## dbo.Challenges

Rows: 6

| Id | CaseId | Title | Description | Category | Order | Points | Flag | RequiredChallengeId | HasVM | DockerImage | VMConnectionInfo | Files | Hints | UnlockContent | CreatedAt | ImageUrl | PosX | PosY |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1002 | 1 | Kamera Son Karesi | Ýlk delil güvenlik kamerasýndan alýnan son kare. Görseldeki saat, rozet ve kýrmýzý iþaret vaka baþlangýç kodunu veriyor. Flag formatý: CTF{...} | OSINT | 1 | 200 | CTF{kamera_23_47} |  | False |  |  |  | [{"Text":"Görselin sað altýndaki zaman damgasýný oku.","PenaltyPercent":5},{"Text":"Flag küçük harfle kamera ve saati alt çizgiyle birleþtirir.","PenaltyPercent":10}] | {"boardNote":{"title":"Kamera notu","text":"Son kare 23:47 zamanýný ve M.K. rozetini gösteriyor."}} | 05/18/2026 17:55:27 | /evidence/kirmizi-gece/kamera-son-kare.svg | 120 | 120 |
| 1003 | 1 | Hedef Portal Keþfi | Vaka hedef makinesini baþlat. Sonra BarsBox/Kali masaüstünden verilen hedef IP adresindeki web portalýný tara. robots.txt ve internal-docs dizini ilk teknik flagi verir. | Web | 2 | 300 | CTF{z3r0_d4y_f0und} | 1002 | False |  |  |  | [{"Text":"Hedef IP web servisinde 80 portunu kontrol et.","PenaltyPercent":5},{"Text":"robots.txt çoðu zaman saklanan dizinleri ele verir.","PenaltyPercent":10}] | {"reportSection":{"title":"Portal keþfi","content":"internal-docs kayýtlarý Proje Sýfýr ve M.K. kýsaltmasýný doðruladý."}} | 05/18/2026 17:55:27 |  | 260 | 160 |
| 1004 | 1 | Portal Giriþi SQL Injection | Portal login ekranýnda Kerem’in hesabýna giden yolu bul. SQL injection ile paneli atlattýðýnda hem flag hem de SSH hesabý görünecek. | Web | 3 | 400 | CTF{sqli_portal_breached} | 1003 | False |  |  |  | [{"Text":"Login formu klasik tek týrnak enjeksiyonuna karþý savunmasýz.","PenaltyPercent":5},{"Text":"Kullanýcý alanýnda admin' OR '1'='1 tarzý bir deneme yap.","PenaltyPercent":12}] | {"boardSuspect":{"name":"Mert Kaya","role":"Eski proje lideri","motive":"Proje Sýfýr raporu yayýnlanýrsa ihmal kayýtlarý ortaya çýkacaktý."}} | 05/18/2026 17:55:27 |  | 420 | 220 |
| 1005 | 1 | Kerem Hesabýna SSH | SQL injection sonrasý görünen kimlik bilgileriyle hedef makineye SSH baðlan. Kerem kullanýcýsýnýn ev dizinindeki user flagi teslim et. | Linux | 4 | 350 | CTF{ssh_1ns1d3r} | 1004 | False |  |  |  | [{"Text":"Portal sonucu kullanýcý/parola bilgisini açýkça veriyor.","PenaltyPercent":5},{"Text":"SSH komutu BarsBox terminalinden hedef IP ile çalýþmalý: ssh kerem@HEDEF_IP","PenaltyPercent":10}] | {"reportSection":{"title":"Kerem hesabý","content":"Kerem hesabýndaki son rapor, backup-check adlý þüpheli aracý ve kýrmýzý imzayý anlatýyor."}} | 05/18/2026 17:55:27 |  | 560 | 280 |
| 1006 | 1 | Root Ýzleri | Kerem hesabýnda yerel privilege escalation izi var. SUID çalýþan backup-check aracýný incele, root flagini oku. | Privilege Escalation | 5 | 500 | CTF{r00t_0f_3v1l} | 1005 | False |  |  |  | [{"Text":"find / -perm -4000 -type f 2>/dev/null komutu olaðan dýþý SUID dosyalarý gösterir.","PenaltyPercent":8},{"Text":"backup-check aslýnda SUID bash kopyasý; -p parametresi ayrýcalýðý korur.","PenaltyPercent":15}] | {"boardNote":{"title":"Root bulgusu","text":"Root notu M.K. imzasýný ve Orion kimlik kartýný final deliline baðlýyor."}} | 05/18/2026 17:55:27 |  | 700 | 340 |
| 1007 | 1 | Katili Bul | Tüm delilleri birleþtir: kamera rozetindeki baþ harfler, portal kayýtlarý, Kerem raporu ve root notu ayný kiþiyi gösteriyor. Final flag formatý: flag{Ad_Soyad} | Deduction | 6 | 350 | flag{Mert_Kaya} | 1006 | False |  |  |  | [{"Text":"M.K. baþ harflerini internal-docs ve kimlik kartý deliliyle eþleþtir.","PenaltyPercent":5},{"Text":"Þüpheli eski proje lideri Mert Kaya.","PenaltyPercent":20}] | {"reportSection":{"title":"Vaka kapanýþý","content":"Katil Mert Kaya. Teknik izler ve görsel deliller ayný kiþiyi doðruluyor."}} | 05/18/2026 17:55:27 | /evidence/kirmizi-gece/kimlik-karti.svg | 840 | 400 |

## dbo.Evidences

Rows: 2

| Id | ChallengeId | Title | Type | FileUrl | Description | Metadata | Order |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 1002 | Kamera son kare | image | /evidence/kirmizi-gece/kamera-son-kare.svg | 23:47 zaman damgasý, kýrmýzý iz ve M.K. rozetini gösteren güvenlik kamerasý karesi. | {"timestamp":"23:47","location":"Orion Lab - B Koridoru"} | 1 |
| 2 | 1007 | Orion kimlik kartý | image | /evidence/kirmizi-gece/kimlik-karti.svg | M.K. baþ harflerini Mert Kaya ile eþleþtiren kimlik kartý delili. | {"suspect":"Mert Kaya","department":"Project Zero"} | 1 |

## dbo.TeamCaseProgresses

Rows: 0

| Id | TeamId | CaseId | IsCompleted | Score | StartedAt | CompletedAt |
| --- | --- | --- | --- | --- | --- | --- |

## dbo.TeamMembers

Rows: 0

| Id | TeamId | UserId | Role | JoinedAt |
| --- | --- | --- | --- | --- |

## dbo.Teams

Rows: 0

| Id | Name | Description | LeaderId | MaxMembers | TotalScore | IsActive | InviteCode | CreatedAt |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |

## dbo.UserCaseProgresses

Rows: 0

| Id | UserId | CaseId | IsCompleted | Score | StartedAt | CompletedAt | HackedSystemIds | DiscoveredClueIds |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |

## dbo.UserChallengeProgresses

Rows: 1

| Id | UserId | ChallengeId | TeamId | IsSolved | Attempts | SolvedAt | StartedAt | AssignedVMId | VMConnectionDetails | UsedHints |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2 | 4 | 1002 |  | False | 1 |  | 05/19/2026 14:45:33 |  |  |  |

## dbo.Users

Rows: 3

| Id | Username | Email | PasswordHash | TotalScore | IsAdmin | PreferredRole | CreatedAt |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 3 | pery | taha@pery.com | [MASKED] | 0 | False |  | 05/18/2026 17:07:42 |
| 4 | peryy | pery@taha | [MASKED] | 0 | False |  | 05/18/2026 17:09:52 |
| 1002 | admin | admin@bars.local | [MASKED] | 0 | True |  | 05/18/2026 17:52:31 |

## dbo.VMInstances

Rows: 11

| Id | ChallengeId | UserId | TeamId | ContainerId | ContainerName | IPAddress | Port | Status | CreatedAt | ExpiresAt |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 |  | 3 |  | 6591b2ff081f5faffa618e2897ecf5c0b6c57fdd1a57a40da0196caded84207a | ctf_kali_u3_054ea2 | 10.10.74.179 | 32768 | stopped | 05/18/2026 17:08:05 | 05/18/2026 21:08:05 |
| 2 |  | 4 |  | a6c4c0fe75f4ef2870b657c3b2f53922ee43a00f80d5426ae064080e3d3b09c1 | ctf_kali_u4_d435d5 | 10.10.74.179 | 32769 | stopped | 05/18/2026 17:10:24 | 05/18/2026 21:10:24 |
| 1002 |  | 1002 |  | 13cab183059f2e7a397f53cb7bc03f31902dea66d58c86db1f30c876338a8526 | ctf_case_1_u1002_ab89cd | 172.30.0.2 | 0 | stopped | 05/18/2026 18:07:07 | 05/18/2026 22:07:07 |
| 1003 |  | 1002 |  | abfec69f8a23dc6bc18a8cf6edb55ca2473432dc4b4478acc259d20524c4497c | ctf_kali_u1002_a79db2 | localhost | 32768 | stopped | 05/18/2026 18:07:33 | 05/18/2026 22:07:33 |
| 2002 |  | 1002 |  | 94004f1f499db4bd7e6360ae584920cdeb56d442714541b13d2753534dfc3c77 | ctf_kali_u1002_8435a5 | localhost | 32768 | stopped | 05/19/2026 13:06:31 | 05/19/2026 17:06:31 |
| 2003 |  | 4 |  | 0689f6f544a024712636cf5f5d4031580051ed83dc5e0f424bca0e90305c359e | ctf_kali_u4_fc9175 | localhost | 32769 | stopped | 05/19/2026 13:07:32 | 05/19/2026 17:07:32 |
| 2004 |  | 4 |  | f921e440bfa07990125da71b190648aaf44577c67f71a7ce4d69678faae4db9b | ctf_kali_u4_b91e7b | localhost | 32770 | stopped | 05/19/2026 13:19:21 | 05/19/2026 17:19:21 |
| 2005 |  | 1002 |  | 0483e1969c1daa51b768241ada2e3694fc8bf2f38a7ae166e29c58a7726d4eba | ctf_kali_u1002_c7a9f0 | localhost | 32772 | stopped | 05/19/2026 13:50:51 | 05/19/2026 17:50:51 |
| 2006 |  | 4 |  | f785cf74e53c9d1c754775b957110c36a28b55f52312664188c6edec6ad2666d | ctf_kali_u4_824ad7 | localhost | 32773 | stopped | 05/19/2026 13:53:10 | 05/19/2026 17:53:10 |
| 2007 |  | 4 |  | 77d3f4402d88f4f1324ceed640f2fad43da46a4b3616a7c5f7325fe3abb7733b | ctf_case_1_u4_e73ecd | 172.30.0.5 | 0 | running | 05/19/2026 14:01:35 | 05/19/2026 18:01:35 |
| 2008 |  | 4 |  | 0548a337e288bf47e08651ff5582e43d815988881a22e5c792602b9fa949a3d9 | ctf_kali_u4_0a41ad | localhost | 32775 | running | 05/19/2026 15:10:14 | 05/19/2026 19:10:14 |
