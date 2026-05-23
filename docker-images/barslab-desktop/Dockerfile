FROM kalilinux/kali-rolling

ENV DEBIAN_FRONTEND=noninteractive \
    DISPLAY=:1 \
    LANG=C.UTF-8

# 1) Desktop + VNC + noVNC
RUN apt-get update && apt-get install -y \
    kali-desktop-xfce \
    tigervnc-standalone-server tigervnc-common \
    novnc websockify dbus-x11 \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# 2) Tool'lar (genis ama makul)
RUN apt-get update && apt-get install -y \
    kali-tools-top10 \
    nmap gobuster ffuf \
    sqlmap nikto dirb \
    hydra john hashcat \
    wireshark tshark tcpdump \
    netcat-openbsd curl wget git \
    nano vim mousepad \
    binwalk foremost steghide exiftool \
    gdb radare2 ltrace strace \
    python3 python3-pip \
    wordlists unzip \
    seclists metasploit-framework \
    firefox-esr \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# 3) Python kutuphaneleri
RUN pip3 install --no-cache-dir --break-system-packages \
    pwntools pycryptodome requests beautifulsoup4 scapy

# 4) Wordlist
RUN gunzip /usr/share/wordlists/rockyou.txt.gz 2>/dev/null || true

# 5) BarsLab kullanicisi
RUN useradd -m -s /bin/bash barslab \
    && echo 'barslab:barslab' | chpasswd \
    && usermod -aG sudo barslab \
    && echo 'barslab ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers

# Prompt/alias
RUN cat >> /home/barslab/.bashrc << 'BASHRC'
export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
export PS1="\[\033[1;36m\]┌──(\[\033[1;32m\]barslab@CTF\[\033[1;36m\])-[\[\033[0;37m\]\w\[\033[1;36m\]]\n└─\[\033[1;32m\]\$\[\033[0m\] "
alias ll='ls -la --color=auto'
alias tools='echo nmap gobuster ffuf hydra john sqlmap nikto burpsuite msfconsole wireshark'
BASHRC
RUN chown -R barslab:barslab /home/barslab

# VNC xstartup
RUN mkdir -p /home/barslab/.config/tigervnc \
    && cat > /home/barslab/.config/tigervnc/xstartup << 'EOF'
#!/bin/bash
unset SESSION_MANAGER
unset DBUS_SESSION_BUS_ADDRESS
export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
exec startxfce4
EOF
RUN chmod +x /home/barslab/.config/tigervnc/xstartup \
    && chown -R barslab:barslab /home/barslab

# noVNC index
RUN ln -sf /usr/share/novnc/vnc_lite.html /usr/share/novnc/index.html 2>/dev/null || true

# start script (VNC sifresiz)
COPY start.sh /start.sh
RUN chmod +x /start.sh

EXPOSE 6080
CMD ["/start.sh"]

