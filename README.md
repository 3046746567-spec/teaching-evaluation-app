# 🏥 护理实习生评价系统

护理实习生对带教老师的投票评价系统。支持 **实习生投票** 和 **护士长管理** 双入口。

---

## ✨ 功能

| 角色 | 功能 |
|------|------|
| 🎓 **实习生** | 每人3票，投给3位不同的带教老师，公开访问无需登录 |
| 🩺 **护士长** | 查看排名、添加/删除老师（人数无上限）、归零票数 |

- 密码: `panwenting2022`

---

## 🚀 本地运行

```bash
cd D:\teaching-evaluation-app
npm install
node server.js
```

打开 http://localhost:3000

---

## ☁️ 部署到云端（免费、长期稳定）

### 方式一：Zeabur（推荐，国内访问快）

1. 打开 https://zeabur.com 注册登录
2. 点击「新建项目」→「部署你的代码」
3. 上传 `teaching-evaluation-app` 整个文件夹
4. 在设置中开启「持久化存储」（Persistent Volume）
5. 等待部署完成，得到一个 `xxxx.zeabur.app` 地址

> 数据库会自动使用 SQLite + 持久化存储，数据不会丢失

### 方式二：Railway（国外稳定）

1. 打开 https://railway.app 用 GitHub 登录
2. 点击「New Project」→「Deploy from GitHub repo」
3. 选择你的代码仓库
4. 添加 PostgreSQL 数据库插件
5. Railway 会自动设置 `DATABASE_URL` 环境变量
6. 等待部署完成

---

## 📱 生成二维码

部署到云端后，把公网地址发给我，我帮你更新二维码！

---

## 📂 项目结构

```
teaching-evaluation-app/
├── server.js          # 后端服务器（支持 SQLite + PostgreSQL）
├── package.json       # 依赖配置
├── Procfile           # 云部署配置
├── Dockerfile         # Docker 部署
├── public/
│   ├── index.html     # 首页
│   ├── intern.html    # 实习生投票页
│   ├── headnurse.html # 护士长管理页
│   ├── style.css      # 样式
│   └── qr_*.png       # 二维码
└── README.md
```
