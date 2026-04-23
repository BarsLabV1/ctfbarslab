#!/usr/bin/env python3
"""
Minimal PCAP dosyası oluşturur.
darknews.local:8080 trafiği simüle eder.
"""
import struct
import socket

def create_pcap(filename):
    # PCAP global header
    magic = 0xa1b2c3d4
    version_major = 2
    version_minor = 4
    thiszone = 0
    sigfigs = 0
    snaplen = 65535
    network = 1  # Ethernet

    global_header = struct.pack('<IHHiIII',
        magic, version_major, version_minor,
        thiszone, sigfigs, snaplen, network)

    def make_packet(src_ip, dst_ip, src_port, dst_port, payload):
        payload_bytes = payload.encode()
        # TCP header (simplified)
        tcp = struct.pack('>HHIIBBHHH',
            src_port, dst_port, 0, 0, 0x50, 0x18, 65535, 0, 0)
        # IP header
        ip_len = 20 + len(tcp) + len(payload_bytes)
        ip = struct.pack('>BBHHHBBH4s4s',
            0x45, 0, ip_len, 0, 0, 64, 6, 0,
            socket.inet_aton(src_ip), socket.inet_aton(dst_ip))
        # Ethernet header
        eth = b'\xff\xff\xff\xff\xff\xff' + b'\x00\x11\x22\x33\x44\x55' + b'\x08\x00'
        frame = eth + ip + tcp + payload_bytes

        # PCAP packet header
        ts_sec = 1713139200  # 14 Nisan 2024
        ts_usec = 0
        incl_len = len(frame)
        orig_len = len(frame)
        pkt_header = struct.pack('<IIII', ts_sec, ts_usec, incl_len, orig_len)
        return pkt_header + frame

    packets = []

    # DNS query for darknews.local
    packets.append(make_packet(
        '192.168.1.100', '8.8.8.8', 54321, 53,
        'DNS QUERY: darknews.local'
    ))

    # HTTP GET to darknews.local:8080
    packets.append(make_packet(
        '192.168.1.100', '10.0.0.50', 54322, 8080,
        'GET / HTTP/1.1\r\nHost: darknews.local:8080\r\n\r\n'
    ))

    # HTTP Response with hint
    packets.append(make_packet(
        '10.0.0.50', '192.168.1.100', 8080, 54322,
        'HTTP/1.1 200 OK\r\nContent-Type: text/html\r\n\r\n<title>DarkNews - Secure Channel</title>'
    ))

    # Login attempt
    packets.append(make_packet(
        '192.168.1.100', '10.0.0.50', 54323, 8080,
        'POST /login HTTP/1.1\r\nHost: darknews.local:8080\r\n\r\nusername=reporter&password=news2024'
    ))

    with open(filename, 'wb') as f:
        f.write(global_header)
        for pkt in packets:
            f.write(pkt)

    print(f"PCAP created: {filename}")

if __name__ == '__main__':
    create_pcap('traffic.pcap')
