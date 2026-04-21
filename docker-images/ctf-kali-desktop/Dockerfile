FROM kalilinux/kali-rolling

ENV DEBIAN_FRONTEND=noninteractive
ENV USER=kali
ENV PASSWORD=kali

# Temel araçlar + masaüstü ortamı
RUN apt-get update && apt-get install -y \
    xfce4 \
    xfce4-terminal \
    xfce4-goodies \
    x11vnc \
    novnc \
    websockify \
    dbus-x11 \
    xvfb \
    sudo \
    curl \
    wget \
    nmap \
    netcat-openbsd \
    openssh-client \
    python3 \
    python3-pip \
    hydra \
    john \
    sqlmap \
    nikto \
    gobuster \
    dirb \
    binwalk \
    steghide \
    exiftool \
    wireshark \
    net-tools \
    iputils-ping \
    firefox-esr \
    && rm -rf /var/lib/apt/lists/*

# Burpsuite Community indir
RUN curl -fsSL "https://portswigger.net/burp/releases/download?product=community&version=2024.11.4&type=Linux" \
    -o /opt/burpsuite_installer.sh && chmod +x /opt/burpsuite_installer.sh || true

# kali kullanıcısı
RUN useradd -m -s /bin/bash kali && echo "kali:kali" | chpasswd && \
    usermod -aG sudo kali && \
    echo "kali ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

# noVNC başlangıç scripti
COPY start.sh /start.sh
RUN chmod +x /start.sh

# noVNC port
EXPOSE 6080

USER kali
WORKDIR /home/kali

CMD ["/start.sh"]
