# DetectiveCTF DB Dump Summary

Generated: 2026-05-19 21:32:50

Sensitive columns matching Password/Hash/Token/Secret/Key are masked. Full table CSV files are under ./csv/.

## Sources

| Source | Server | Database | Tables | TotalRows | Users | Cases | Challenges | Evidences | Status | Note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| local_61100 | localhost,61100 | DetectiveCTFDb | 14 | 17 | 2 | 1 | 5 | 3 | OK | Aktif yerel API bu DByi kullaniyor |
| docker_current_1433_bars_kopya2 | localhost,1433 | DetectiveCTFDb | 14 | 5 | 1 | 0 | 0 | 0 | OK | Su anki docker compose SQL volume: bars-kopya2_db_data |
| docker_local_11433_container_layer | localhost,11433 | DetectiveCTFDb | 14 | 30 | 3 | 1 | 6 | 2 | OK | Eski detectivectf-db-local container katmani |
| volume_bars_db_data_attached | localhost,11436 | bars_db_data_DetectiveCTFDb | 14 | 3 | 1 | 0 | 0 | 0 | OK | bars_db_data volume kopyasi attach edildi |
| volume_ctfbarslab_db_data_attached | localhost,11436 | ctfbarslab_db_data_DetectiveCTFDb | 13 | 3 | 2 | 0 | 0 | 0 | OK | ctfbarslab_db_data volume kopyasi attach edildi |

## All Cases

| Source | Id | Title | Description | IsActive | CreatedAt |
| --- | --- | --- | --- | --- | --- |
| local_61100 | 1 | Siber Suikast: Şirket İçi Komplo | Bir teknoloji CEO'su evinde ölü bulundu. Tüm kanıtlar dijital dünyada... | True | 19.05.2026 17:51:40 |
| docker_local_11433_container_layer | 1 | Kirmizi Gece: Proje Sifir Cinayeti | Dedektiflik oyunu ile CTF hedef makinesini birle�tiren demo vaka. G�rsel delillerden ba�lay�p web ke�fi, SQL injection, SSH eri�imi ve privilege escalation ile katili bul. | True | 18.05.2026 17:01:22 |

## Matches: kan/kod/deneme

| Source | Kind | Id | TitleOrUsername | Extra | CreatedAt |
| --- | --- | --- | --- | --- | --- |
| local_61100 | Case | 1 | Siber Suikast: Şirket İçi Komplo | Bir teknoloji CEO'su evinde ölü bulundu. Tüm kanıtlar dijital dünyada... | 19.05.2026 17:51:40 |

## SQLite detectivectf.db

File: `DetectiveCTF.API\detectivectf.db`  
Tables: 12  
Users: 4  
Cases: 6  
Challenges: 28  
Evidences: 3  

### SQLite Cases

| Source | Id | Title | Description | IsActive | CreatedAt |
| --- | --- | --- | --- | --- | --- |
| sqlite_detectivectf_db_file | 1 | Siber Suikast: Şirket İçi Komplo | Bir teknoloji CEO'su evinde ölü bulundu. Tüm kanıtlar dijital dünyada... | 1 | 2026-04-21 23:52:16.0878103 |
| sqlite_detectivectf_db_file | 4 | Dijital Iz: Bir CTOnun Olumu | Siber guvenlik sirketinin CTOsu Marcus Webb ofisinde olu bulundu. | 1 | 2026-04-22 00:03:20.4389418 |
| sqlite_detectivectf_db_file | 5 | 23:17den Sonra | Ic denetim uzmani Deniz Erkan, kilitli arsiv ofisinde olu bulundu. | 1 | 2026-04-22 00:03:20.5756729 |
| sqlite_detectivectf_db_file | 6 | Golgede Iz: Argos Operasyonu | Bir muhbirin evinde bulunan kodlanmis not, kucuk bir lojistik sirketinin ic sistemlerine uzanan karanlik bir operasyonu gozler onune seriyor. | 1 | 2026-04-22 00:03:20.6995583 |
| sqlite_detectivectf_db_file | 7 | CEO SÜİKASTİ | Bir teknoloji şirketinin CEO’su ofisinde öldürülür.<br>Kapıdan uzanan bir kol silah sıkar. | 1 | 2026-04-22 00:34:46.7527041 |
| sqlite_detectivectf_db_file | 8 | Kan ve Kod: CEO Suikasti | Bir sirketin CEOsu ofisinde olduruldu. Saldirganin kolunda ozel bir aile armasi dovmesi goruldu. | 1 | 2026-04-22 01:20:19.8277834 |

### SQLite Matches: kan/kod/deneme

| Source | Kind | Id | TitleOrUsername | Extra | CreatedAt |
| --- | --- | --- | --- | --- | --- |
| sqlite_detectivectf_db_file | Case | 1 | Siber Suikast: Şirket İçi Komplo | Bir teknoloji CEO'su evinde ölü bulundu. Tüm kanıtlar dijital dünyada... | 2026-04-21 23:52:16.0878103 |
| sqlite_detectivectf_db_file | Case | 5 | 23:17den Sonra | Ic denetim uzmani Deniz Erkan, kilitli arsiv ofisinde olu bulundu. | 2026-04-22 00:03:20.5756729 |
| sqlite_detectivectf_db_file | Case | 6 | Golgede Iz: Argos Operasyonu | Bir muhbirin evinde bulunan kodlanmis not, kucuk bir lojistik sirketinin ic sistemlerine uzanan karanlik bir operasyonu gozler onune seriyor. | 2026-04-22 00:03:20.6995583 |
| sqlite_detectivectf_db_file | Case | 8 | Kan ve Kod: CEO Suikasti | Bir sirketin CEOsu ofisinde olduruldu. Saldirganin kolunda ozel bir aile armasi dovmesi goruldu. | 2026-04-22 01:20:19.8277834 |
