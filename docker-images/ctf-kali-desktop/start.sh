#!/bin/bash

TARGET_IP=${TARGET_IP:-""}
TARGET_PORT=${TARGET_PORT:-""}

# Sanal ekran başlat
Xvfb :1 -screen 0 1280x800x24 &
export DISPLAY=:1
sleep 1

# XFCE masaüstü başlat
dbus-launch --exit-with-session xfce4-session &
sleep 2

# VNC şifresi ayarla
mkdir -p ~/.vnc
x11vnc -storepasswd kali ~/.vnc/passwd

# x11vnc başlat
x11vnc -display :1 -rfbauth ~/.vnc/passwd -forever -shared -bg -noxdamage

# Hedef bilgilerini masaüstüne yaz
if [ -n "$TARGET_IP" ]; then
    cat > ~/Desktop/hedef.txt << EOF
=== CTF HEDEF BİLGİLERİ ===
Hedef IP: $TARGET_IP

Başlangıç için:
  nmap -sV $TARGET_IP
  
SSH bağlantısı:
  ssh ctfuser@$TARGET_IP

Web tarama:
  gobuster dir -u http://$TARGET_IP -w /usr/share/wordlists/dirb/common.txt
EOF
fi

# noVNC başlat (websockify üzerinden)
websockify --web=/usr/share/novnc/ 6080 localhost:5900
