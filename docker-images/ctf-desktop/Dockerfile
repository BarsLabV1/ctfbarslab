FROM kalilinux/kali-rolling

ENV DEBIAN_FRONTEND=noninteractive \
    DISPLAY=:1 \
    LANG=C.UTF-8

# ── 1. Masaüstü + VNC + noVNC ────────────────────────────────────────────────
RUN apt-get update && apt-get install -y \
    kali-desktop-xfce \
    tigervnc-standalone-server tigervnc-common \
    novnc websockify dbus-x11 \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# ── 2. CTF araçları ──────────────────────────────────────────────────────────
RUN apt-get update && apt-get install -y \
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
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# ── 3. Burp Suite ────────────────────────────────────────────────────────────
RUN apt-get update && apt-get install -y burpsuite \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# ── 4. Python kütüphaneleri ──────────────────────────────────────────────────
RUN pip3 install --no-cache-dir --break-system-packages \
    pwntools pycryptodome requests beautifulsoup4 scapy

# ── 5. Wordlist ──────────────────────────────────────────────────────────────
RUN gunzip /usr/share/wordlists/rockyou.txt.gz 2>/dev/null || true

# ── 6. sibervatan kullanıcısı ────────────────────────────────────────────────
RUN useradd -m -s /bin/bash sibervatan \
    && echo 'sibervatan:barslab' | chpasswd \
    && usermod -aG sudo sibervatan \
    && echo 'sibervatan ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers

# PATH + prompt + alias — sibervatan
RUN cat >> /home/sibervatan/.bashrc << 'BASHRC'
export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
export PS1="\[\033[1;36m\]┌──(\[\033[1;34m\]sibervatan@barslab\[\033[1;36m\])-[\[\033[0;37m\]\w\[\033[1;36m\]]\n└─\[\033[1;34m\]\$\[\033[0m\] "
alias ll='ls -la'
alias update='sudo apt-get update && sudo apt-get upgrade -y'
BASHRC

# PATH + prompt — root
RUN cat >> /root/.bashrc << 'BASHRC'
export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
export PS1="\[\033[1;36m\]┌──(\[\033[1;31m\]root@barslab\[\033[1;36m\])-[\[\033[0;37m\]\w\[\033[1;36m\]]\n└─\[\033[1;31m\]#\[\033[0m\] "
alias ll='ls -la'
alias update='apt-get update && apt-get upgrade -y'
BASHRC

# ── 7. VNC xstartup (sibervatan için) ────────────────────────────────────────
RUN mkdir -p /home/sibervatan/.config/tigervnc \
    && cat > /home/sibervatan/.config/tigervnc/xstartup << 'EOF'
#!/bin/bash
unset SESSION_MANAGER
unset DBUS_SESSION_BUS_ADDRESS
export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
exec startxfce4
EOF
RUN chmod +x /home/sibervatan/.config/tigervnc/xstartup \
    && chown -R sibervatan:sibervatan /home/sibervatan

# ── 8. noVNC ─────────────────────────────────────────────────────────────────
RUN ln -sf /usr/share/novnc/vnc_lite.html /usr/share/novnc/index.html 2>/dev/null || true

# ── 9. start.sh ──────────────────────────────────────────────────────────────
COPY start.sh /start.sh
RUN chmod +x /start.sh

EXPOSE 6080
CMD ["/start.sh"]
