# 部署到 Vercel + Neon

本地开发使用 SQLite。上线公网请按下列步骤切换到 Neon Postgres。

## 1. 创建 Neon 数据库

1. 打开 https://neon.tech 注册并新建项目
2. 复制 Connection string（推荐带 `sslmode=require` 的 pooled 连接）

## 2. 修改 Prisma 数据源

编辑 `prisma/schema.prisma`：

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

本地先验证：

```bash
# .env
DATABASE_URL="postgresql://..."
npx prisma db push
```

## 3. 推送到 GitHub 并接入 Vercel

```bash
git init
git add .
git commit -m "feat: branch attendance web"
git remote add origin <your-repo>
git push -u origin main
```

在 https://vercel.com 中 Import 该仓库。

## 4. 配置环境变量（Vercel → Settings → Environment Variables）

| 变量 | 说明 |
|------|------|
| `DATABASE_URL` | Neon 连接串 |
| `ADMIN_PASSWORD` | 管理员登录密码 |
| `AUTH_SECRET` | 随机长字符串，用于会话签名 |

## 5. 部署后初始化表结构

首次部署后，在本机用生产 `DATABASE_URL` 执行一次：

```bash
npx prisma db push
```

或在 Vercel 的 Build Command 临时改为：

```bash
prisma generate && prisma db push && next build
```

（`db push` 仅建议首次或 schema 变更时使用。）

## 6. 验收

1. 打开 `https://xxx.vercel.app`
2. 用 `ADMIN_PASSWORD` 登录
3. 上传 `samples/第九党支部信息2026.xlsx`
4. 上传 `samples/信息学院第二次集中大课签退(1).xlsx`
5. 确认缪杰豪/姚嘉铖/胡文豪按学号命中，霍俊皓按一卡通命中，缺席名单可查看并导出统计

## 国内访问较慢时

同一套代码可部署到腾讯云轻量 / Sealos / Railway，数据库继续用 Neon 或云厂商 Postgres。
