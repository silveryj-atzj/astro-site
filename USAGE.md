# Astro 博客 · 使用说明

线上地址：**https://blog.silveryj-atzj.me**
代码仓库：`atzj/web-astro`（Gitea: https://web-gitea.tailbd4708.ts.net/atzj/web-astro）
本地目录：`D:\Ju\Projects\Web\Astro`

---

## 1. 本地预览（改完先看效果）

```powershell
cd D:\Ju\Projects\Web\Astro
npm run dev
# 打开 http://localhost:4321
```

## 2. 写一篇新文章

在 `src/content/blog/` 新建一个 `.md` 文件，例如 `my-first-post.md`：

```markdown
---
title: 我的第一篇文章
description: 一句话摘要（会显示在列表里）
date: 2026-11-01
tags: [随笔, 生活]
draft: false
---

正文写在这里，支持 Markdown。
```

- `draft: true` → 不发布（本地也看不到）
- 文件名就是 URL：`my-first-post.md` → `/blog/my-first-post/`
- 标签会自动出现在 `/tags/` 和文章里的 chip

## 3. 发布（部署）

```powershell
powershell -File scripts\deploy.ps1
```
它会：build → 打包（Python zip）→ 上传 → 解压到 Caddy → 自动验证 6 个页面返回 200。

> 不要用 Windows 自带 `tar` 打包这个目录（中文文件名会让它崩溃），脚本已改用 Python。

## 4. 改设计（颜色 / 字体 / 布局）

都在 **`src/layouts/Base.astro`** 底部的 `<style is:global>` 里：

```css
:root {
  --bg: #0b0d10;      /* 背景 */
  --card: #14181d;    /* 卡片 */
  --line: #232a32;    /* 边框 */
  --fg: #e6edf3;      /* 文字 */
  --muted: #8b98a5;   /* 次要文字 */
  --accent: #6ea8fe;  /* 强调色（链接/焦点） */
}
```
改这几个变量就能换整体风格；字号/间距也都在同一段 CSS 里。

## 5. 改导航 / 首页 / 页脚

| 想改什么 | 文件 |
|---|---|
| 顶部导航、页脚、`<head>` | `src/layouts/Base.astro` |
| 首页（服务入口 + 最新文章） | `src/pages/index.astro` |
| 博客列表 | `src/pages/blog/index.astro` |
| 文章页样式（标题/正文排版） | `src/pages/blog/[...slug].astro` + Base 里的 `.prose` |
| 标签页 / 归档 / 搜索 | `src/pages/tags/`、`src/pages/archive.astro`、`src/pages/search.astro` |

## 6. 现有页面

| 路径 | 说明 |
|---|---|
| `/` | 首页（服务入口 + 最新 3 篇文章） |
| `/blog/` | 文章列表 |
| `/blog/<slug>/` | 文章正文（含阅读时间、标签、上一篇/下一篇） |
| `/tags/`、`/tags/<标签>/` | 标签云 / 按标签浏览 |
| `/archive/` | 按年份归档 |
| `/search/` | 客户端模糊搜索（Fuse.js，无后端） |
| `/rss.xml` | RSS 订阅 |
| `/sitemap-index.xml` | 搜索引擎 sitemap |

## 7. 提交到仓库

```powershell
cd D:\Ju\Projects\Web\Astro
git add -A
git commit -m "新文章 / 改了什么"
git push
```
（Gitea 地址已配置好，首次 push 要输账号 `atzj` + 密码）

## 8. 以后可加的东西

- 每篇文章自动生成社交分享图（OG image）
- 代码高亮主题（`astro.config.mjs` 加 Shiki 配置）
- 阅读量/评论（giscus）
- Gitea webhook 自动构建部署（push 后不用手动跑脚本）
