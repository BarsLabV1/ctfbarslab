FROM ecrt/desktop:latest

ENV DEBIAN_FRONTEND=noninteractive

# Ek Kali/CTF tool'lari (wordlist + framework)
# Not: noVNC/VNC zaten base imajda var.
RUN apt-get update && apt-get install -y \
    seclists \
    metasploit-framework \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

