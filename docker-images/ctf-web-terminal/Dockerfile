FROM debian:bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    openssh-client \
    nmap \
    netcat-openbsd \
    curl \
    wget \
    python3 \
    hydra \
    bash \
    libjson-c5 \
    libssl3 \
    && rm -rf /var/lib/apt/lists/*

# ttyd binary
RUN curl -fsSL https://github.com/tsl0922/ttyd/releases/download/1.7.7/ttyd.x86_64 \
    -o /usr/local/bin/ttyd && chmod +x /usr/local/bin/ttyd

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 7681
ENTRYPOINT ["/entrypoint.sh"]
