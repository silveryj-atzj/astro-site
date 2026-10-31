---
title: 你好，世界
description: 这个博客正式开张了，用的 Astro 静态站 + Cloudflare Tunnel。
date: 2026-10-31
tags: [公告, Astro]
---

这是博客的第一篇文章。

这个站点是用 **Astro** 构建的静态站，挂在 `blog.silveryj-atzj.me`，
通过 Cloudflare Tunnel → Caddy → 静态文件 提供访问。

## 技术栈

- Astro 5 + Content Collections（Markdown 写文章）
- 构建在你自己的电脑上，产物 rsync 到服务器，不占服务器带宽
- HTTPS 由 Cloudflare 提供，源站只跑 HTTP

## 怎么写新文章

在 `src/content/blog/` 新建一个 `.md` 文件，填好 frontmatter：

```yaml
---
title: 标题
description: 摘要
date: 2026-10-31
tags: [标签]
---
```

然后 `npm run build`，把 `dist/` 同步上去就行。
