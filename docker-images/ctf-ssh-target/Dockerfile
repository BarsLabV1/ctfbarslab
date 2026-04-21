FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    openssh-server \
    sudo \
    curl \
    wget \
    net-tools \
    && rm -rf /var/lib/apt/lists/*

# SSH config
RUN mkdir /var/run/sshd
RUN echo 'PermitRootLogin yes' >> /etc/ssh/sshd_config
RUN echo 'PasswordAuthentication yes' >> /etc/ssh/sshd_config

# CTF kullanıcısı — zayıf şifre (kasıtlı)
RUN useradd -m -s /bin/bash ctfuser && echo "ctfuser:password123" | chpasswd
RUN useradd -m -s /bin/bash admin && echo "admin:admin" | chpasswd

# Flag dosyaları
RUN mkdir -p /home/ctfuser/documents
RUN echo "CTF{employee_access_granted}" > /root/flag.txt
RUN echo "Bu dosyaya erişmek için root olmanız gerekiyor." > /home/ctfuser/README.txt
RUN echo "Sistem logları /var/log/auth.log dosyasında bulunabilir." >> /home/ctfuser/README.txt

# Sahte hassas dosyalar
RUN echo "financial_report_Q3_DELETED - Bu dosya silinmiştir." > /home/ctfuser/documents/deleted_files.txt
RUN echo "s.johnson tarafından 23:25'te silindi" >> /home/ctfuser/documents/deleted_files.txt

# SSH port
EXPOSE 22

CMD ["/usr/sbin/sshd", "-D"]
