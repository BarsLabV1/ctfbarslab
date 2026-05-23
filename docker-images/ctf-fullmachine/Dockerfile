FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

# Temel paketler
RUN apt-get update && apt-get install -y \
    apache2 \
    openssh-server \
    php \
    php-mysql \
    curl \
    wget \
    netcat-openbsd \
    nmap \
    python3 \
    python3-pip \
    supervisor \
    && rm -rf /var/lib/apt/lists/*

# ── SSH Ayarları ──
RUN mkdir /var/run/sshd
RUN echo 'PasswordAuthentication yes' >> /etc/ssh/sshd_config
RUN echo 'PermitRootLogin no' >> /etc/ssh/sshd_config

# ── Kullanıcılar ──
# Normal kullanıcı (SSH ile girilebilir)
RUN useradd -m -s /bin/bash detective && echo "detective:Tr0jan123!" | chpasswd
# Root flag için ayrı kullanıcı
RUN useradd -m -s /bin/bash admin && echo "admin:S3cr3tP@ss" | chpasswd

# ── Web Sitesi ──
COPY web/ /var/www/html/
COPY evidence/ /var/www/html/evidence/
RUN chown -R www-data:www-data /var/www/html/
RUN chmod -R 755 /var/www/html/
RUN chmod 755 /var/www/html/secret-backup/

# ── Flag'ler ──
# Flag 1: Web'de gizli dizin (robots.txt'de ipucu)
RUN echo "CTF{w3b_r3con_m4st3r}" > /var/www/html/secret-backup/flag.txt
RUN chmod 644 /var/www/html/secret-backup/flag.txt

# Flag 2: SSH ile giriş sonrası home dizininde
RUN echo "CTF{ssh_br0k3n_4uth}" > /home/detective/user.txt
RUN chmod 644 /home/detective/user.txt

# Flag 3: Admin kullanıcısının home'unda (privilege escalation gerekli)
RUN echo "CTF{pr1v_3sc_g0d}" > /home/admin/root.txt
RUN chmod 600 /home/admin/root.txt
RUN chown admin:admin /home/admin/root.txt

# SUID binary — privilege escalation için
RUN cp /usr/bin/python3 /usr/local/bin/python3-helper
RUN chmod u+s /usr/local/bin/python3-helper

# ── Apache Ayarları ──
RUN a2enmod rewrite
RUN echo "ServerName localhost" >> /etc/apache2/apache2.conf

# ── Supervisor (çoklu servis) ──
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

EXPOSE 22 80

CMD ["/usr/bin/supervisord", "-n", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
