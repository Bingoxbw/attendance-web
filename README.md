# 支部活动签到统计网站

导入支部党员名单与微信小程序签到/签退 Excel，自动匹配本支部成员，统计个人与支部到达率。

## 本地运行

```bash
cd attendance-web
npm install
npx prisma db push
npm run verify:samples   # 用 samples/ 样例验收匹配逻辑
npm run dev
```

打开 http://localhost:3000 ，默认密码见 `.env` 中 `ADMIN_PASSWORD`（默认 `admin123`）。

## 功能

1. **成员管理**：导入支部名单 Excel，编辑学号/一卡通
2. **活动导入**：导入签到/签退表，三层匹配（学号 → 一卡通 → 姓名）
3. **活动详情**：到课/缺席、手动补录与关联
4. **统计看板**：个人到达率、各次与累计支部到达率，导出 Excel

## 部署到 Vercel + Neon（公网）

本地默认使用 SQLite（`file:./dev.db`）。线上请改用 Neon Postgres：

1. 在 [Neon](https://neon.tech) 创建免费项目，复制连接串
2. 修改 `prisma/schema.prisma`：

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

3. 本地验证：

```bash
# .env 中设置 Neon DATABASE_URL
npx prisma db push
```

4. 推送到 GitHub，在 Vercel Import 该仓库
5. Vercel 环境变量：
   - `DATABASE_URL` = Neon 连接串（建议用 pooled + `sslmode=require`）
   - `ADMIN_PASSWORD` = 管理员密码
   - `AUTH_SECRET` = 随机长字符串
6. Build Command 保持 `prisma generate && next build`（已在 `npm run build`）
7. 部署后访问 `https://xxx.vercel.app`

若校园网访问 Vercel 较慢，可将同一套 Next.js 代码部署到腾讯云轻量 / Sealos，数据库仍可用 Neon 或云厂商 Postgres。

## 样例文件

见 `samples/` 目录：

- 第九党支部信息2026.xlsx
- 信息学院第二次集中大课签退(1).xlsx
