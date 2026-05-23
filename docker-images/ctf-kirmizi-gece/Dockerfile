FROM ubuntu:22.04
ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    apache2 php libapache2-mod-php \
    php-sqlite3 sqlite3 \
    openssh-server \
    supervisor curl wget \
    && rm -rf /var/lib/apt/lists/*

# ── SSH ──
RUN mkdir /var/run/sshd
RUN echo 'PasswordAuthentication yes' >> /etc/ssh/sshd_config
RUN echo 'PermitRootLogin no' >> /etc/ssh/sshd_config
RUN useradd -m -s /bin/bash kerem && echo "kerem:R3dN1ght!" | chpasswd

# ── Web ──
COPY web/ /var/www/html/
RUN chown -R www-data:www-data /var/www/html/
RUN chmod -R 755 /var/www/html/
RUN a2enmod rewrite
RUN echo "ServerName localhost" >> /etc/apache2/apache2.conf

# Local vulnerable portal DB
RUN mkdir -p /var/www/html/data \
    && sqlite3 /var/www/html/data/portal.db "CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT, password TEXT, role TEXT, note TEXT);" \
    && sqlite3 /var/www/html/data/portal.db "INSERT INTO users VALUES (1, 'admin', 'NexGen-Admin-731', 'admin', 'SSH hesabi: kerem / R3dN1ght! | portal flag: CTF{sqli_portal_breached}');" \
    && chown -R www-data:www-data /var/www/html/data

# ── Home dosyaları ──
COPY home/last_report.txt /home/kerem/last_report.txt
COPY home/.bash_history   /home/kerem/.bash_history
RUN chown kerem:kerem /home/kerem/last_report.txt /home/kerem/.bash_history
RUN chmod 600 /home/kerem/.bash_history

# Intentional SUID backdoor for the lab
RUN cp /bin/bash /usr/local/bin/backup-check
RUN chmod 4755 /usr/local/bin/backup-check

# ── Flag'ler ──
RUN echo "CTF{22,80,3306}"    > /home/kerem/.flag1.txt
RUN echo "CTF{R3dN1ght!}"     > /home/kerem/.flag2.txt
RUN echo "CTF{z3r0_d4y_f0und}" > /var/www/html/internal-docs/flag.txt
RUN echo "CTF{ssh_1ns1d3r}"   > /home/kerem/user.txt
RUN echo "CTF{r00t_0f_3v1l}"  > /root/root.txt
RUN chmod 600 /root/root.txt

# ── Supervisor ──
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

EXPOSE 22 80 3306
CMD ["/usr/bin/supervisord", "-n", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
