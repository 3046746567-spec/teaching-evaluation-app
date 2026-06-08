#!/bin/bash
echo "================================"
echo "  🏥 护理实习生评价系统"
echo "================================"
echo ""

# 切换到项目目录
cd "$(dirname "$0")"

# 检查 node 是否安装
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未找到 Node.js，请先安装 Node.js"
    exit 1
fi

# 启动服务器
echo "🚀 正在启动服务器..."
node server.js
