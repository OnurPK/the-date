#!/usr/bin/env python3
"""Bir HEVC .mov'un alfa katmanı taşıyıp taşımadığını söyler.
Apple'ın HEVC-alpha formatında alfa, ikinci bir katman (nuh_layer_id = 1) olarak kodlanır;
bu script mdat içindeki NAL başlıklarını tarayıp o katmanın var olup olmadığına bakar.
Kullanım: python3 tools/check-mov.py a.mov b.mov ...   (argüman yoksa tüm klipleri tarar)"""
import glob, struct, sys

def layers(path):
    b = open(path, 'rb').read()
    i = 0
    while i + 8 <= len(b):
        sz, typ = struct.unpack('>I4s', b[i:i+8]); hdr = 8
        if sz == 1:
            sz = struct.unpack('>Q', b[i+8:i+16])[0]; hdr = 16
        if typ == b'mdat':
            p, end, l0, l1 = i + hdr, i + sz, 0, 0
            while p + 6 <= end:
                L = struct.unpack('>I', b[p:p+4])[0]
                if L == 0 or p + 4 + L > end:
                    break
                h = b[p+4:p+6]
                lid = ((h[0] & 1) << 5) | (h[1] >> 3)
                if lid == 0: l0 += 1
                elif lid == 1: l1 += 1
                p += 4 + L
            return l0, l1
        if sz == 0:
            break
        i += sz
    return 0, 0

files = sys.argv[1:] or sorted(glob.glob('worlds/**/*.mov', recursive=True))
bad = 0
for f in files:
    l0, l1 = layers(f)
    ok = l1 > 0
    bad += not ok
    print(('OK   ' if ok else 'OPAK ') + f + (f'   (alfa katmanı: {l1} NAL)' if ok else '   (alfa katmanı yok → tekrar encode)'))
sys.exit(1 if bad else 0)
