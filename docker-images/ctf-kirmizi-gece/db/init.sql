CREATE DATABASE IF NOT EXISTS nexgen_db;
USE nexgen_db;

-- Erişim logları tablosu
CREATE TABLE access_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    timestamp DATETIME,
    user VARCHAR(50),
    source_ip VARCHAR(20),
    action VARCHAR(100),
    status VARCHAR(20)
);

INSERT INTO access_log VALUES
(1,  '2024-03-23 23:45:00', 'kerem',  '10.0.0.5',      'SSH Login',              'SUCCESS'),
(2,  '2024-03-23 23:46:12', 'kerem',  '10.0.0.5',      'Access /internal-docs/', 'SUCCESS'),
(3,  '2024-03-23 23:47:33', 'kerem',  '10.0.0.5',      'Download project-zero',  'SUCCESS'),
(4,  '2024-03-23 23:48:01', 'root',   '185.220.101.47', 'SSH Login Attempt',      'FAILED'),
(5,  '2024-03-23 23:48:15', 'root',   '185.220.101.47', 'SSH Login Attempt',      'FAILED'),
(6,  '2024-03-23 23:49:02', 'kerem',  '185.220.101.47', 'SSH Login',              'SUCCESS'),
(7,  '2024-03-23 23:50:44', 'kerem',  '185.220.101.47', 'Access /internal-docs/', 'SUCCESS'),
(8,  '2024-03-23 23:51:18', 'kerem',  '185.220.101.47', 'Download project-zero',  'SUCCESS'),
(9,  '2024-03-24 00:01:00', 'kerem',  '185.220.101.47', 'Upload /tmp/.backdoor',  'SUCCESS'),
(10, '2024-03-24 00:02:17', 'system', '185.220.101.47', 'Camera feed terminated', 'FORCED');

-- Şüpheli IP whois kaydı
CREATE TABLE ip_intel (
    ip VARCHAR(20),
    org VARCHAR(100),
    country VARCHAR(50),
    note VARCHAR(200)
);

INSERT INTO ip_intel VALUES
('185.220.101.47', 'Orion Siber Güvenlik A.Ş.', 'TR',
 'NexGen rakibi. Aynı gece sıfır-gün açığını piyasaya sürdüler.');

-- MySQL root şifresi yok (kasıtlı açık)
ALTER USER 'root'@'localhost' IDENTIFIED BY '';
FLUSH PRIVILEGES;
