#!/usr/bin/env python3
"""Build a webOS .ipk with a strict, clean ar archive (no GNU trailing-slash names).

webOS's installer parses ar member names literally — GNU ar's trailing
'/' on member names breaks verification ("ipk verified failed").
This writes the classic Debian ar format byte-exactly.
"""
import sys, time

def ar_member(name: bytes, data: bytes) -> bytes:
    header = (
        name.ljust(16, b" ")          # name, space padded (NO slash)
        + str(int(time.time())).encode().ljust(12, b" ")  # mtime
        + b"0".ljust(6, b" ")         # uid
        + b"0".ljust(6, b" ")         # gid
        + b"100644".ljust(8, b" ")    # mode
        + str(len(data)).encode().ljust(10, b" ")          # size
        + b"`\n"                      # header terminator
    )
    out = header + data
    if len(data) % 2 == 1:            # pad to even
        out += b"\n"
    return out

def build(debian_binary: bytes, control_tgz: bytes, data_tgz: bytes, out_path: str):
    with open(out_path, "wb") as f:
        f.write(b"!<arch>\n")
        f.write(ar_member(b"debian-binary", debian_binary))
        f.write(ar_member(b"control.tar.gz", control_tgz))
        f.write(ar_member(b"data.tar.gz", data_tgz))

if __name__ == "__main__":
    build(
        open(sys.argv[1], "rb").read(),   # debian-binary
        open(sys.argv[2], "rb").read(),   # control.tar.gz
        open(sys.argv[3], "rb").read(),   # data.tar.gz
        sys.argv[4],                      # out.ipk
    )
    print(f"built {sys.argv[4]}")
