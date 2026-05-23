-- TechCorp Database Backup
-- Date: 2024-01-14

CREATE TABLE users (
  id INT PRIMARY KEY,
  username VARCHAR(50),
  password VARCHAR(100),
  role VARCHAR(20)
);

INSERT INTO users VALUES (1, 'admin', 'Admin@2024!', 'admin');
INSERT INTO users VALUES (2, 'detective', 'Tr0jan123!', 'user');
INSERT INTO users VALUES (3, 'ceo', 'C3O_P@ssw0rd', 'admin');

-- Hassas veriler
CREATE TABLE employee_data (
  id INT,
  name VARCHAR(100),
  salary INT,
  ssn VARCHAR(20)
);
