FROM ubuntu:22.04
ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y openssh-server sudo && rm -rf /var/lib/apt/lists/*
RUN mkdir /var/run/sshd
RUN echo 'PermitRootLogin no' >> /etc/ssh/sshd_config
RUN echo 'PasswordAuthentication yes' >> /etc/ssh/sshd_config

# ops_archive kullanıcısı
RUN useradd -m -s /bin/bash ops_archive && echo "ops_archive:Wh19Archive!" | chpasswd

# Dosyalar
RUN mkdir -p /home/ops_archive /opt/shadow-ledger /var/log

RUN echo "Arşiv düğümüne erişim sağlandı.\nBu sistem yalnızca yetkili personel içindir.\nSon giriş: 14 Nisan 23:41" \
    > /home/ops_archive/note.txt

RUN echo '{"dashboard_url":"http://172.22.0.20:8080","api_key":"SL-archive-ops-2931","service":"ledger-sync","version":"1.4.2"}' \
    > /opt/shadow-ledger/config.json

RUN echo "Apr 14 23:18:44 sshd[1234]: Accepted password for ops_archive from 172.22.0.5\nApr 14 23:21:02 sshd[1235]: Accepted password for kerem.ates from 172.22.0.1\nApr 14 23:41:17 sshd[1236]: Accepted password for ops_archive from 172.22.0.5" \
    > /var/log/auth.log

RUN chown -R ops_archive:ops_archive /home/ops_archive
RUN chmod 644 /opt/shadow-ledger/config.json

EXPOSE 22
CMD ["/usr/sbin/sshd", "-D"]
