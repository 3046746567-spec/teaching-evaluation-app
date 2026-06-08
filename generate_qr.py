#!/usr/bin/env python3
"""根据 ngrok 地址重新生成二维码"""
import qrcode
import sys

url = sys.argv[1] if len(sys.argv) > 1 else input("请输入 ngrok 地址: ")
url = url.rstrip("/")

pages = {
    "qr_main": url + "/",
    "qr_intern": url + "/intern",
    "qr_headnurse": url + "/headnurse",
}

for name, addr in pages.items():
    qr = qrcode.QRCode(version=2, error_correction=qrcode.constants.ERROR_CORRECT_H, box_size=14, border=4)
    qr.add_data(addr)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#2563EB", back_color="white")
    img.save(f"/home/wusiyu/teaching-evaluation-app/public/{name}.png")
    print(f"✅ 已生成: {name}.png -> {addr}")

print("\n📱 现在可以扫二维码访问了！")
