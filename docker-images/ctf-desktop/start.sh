#!/bin/bash

# sibervatan için VNC dizini hazırla
mkdir -p /home/sibervatan/.config/tigervnc
cat > /home/sibervatan/.config/tigervnc/xstartup << 'EOF'
#!/bin/bash
unset SESSION_MANAGER
unset DBUS_SESSION_BUS_ADDRESS
export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
exec startxfce4
EOF
chmod +x /home/sibervatan/.config/tigervnc/xstartup
chown -R sibervatan:sibervatan /home/sibervatan/.config

# Eski lock temizle
rm -f /tmp/.X1-lock /tmp/.X11-unix/X1 2>/dev/null || true

# VNC'yi sibervatan olarak başlat
su -c "vncserver :1 -geometry 1280x720 -depth 24 -rfbport 5901 -localhost no -SecurityTypes None --I-KNOW-THIS-IS-INSECURE" sibervatan

# noVNC
websockify --web=/usr/share/novnc/ 0.0.0.0:6080 localhost:5901 &

echo "[CTF] Hazir: http://0.0.0.0:6080/vnc_lite.html"
tail -f /dev/null
