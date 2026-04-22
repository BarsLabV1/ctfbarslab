FROM ubuntu:22.04
ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    openssh-server \
    tcpdump \
    && rm -rf /var/lib/apt/lists/*

RUN mkdir /var/run/sshd
RUN echo 'PermitRootLogin no' >> /etc/ssh/sshd_config
RUN echo 'PasswordAuthentication yes' >> /etc/ssh/sshd_config

# CEO kullanıcısı
RUN useradd -m -s /bin/bash ceo && echo "ceo:ceo_pass_2024" | chpasswd

# Dosyaları kopyala
COPY note.txt /home/ceo/note.txt
COPY traffic.pcap /home/ceo/traffic.pcap
RUN chown ceo:ceo /home/ceo/note.txt /home/ceo/traffic.pcap
RUN chmod 644 /home/ceo/note.txt /home/ceo/traffic.pcap

EXPOSE 22
CMD ["/usr/sbin/sshd", "-D"]
