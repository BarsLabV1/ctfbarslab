#!/bin/bash

# Hedef bilgilerini env'den al
TARGET_IP=${TARGET_IP:-""}
TARGET_PORT=${TARGET_PORT:-22}

# Hoş geldin mesajı
cat > /etc/motd << EOF

╔══════════════════════════════════════════╗
║         Dedektif CTF - Terminal          ║
╠══════════════════════════════════════════╣
║  Hedef IP   : ${TARGET_IP}
║  Hedef Port : ${TARGET_PORT}
╠══════════════════════════════════════════╣
║  Araçlar: ssh, nmap, nc, curl, hydra     ║
╚══════════════════════════════════════════╝

Bağlanmak için: ssh ctfuser@${TARGET_IP} -p ${TARGET_PORT}

EOF

# ttyd web terminal başlat — reconnect destekli
exec ttyd -p 7681 -W --writable bash
