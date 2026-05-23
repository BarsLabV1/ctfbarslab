#!/bin/bash

mkdir -p /home/barslab/.config/tigervnc
cat > /home/barslab/.config/tigervnc/xstartup << 'EOF'
#!/bin/bash
unset SESSION_MANAGER
unset DBUS_SESSION_BUS_ADDRESS
export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
exec startxfce4
EOF
chmod +x /home/barslab/.config/tigervnc/xstartup
chown -R barslab:barslab /home/barslab/.config

rm -f /tmp/.X1-lock /tmp/.X11-unix/X1 2>/dev/null || true

# VNC'yi sifresiz (SecurityTypes None) baslat
su -c "vncserver :1 -geometry 1280x720 -depth 24 -rfbport 5901 -localhost no -SecurityTypes None --I-KNOW-THIS-IS-INSECURE" barslab

websockify --web=/usr/share/novnc/ 0.0.0.0:6080 localhost:5901 &

echo \"[BARSLAB] Hazir: http://0.0.0.0:6080/vnc.html?autoconnect=true&resize=scale\"
tail -f /dev/null

