#!/bin/bash
# 🏥 护理实习生评价系统 - 公网隧道启动脚本
# 使用 Serveo.net 免费隧道，无需注册

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

echo "╔══════════════════════════════════════╗"
echo "║  🏥 启动公网隧道                     ║"
echo "╚══════════════════════════════════════╝"
echo ""

# 1. 确保服务器在运行
if ! pgrep -f "node server.js" > /dev/null; then
    echo "🚀 启动服务器..."
    node server.js &
    sleep 2
    echo "✅ 服务器已启动"
else
    echo "✅ 服务器已在运行"
fi

# 2. 启动 Serveo 隧道
echo "🔗 正在连接 Serveo 隧道..."
nohup ssh -o StrictHostKeyChecking=no -o ServerAliveInterval=60 \
    -R 80:localhost:3000 serveo.net > /tmp/serveo.log 2>&1 &
TUNNEL_PID=$!

# 等待隧道建立
sleep 4

# 3. 提取公网地址
TUNNEL_URL=$(grep -oP 'https://[a-z0-9-]+\.serveousercontent\.com' /tmp/serveo.log | head -1)

if [ -z "$TUNNEL_URL" ]; then
    echo "❌ 隧道连接失败，查看日志:"
    cat /tmp/serveo.log
    exit 1
fi

echo "✅ 隧道已建立！"
echo "🌐 公网地址: $TUNNEL_URL"
echo ""

# 4. 更新二维码
python3 -c "
import qrcode
url = '$TUNNEL_URL'
pages = {
    'qr_main': url + '/',
    'qr_intern': url + '/intern',
    'qr_headnurse': url + '/headnurse',
}
for name, addr in pages.items():
    qr = qrcode.QRCode(version=2, error_correction=qrcode.constants.ERROR_CORRECT_H, box_size=14, border=4)
    qr.add_data(addr)
    qr.make(fit=True)
    qr.make_image(fill_color='#2563EB', back_color='white').save('public/' + name + '.png')
print('✅ 二维码已更新')
"

echo ""
echo "═══════════════════════════════════════"
echo "  📱 扫描 public/qr_main.png 即可访问"
echo "  🎓 实习生: ${TUNNEL_URL}/intern"
echo "  🩺 护士长: ${TUNNEL_URL}/headnurse"
echo "  🔑 密码: panwenting2022"
echo "═══════════════════════════════════════"
echo ""
echo "⚠️  隧道进程 PID: $TUNNEL_PID"
echo "   关闭隧道: kill $TUNNEL_PID"
