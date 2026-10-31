# Astro 博客 / Portfolio

- 线上地址：https://blog.silveryj-atzj.me
- 技术栈：Astro 5 + Content Collections + TypeScript
- 本仓库就是这个站点的源码：首页、项目页、关于页、博客、标签、归档、搜索，全部静态生成。

## 功能

- **页面**：首页（精选项目 + 最新文章）、`/projects/` 案例、`/about/`、`/blog/`、`/tags/`、`/archive/`、`/search/`
- **博客**：Markdown 内容集合，支持标签、归档、客户端模糊搜索（Fuse.js）、阅读时间、上一篇/下一篇
- **订阅与 SEO**：RSS、sitemap、`hreflang` 双语标记
- **中英双语**：中文在根路径，英文在 `/en/`，导航右侧可切换
- **设计**：自定义暗色极简主题，无 UI 框架

## 目录结构

```
src/
├─ content/blog/        文章（Markdown，frontmatter: title/description/date/tags/draft）
├─ layouts/Base.astro   全局布局、导航、样式变量
├─ pages/
│  ├─ index.astro       中文首页
│  ├─ projects.astro    项目案例
│  ├─ about.astro       关于
│  ├─ blog/             文章列表与详情
│  ├─ tags/             标签页
│  ├─ archive.astro     按年归档
│  ├─ search.astro      客户端搜索
│  ├─ rss.xml.js        RSS
│  └─ en/               英文版首页 / 项目 / 关于
└─ components/          组件
```

## 本地开发

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # 输出到 dist/
```

## 写文章

在 `src/content/blog/` 新建 `.md` 文件：

```markdown
---
title: 标题
description: 一句话摘要
date: 2026-11-01
tags: [随笔, 工程]
draft: false
---

正文……
```

文件名即 URL：`my-post.md` → `/blog/my-post/`。

## 部署

push 后自动构建发布，有两条链路：

1. **Gitea webhook** → 服务器上的部署服务 → 在临时 `node:20-alpine` 容器里 `npm ci && npm run build` → 产物推给 Caddy
2. **GitHub Actions（自托管 Runner）** → 打包源码 POST 到内网部署入口 → 同上

两条链路最终都落到同一个静态目录，由 Caddy 直接托管。

## 许可

MIT

---

# Astro Blog / Portfolio (English)

- Live: https://blog.silveryj-atzj.me
- Stack: Astro 5 + Content Collections + TypeScript
- This repository is the source of that site: home, projects, about, blog, tags, archive and search — fully static.

## Features

- **Pages**: home (featured projects + latest posts), `/projects/` case studies, `/about/`, `/blog/`, `/tags/`, `/archive/`, `/search/`
- **Blog**: Markdown content collections with tags, archive, client-side fuzzy search (Fuse.js), reading time and previous/next links
- **Feeds & SEO**: RSS, sitemap, bilingual `hreflang` alternates
- **Bilingual**: Chinese at the root, English under `/en/`, switchable in the navigation
- **Design**: custom dark minimal theme, no UI framework

## Layout

```
src/
├─ content/blog/        posts (Markdown; frontmatter: title/description/date/tags/draft)
├─ layouts/Base.astro   global layout, navigation, design tokens
├─ pages/
│  ├─ index.astro       Chinese home
│  ├─ projects.astro    project case studies
│  ├─ about.astro       about page
│  ├─ blog/             post list and detail
│  ├─ tags/             tag pages
│  ├─ archive.astro     archive by year
│  ├─ search.astro      client-side search
│  ├─ rss.xml.js        RSS feed
│  └─ en/               English home / projects / about
└─ components/          components
```

## Development

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # output to dist/
```

## Writing posts

Create a `.md` file under `src/content/blog/`:

```markdown
---
title: Post title
description: One-line summary
date: 2026-11-01
tags: [notes, engineering]
draft: false
---

Body…
```

The filename becomes the URL: `my-post.md` → `/blog/my-post/`.

## Deployment

Pushing builds and publishes automatically, via either path:

1. **Gitea webhook** → deploy service on the server → `npm ci && npm run build` inside a disposable `node:20-alpine` container → artifacts handed to Caddy
2. **GitHub Actions (self-hosted runner)** → packages the source and POSTs it to the internal deploy endpoint → same build step

Both paths publish to the same static directory served by Caddy.

## License

MIT
