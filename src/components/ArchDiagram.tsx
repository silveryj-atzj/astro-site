import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Background,
  Controls,
  MarkerType,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Edge,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

/* ============================ 数据 ============================ */
type Kind = 'cloud' | 'compute' | 'ai' | 'data' | 'net' | 'ci' | 'pub' | 'deploy';

const COLORS: Record<string, string> = {
  data: '#3b82f6',
  deploy: '#8b5cf6',
  ci: '#14b8a6',
  cloud: '#f59e0b',
};

type Zone = { id: string; x: number; y: number; w: number; h: number; title: string; sub?: string };
type Cfg = { id: string; kind: Kind; x: number; y: number; w: number; h: number; title: string; sub?: string };
type Link = { from: string; to: string; num?: number | null; kind: 'data' | 'deploy' | 'ci' | 'cloud' };

const ZONES: Zone[] = [
  { id: 'z-cloud', x: 40, y: 40, w: 2420, h: 210, title: 'Cloudflare（silveryj-atzj.me）', sub: 'DNS · Tunnel · Access · Workers AI · Email Routing' },
  { id: 'z-clients', x: 40, y: 300, w: 330, h: 470, title: '用户 / 客户端', sub: '笔记本 · 手机' },
  { id: 'z-tailnet', x: 410, y: 300, w: 2050, h: 210, title: 'Tailscale Tailnet（tailbd4708.ts.net）', sub: 'MagicDNS · Services VIP · serve' },
  { id: 'z-pve', x: 410, y: 570, w: 2050, h: 1060, title: 'Proxmox VE 宿主机  pve', sub: '192.168.8.50 · 5 个 LXC' },
  { id: 'z-strip', x: 450, y: 640, w: 1970, h: 140, title: '部署中枢（宿主机）', sub: 'webhook + 构建 + 兜底脚本' },
  { id: 'z-l501', x: 450, y: 840, w: 470, h: 400, title: 'LXC 501 · gateway', sub: '192.168.8.60' },
  { id: 'z-l600', x: 960, y: 840, w: 540, h: 400, title: 'LXC 600 · web', sub: '192.168.8.100' },
  { id: 'z-l601', x: 1540, y: 840, w: 380, h: 400, title: 'LXC 601 · homepage', sub: '192.168.8.101' },
  { id: 'z-l502', x: 1960, y: 840, w: 460, h: 400, title: 'LXC 502 · samba', sub: '192.168.8.61' },
  { id: 'z-l602', x: 450, y: 1300, w: 1970, h: 290, title: 'LXC 602 · ai', sub: '192.168.8.62' },
  { id: 'z-ext', x: 410, y: 1680, w: 2050, h: 110, title: '外部平台', sub: 'GitHub · Telegram · HuggingFace · Gmail' },
];

const NODES: Cfg[] = [
  { id: 'cf-dns', kind: 'cloud', x: 90, y: 110, w: 330, h: 70, title: 'Cloudflare DNS / Proxy', sub: 'silveryj-atzj.me + 泛域名' },
  { id: 'cf-tunnel', kind: 'cloud', x: 460, y: 110, w: 320, h: 70, title: 'Tunnel「Home」', sub: 'cloudflared · 4 连接' },
  { id: 'cf-access', kind: 'cloud', x: 820, y: 110, w: 320, h: 70, title: 'Access（Zero Trust）', sub: 'wp-admin / wp-login' },
  { id: 'cf-ai', kind: 'cloud', x: 1180, y: 110, w: 330, h: 70, title: 'Workers AI', sub: '73 模型 · 文本/图片/embedding' },
  { id: 'cf-email', kind: 'cloud', x: 1550, y: 110, w: 310, h: 70, title: 'Email Routing', sub: 'catch-all → Gmail' },
  { id: 'cf-idp', kind: 'cloud', x: 1900, y: 110, w: 420, h: 70, title: 'Zero Trust IdP', sub: 'GitHub OAuth' },

  { id: 'laptop', kind: 'compute', x: 75, y: 360, w: 260, h: 80, title: '笔记本（Windows）', sub: '浏览器 · git · ssh' },
  { id: 'phone', kind: 'compute', x: 75, y: 470, w: 260, h: 80, title: '手机', sub: 'Tailscale' },
  { id: 'browser', kind: 'pub', x: 75, y: 590, w: 260, h: 90, title: '浏览器', sub: 'Homepage · 各服务 UI' },

  { id: 'magicdns', kind: 'net', x: 450, y: 370, w: 330, h: 70, title: 'MagicDNS', sub: '*.tailbd4708.ts.net' },
  { id: 'svc', kind: 'net', x: 820, y: 370, w: 400, h: 70, title: 'Tailscale Services（VIP）', sub: '9 个服务域名，无需端口' },
  { id: 'serve', kind: 'net', x: 1260, y: 370, w: 350, h: 70, title: 'tailscale serve', sub: '443 / 8443+ / 8096 / 8097' },
  { id: 'lan', kind: 'net', x: 1650, y: 370, w: 290, h: 70, title: 'LAN 直连', sub: '192.168.8.0/24 · SMB' },
  { id: 'tsapi', kind: 'net', x: 1980, y: 370, w: 340, h: 70, title: 'Tailscale 管理 API', sub: '节点 tag / 服务审批' },

  { id: 'hook', kind: 'deploy', x: 480, y: 670, w: 380, h: 70, title: 'infra-hook（systemd）', sub: 'webhook 接收器 · :9001' },
  { id: 'infra', kind: 'deploy', x: 900, y: 670, w: 280, h: 70, title: '/srv/infra', sub: 'git clone' },
  { id: 'astrocl', kind: 'deploy', x: 1220, y: 670, w: 290, h: 70, title: '/srv/web-astro', sub: 'git clone' },
  { id: 'deploy', kind: 'deploy', x: 1550, y: 670, w: 390, h: 70, title: 'deploy 脚本', sub: 'pct push · compose · build' },
  { id: 'creds', kind: 'data', x: 1980, y: 670, w: 340, h: 70, title: '本地凭据 / token', sub: 'CREDENTIALS.md（不进 git）' },

  { id: 'caddy', kind: 'compute', x: 485, y: 880, w: 400, h: 80, title: 'Caddy 反向代理', sub: '公网入口 · HTTP :80' },
  { id: 'astro-st', kind: 'pub', x: 485, y: 990, w: 190, h: 60, title: 'Astro 静态站', sub: '/srv/astro' },
  { id: 'port-gw', kind: 'compute', x: 695, y: 990, w: 190, h: 60, title: 'Portainer', sub: 'gateway' },
  { id: 'cloudflared', kind: 'cloud', x: 485, y: 1080, w: 190, h: 60, title: 'cloudflared', sub: '隧道容器' },
  { id: 'docs', kind: 'pub', x: 695, y: 1080, w: 190, h: 60, title: 'docs / 架构图', sub: '本页在 Astro 上' },

  { id: 'wp', kind: 'pub', x: 995, y: 880, w: 470, h: 80, title: 'nginx + PHP-FPM 8.2', sub: 'WordPress 7.1' },
  { id: 'mariadb', kind: 'data', x: 995, y: 990, w: 215, h: 60, title: 'MariaDB', sub: 'home_site' },
  { id: 'redis', kind: 'data', x: 1250, y: 990, w: 215, h: 60, title: 'Redis', sub: '对象缓存' },
  { id: 'pma', kind: 'data', x: 995, y: 1080, w: 215, h: 60, title: 'phpMyAdmin', sub: '数据库管理' },
  { id: 'gitea', kind: 'ci', x: 1250, y: 1080, w: 215, h: 60, title: 'Gitea', sub: 'web-gitea · :3001' },
  { id: 'port-web', kind: 'compute', x: 995, y: 1170, w: 215, h: 58, title: 'Portainer', sub: 'web' },
  { id: 'run-wp', kind: 'ci', x: 1250, y: 1170, w: 215, h: 58, title: 'runner-wp', sub: 'GitHub Actions' },

  { id: 'homepage', kind: 'compute', x: 1575, y: 880, w: 310, h: 80, title: 'Homepage 面板', sub: '服务入口 · 站点监控' },
  { id: 'port-hp', kind: 'compute', x: 1575, y: 990, w: 145, h: 60, title: 'Portainer', sub: 'homepage' },
  { id: 'widgets', kind: 'compute', x: 1740, y: 990, w: 145, h: 60, title: 'Widgets', sub: 'Proxmox / Caddy' },

  { id: 'samba', kind: 'data', x: 1995, y: 880, w: 390, h: 80, title: 'Samba 共享（Common）', sub: 'smb://192.168.8.61' },
  { id: 'models', kind: 'data', x: 1995, y: 990, w: 185, h: 60, title: '旧模型归档', sub: 'Bonsai-27B · 4.3G' },
  { id: 'hdd', kind: 'data', x: 2200, y: 990, w: 185, h: 60, title: 'HDD-Storage', sub: '1.8T · 24%' },
  { id: 'backup', kind: 'data', x: 1995, y: 1080, w: 390, h: 60, title: '备份 / 中转', sub: '大文件' },

  { id: 'llama', kind: 'ai', x: 485, y: 1345, w: 300, h: 76, title: 'llama-server', sub: 'Bonsai 2 9B · GPU · 35 t/s' },
  { id: 'embed', kind: 'ai', x: 825, y: 1345, w: 280, h: 76, title: 'llama-embed', sub: 'bge-m3 · CPU · 1024d' },
  { id: 'oi', kind: 'ai', x: 1145, y: 1345, w: 280, h: 76, title: 'Open WebUI', sub: '聊天 · RAG · 联网搜索' },
  { id: 'st', kind: 'ai', x: 1465, y: 1345, w: 280, h: 76, title: 'SillyTavern', sub: '角色扮演 · 角色卡' },
  { id: 'cfproxy', kind: 'ai', x: 1785, y: 1345, w: 300, h: 76, title: 'cf-ai-proxy', sub: 'OpenAI 兼容 · 文本/图片' },
  { id: 'port-ai', kind: 'compute', x: 2125, y: 1345, w: 260, h: 76, title: 'Portainer', sub: 'ai' },

  { id: 'searxng', kind: 'ai', x: 485, y: 1465, w: 200, h: 64, title: 'SearXNG', sub: '元搜索' },
  { id: 'tgbot', kind: 'compute', x: 725, y: 1465, w: 290, h: 64, title: 'telegram-bot', sub: '常驻 · ST 后端 · 工具' },
  { id: 'run-astro', kind: 'ci', x: 1055, y: 1465, w: 230, h: 64, title: 'runner-astro', sub: 'GitHub Actions' },
  { id: 'hf', kind: 'data', x: 1325, y: 1465, w: 200, h: 64, title: 'hf-cache', sub: '模型缓存' },
  { id: 'models2', kind: 'data', x: 1565, y: 1465, w: 260, h: 64, title: 'models/', sub: 'Bonsai2-9B · embed' },
  { id: 'note', kind: 'compute', x: 1865, y: 1465, w: 520, h: 40, title: 'docker compose：ai-stack', sub: 'webhook 自动部署' },

  { id: 'gh', kind: 'ci', x: 450, y: 1710, w: 310, h: 60, title: 'GitHub', sub: 'website-repo / astro-site' },
  { id: 'tg', kind: 'pub', x: 800, y: 1710, w: 300, h: 60, title: 'Telegram Bot API', sub: 'webhook 回调' },
  { id: 'hugging', kind: 'data', x: 1140, y: 1710, w: 300, h: 60, title: 'HuggingFace', sub: '模型下载（手动）' },
  { id: 'gmail', kind: 'pub', x: 1480, y: 1710, w: 300, h: 60, title: 'Gmail', sub: 'adriantzj07@gmail.com' },
  { id: 'ts-cloud', kind: 'net', x: 1820, y: 1710, w: 300, h: 60, title: 'Tailscale 控制面', sub: 'MagicDNS / 审批' },
];

const LINKS: Link[] = [  { from: 'browser', to: 'cf-dns', num: 1, kind: 'data' },
  { from: 'laptop', to: 'svc', num: 2, kind: 'data' },
  { from: 'cf-dns', to: 'cf-tunnel', kind: 'cloud' },
  { from: 'cf-tunnel', to: 'caddy', num: 3, kind: 'data' },
  { from: 'cf-access', to: 'wp', num: 2, kind: 'cloud' },
  { from: 'caddy', to: 'wp', num: 4, kind: 'data' },
  { from: 'caddy', to: 'astro-st', num: 4, kind: 'data' },
  { from: 'caddy', to: 'tgbot', num: 5, kind: 'data' },
  { from: 'tg', to: 'caddy', num: 5, kind: 'data' },
  { from: 'svc', to: 'oi', num: 6, kind: 'data' },
  { from: 'svc', to: 'homepage', num: 6, kind: 'data' },
  { from: 'svc', to: 'gitea', num: 7, kind: 'data' },
  { from: 'gitea', to: 'hook', num: 8, kind: 'deploy' },
  { from: 'hook', to: 'deploy', num: 8, kind: 'deploy' },
  { from: 'deploy', to: 'caddy', num: 9, kind: 'deploy' },
  { from: 'deploy', to: 'wp', num: 9, kind: 'deploy' },
  { from: 'deploy', to: 'homepage', num: 9, kind: 'deploy' },
  { from: 'deploy', to: 'llama', num: 9, kind: 'deploy' },
  { from: 'deploy', to: 'astro-st', num: 10, kind: 'deploy' },
  { from: 'gh', to: 'run-wp', num: 11, kind: 'ci' },
  { from: 'gh', to: 'run-astro', num: 11, kind: 'ci' },
  { from: 'tgbot', to: 'st', num: 12, kind: 'data' },
  { from: 'st', to: 'llama', kind: 'data' },
  { from: 'oi', to: 'llama', kind: 'data' },
  { from: 'st', to: 'embed', kind: 'data' },
  { from: 'oi', to: 'embed', kind: 'data' },
  { from: 'oi', to: 'searxng', kind: 'data' },
  { from: 'cfproxy', to: 'cf-ai', num: 13, kind: 'cloud' },
  { from: 'tgbot', to: 'cfproxy', num: 13, kind: 'data' },
  { from: 'cf-email', to: 'gmail', num: 14, kind: 'cloud' },
];

/* 服务的内网（tailnet）直链 */
const URLS: Record<string, string> = {
  'cf-tunnel': 'https://gateway-caddy.tailbd4708.ts.net',
  'cf-access': 'https://one.dash.cloudflare.com',
  'cf-ai': 'https://dash.cloudflare.com',
  'cf-email': 'https://dash.cloudflare.com',
  'cf-idp': 'https://one.dash.cloudflare.com',
  browser: 'https://homepage.tailbd4708.ts.net',
  magicdns: 'https://homepage.tailbd4708.ts.net',
  svc: 'https://homepage.tailbd4708.ts.net',
  serve: 'https://homepage.tailbd4708.ts.net',
  tsapi: 'https://login.tailscale.com/admin/machines',
  infra: 'https://web-gitea.tailbd4708.ts.net/atzj/infra',
  astrocl: 'https://web-gitea.tailbd4708.ts.net/atzj/web-astro',
  caddy: 'https://gateway-caddy.tailbd4708.ts.net',
  'astro-st': 'https://blog.silveryj-atzj.me',
  'port-gw': 'https://gateway-portainer.tailbd4708.ts.net',
  docs: 'https://gateway-caddy.tailbd4708.ts.net/arch/',
  wp: 'https://silveryj-atzj.me',
  mariadb: 'https://web-phpmyadmin.tailbd4708.ts.net',
  redis: 'https://web-phpmyadmin.tailbd4708.ts.net',
  pma: 'https://web-phpmyadmin.tailbd4708.ts.net',
  gitea: 'https://web-gitea.tailbd4708.ts.net',
  'port-web': 'https://web-portainer.tailbd4708.ts.net',
  'run-wp': 'https://github.com/silveryj-atzj/website-repo/actions',
  homepage: 'https://homepage.tailbd4708.ts.net',
  'port-hp': 'https://homepage-portainer.tailbd4708.ts.net',
  samba: 'smb://192.168.8.61',
  llama: 'https://ai-llama.tailbd4708.ts.net',
  embed: 'https://ai-llama.tailbd4708.ts.net',
  oi: 'https://ai-openwebui.tailbd4708.ts.net',
  st: 'https://ai-sillytavern.tailbd4708.ts.net',
  cfproxy: 'https://ai.tailbd4708.ts.net:8096/ui',
  'port-ai': 'https://ai-portainer.tailbd4708.ts.net',
  searxng: 'https://ai-searxng.tailbd4708.ts.net',
  tgbot: 'https://tg.silveryj-atzj.me',
  'run-astro': 'https://github.com/silveryj-atzj/astro-site/actions',
  gh: 'https://github.com/silveryj-atzj',
  hugging: 'https://huggingface.co',
  gmail: 'https://mail.google.com',
  'ts-cloud': 'https://login.tailscale.com/admin/machines',
};

const DETAILS: Record<string, string> = {
  'cf-dns': '托管 silveryj-atzj.me 与 blog. 子域；公网只暴露主站、博客、/tg/strange-signal。',
  'cf-tunnel': 'cloudflared 在 LXC 501 建出站隧道，把 CF 流量送到 caddy:80，无需开端口。',
  'cf-access': '保护 /wp-admin 与 /wp-login.php；GitHub OAuth 登录，策略仅放行本人邮箱；admin-ajax.php bypass。',
  'cf-ai': '73 个模型：文本 gpt-oss-120b / llama-3.2 / deepseek-r1 / glm-5.3；图片 flux；embedding bge-m3。经 cf-ai-proxy 接入。',
  'cf-email': 'catch-all 统一转发 adriantzj07@gmail.com（待验证目标地址）。',
  'cf-idp': '目前只有 GitHub OAuth 一个身份源，服务所有 Access 应用。',
  svc: '9 个 Tailscale Service 域名，全部 443 无端口：ai-openwebui / ai-llama / ai-sillytavern / ai-searxng / ai-portainer / homepage / homepage-portainer / web-phpmyadmin / web-gitea。',
  serve: '8443 SillyTavern / 8444 llama / 8445 SearXNG / 9446 Portainer / 8096 生图页 / 8097 预留。',
  hook: '宿主机 systemd 服务，:9001 接收 Gitea webhook，按仓库分发 deploy.sh / deploy-astro.sh。',
  deploy: 'deploy.sh：pct push 配置 + compose restart / caddy reload；deploy-astro.sh：CT602 node 容器构建后推 dist。',
  caddy: '唯一公网入口：silveryj-atzj.me→WP（注入 X-Forwarded-Proto）、blog.→/srv/astro、tg.→/tg/strange-signal、gateway-caddy/arch→本页。',
  wp: 'LEMP：nginx + PHP 8.2-FPM + WordPress 7.1；后台 /wp-admin（Access + 密码双重保护）。',
  gitea: 'atzj/infra、atzj/web-astro、atzj/web-wordpress；push 触发 webhook 自动部署。',
  homepage: '服务导航面板；含 4 个 Portainer、AI 服务、公网站点、开发同步、AI 生图、架构图。',
  llama: 'Bonsai 2 9B（Q2_0 + Q8_0 mmproj），GPU 推理，32K 上下文，KV q4，关闭 thinking；OpenAI 兼容。',
  embed: 'bge-m3（1024 维，CPU）提供 /v1/embeddings，Open WebUI 与 SillyTavern 共用做 RAG。',
  oi: '本地 Bonsai + 6 个 CF 模型可选；联网搜索走 SearXNG；embedding 用 bge-m3。',
  st: '角色卡 Assistant / Seraphina；向量存储接 llama-embed；另存 CF Workers AI 连接 profile。',
  cfproxy: '自建 OpenAI 兼容代理：/v1/models、/v1/chat/completions、/v1/images/generations、/ui 文生图页。',
  tgbot: 'webhook 常驻：tg.silveryj-atzj.me/tg/strange-signal。读 ST 角色卡 → ST generate → 模型可调 generate_image → 图片回 Telegram。',
  samba: 'smb://192.168.8.61，share Common，底层 HDD-Storage 1.8T。',
  gmail: 'Email Routing 的最终落点。',
};

/* ============================ 布局计算 ============================ */
type RFNode = Node<{ title: string; sub?: string; kind: Kind; detail?: string; label?: string }>;

function contains(a: Zone, b: { x: number; y: number; w: number; h: number }) {
  const cx = b.x + b.w / 2;
  const cy = b.y + b.h / 2;
  return cx >= a.x && cx <= a.x + a.w && cy >= a.y && cy <= a.y + a.h;
}

function pickParent(item: { x: number; y: number; w: number; h: number }, zones: Zone[], id?: string) {
  let best: Zone | null = null;
  let bestArea = Infinity;
  for (const z of zones) {
    if (z.id === id) continue;
    const area = z.w * z.h;
    if (area < bestArea && contains(z, item)) {
      best = z;
      bestArea = area;
    }
  }
  return best;
}

function buildInitial(): { nodes: RFNode[]; edges: Edge[] } {
  // 分组父子关系
  const zoneParent = new Map<string, string | null>();
  for (const z of ZONES) {
    const p = pickParent(z, ZONES, z.id);
    zoneParent.set(z.id, p ? p.id : null);
  }
  const abs = new Map<string, { x: number; y: number; w: number; h: number }>();
  for (const z of ZONES) abs.set(z.id, { x: z.x, y: z.y, w: z.w, h: z.h });
  for (const n of NODES) abs.set(n.id, { x: n.x, y: n.y, w: n.w, h: n.h });

  const rel = (id: string) => {
    const a = abs.get(id)!;
    const parent = [...zoneParent.entries()].find(([, p]) => p === null) ? null : null;
    // 找直接父 zone
    let parentZone: Zone | null = null;
    if (ZONES.some((z) => z.id === id)) {
      const p = zoneParent.get(id);
      parentZone = p ? ZONES.find((z) => z.id === p)! : null;
    } else {
      parentZone = pickParent(a, ZONES);
      if (parentZone && parentZone.id === id) parentZone = null;
    }
    const pa = parentZone ? abs.get(parentZone.id)! : { x: 0, y: 0, w: 0, h: 0 };
    return { x: a.x - pa.x, y: a.y - pa.y, w: a.w, h: a.h };
  };

  const nodes: RFNode[] = [];
  for (const z of ZONES) {
    const r = rel(z.id);
    const p = zoneParent.get(z.id) || undefined;
    nodes.push({
      id: z.id,
      type: 'group',
      position: { x: r.x, y: r.y },
      data: { title: z.title, sub: z.sub, kind: 'net' as Kind, label: `${z.title}${z.sub ? '  ·  ' + z.sub : ''}` },
      parentId: p,
      extent: 'parent',
      draggable: false,
      selectable: false,
      style: { width: z.w, height: z.h },
      zIndex: 0,
    } as unknown as RFNode);
  }
  for (const n of NODES) {
    const r = rel(n.id);
    nodes.push({
      id: n.id,
      type: 'card',
      position: { x: r.x, y: r.y },
      data: { title: n.title, sub: n.sub, kind: n.kind, detail: DETAILS[n.id], url: URLS[n.id] },
      parentId: pickParent(n, ZONES)?.id,
      extent: 'parent',
      style: { width: n.w, height: n.h },
      zIndex: 2,
    } as unknown as RFNode);
  }

  const absOf = (id: string) => abs.get(id)!;
  const pick = (a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) => {
    const dx = b.x + b.w / 2 - (a.x + a.w / 2);
    const dy = b.y + b.h / 2 - (a.y + a.h / 2);
    return Math.abs(dx) > Math.abs(dy)
      ? dx > 0
        ? { sourceHandle: 'r', targetHandle: 'l' }
        : { sourceHandle: 'l', targetHandle: 'r' }
      : dy > 0
        ? { sourceHandle: 'b', targetHandle: 't' }
        : { sourceHandle: 't', targetHandle: 'b' };
  };

  const edges: Edge[] = LINKS.map((l) => {
    const a = absOf(l.from);
    const b = absOf(l.to);
    const stroke = COLORS[l.kind] || COLORS.data;
    return {
      id: `${l.from}->${l.to}`,
      source: l.from,
      target: l.to,
      ...pick(a, b),
      type: 'smoothstep',
      label: l.num ? String(l.num) : undefined,
      labelShowBg: true,
      labelBgStyle: { fill: '#0d141c', stroke: '#3a5474', strokeWidth: 1 },
      labelStyle: { fill: '#cfe4ff', fontSize: 11, fontWeight: 700 },
      labelBgPadding: [6, 3] as [number, number],
      labelBgBorderRadius: 10,
      style: { stroke, strokeWidth: 1.6, strokeDasharray: l.kind === 'data' ? undefined : '5 5', opacity: 0.85 },
      markerEnd: { type: MarkerType.ArrowClosed, color: stroke, width: 14, height: 14 },
    };
  });

  return { nodes, edges };
}

/* ============================ 自定义节点 ============================ */
import { Handle, Position } from '@xyflow/react';

function CardNode({ data }: any) {
  return (
    <div className={`af-card af-k-${data.kind}`}>
      <div className="af-bar" />
      <div className="af-title">{data.title}</div>
      {data.sub && <div className="af-sub">{data.sub}</div>}
      <Handle id="t" type="target" position={Position.Top} className="af-h" />
      <Handle id="b" type="source" position={Position.Bottom} className="af-h" />
      <Handle id="l" type="target" position={Position.Left} className="af-h" />
      <Handle id="r" type="source" position={Position.Right} className="af-h" />
    </div>
  );
}

const nodeTypes = { card: CardNode };

/* ============================ 主组件 ============================ */
const LS_KEY = 'arch-layout-v4';

function Diagram() {
  const initial = useMemo(() => buildInitial(), []);
  const [nodes, setNodes, onNodesChange] = useNodesState(initial.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initial.edges);
  const [detail, setDetail] = useState<{ title: string; sub?: string; text?: string; url?: string } | null>(null);
  const [saved, setSaved] = useState<'idle' | 'saved'>('idle');
  const { fitView, toObject } = useReactFlow();
  const fileRef = useRef<HTMLInputElement>(null);

  /* 载入本地存档 */
  useEffect(() => {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return;
    try {
      const saved = JSON.parse(raw) as { nodes: Record<string, { x: number; y: number }> };
      setNodes((nds) =>
        nds.map((n) => {
          const p = saved.nodes[n.id];
          return p ? { ...n, position: { x: p.x, y: p.y } } : n;
        })
      );
    } catch { /* ignore */ }
    setTimeout(() => fitView({ padding: 0.08, duration: 300 }), 120);
  }, []);

  const save = useCallback(
    (nds = nodes) => {
      const map: Record<string, { x: number; y: number }> = {};
      for (const n of nds) map[n.id] = { x: n.position.x, y: n.position.y };
      localStorage.setItem(LS_KEY, JSON.stringify({ ts: Date.now(), nodes: map }));
      setSaved('saved');
      setTimeout(() => setSaved('idle'), 1600);
    },
    [nodes]
  );

  const exportJson = () => {
    const data = { version: 4, exportedAt: new Date().toISOString(), nodes: toObject().nodes, edges: toObject().edges };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `architecture-layout-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importJson = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        if (Array.isArray(data.nodes)) {
          setNodes(data.nodes);
          if (Array.isArray(data.edges)) setEdges(data.edges);
          setTimeout(() => fitView({ padding: 0.08 }), 80);
        }
      } catch (e) {
        alert('导入失败：' + (e as Error).message);
      }
    };
    reader.readAsText(file);
  };

  const reset = () => {
    if (!confirm('恢复默认布局？（本地存档会被清除）')) return;
    localStorage.removeItem(LS_KEY);
    const fresh = buildInitial();
    setNodes(fresh.nodes);
    setEdges(fresh.edges);
    setTimeout(() => fitView({ padding: 0.08 }), 80);
  };

  return (
    <div className="af-root">
      <div className="af-toolbar">
        <strong>服务架构图</strong>
        <span className="af-tag">拖拽节点 · 20px 网格吸附 · 自动保存</span>
        <span className="af-spacer" />
        <button onClick={() => save()}>保存布局</button>
        <button onClick={exportJson}>导出 JSON</button>
        <button onClick={() => fileRef.current?.click()}>导入 JSON</button>
        <button onClick={reset}>恢复默认</button>
        <button onClick={() => fitView({ padding: 0.08, duration: 300 })}>适应窗口</button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          style={{ display: 'none' }}
          onChange={(e) => e.target.files?.[0] && importJson(e.target.files[0])}
        />
        <span className={`af-saved ${saved}`}>{saved === 'saved' ? '已保存 ✓' : ''}</span>
      </div>

      <div className="af-canvas">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeDragStop={(_, __, dragged) => save(nodes.map((n) => (n.id === dragged.id ? { ...n, position: dragged.position } : n)))}
          onNodeClick={(_, n) => {
            if (n.type === 'card') setDetail({ title: n.data.title as string, sub: n.data.sub as string, text: n.data.detail as string, url: n.data.url as string });
          }}
          onPaneClick={() => setDetail(null)}
          snapToGrid
          snapGrid={[20, 20]}
          fitView
          fitViewOptions={{ padding: 0.08 }}
          minZoom={0.15}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
          defaultEdgeOptions={{ type: 'smoothstep' }}
        >
          <Background variant={'dots' as any} gap={20} size={1} color="#1c2734" />
          <Controls showInteractive={false} />
          <MiniMap
            pannable
            zoomable
            nodeColor={(n: any) => {
              const k = n?.data?.kind;
              return ({ cloud: '#f59e0b', compute: '#3b82f6', ai: '#22c55e', data: '#a855f7', net: '#06b6d4', ci: '#14b8a6', pub: '#ef4444', deploy: '#8b5cf6' } as any)[k] || '#334155';
            }}
            maskColor="rgba(8,11,15,.72)"
            style={{ background: '#0d141c', border: '1px solid #243040' }}
          />
        </ReactFlow>

        {detail && (
          <aside className="af-detail">
            <button className="af-close" onClick={() => setDetail(null)}>×</button>
            <h3>{detail.title}</h3>
            {detail.sub && <div className="af-detail-sub">{detail.sub}</div>}
            <p>{detail.text || '（暂无补充说明）'}</p>
            {detail.url && (
              <a className="af-open" href={detail.url} target="_blank" rel="noreferrer">
                打开服务 ↗
              </a>
            )}
            {detail.url && <div className="af-detail-url">{detail.url}</div>}
          </aside>
        )}

        <div className="af-legend">
          <span><i className="af-dot" style={{ background: '#f59e0b' }} />Cloudflare</span>
          <span><i className="af-dot" style={{ background: '#3b82f6' }} />计算</span>
          <span><i className="af-dot" style={{ background: '#22c55e' }} />AI</span>
          <span><i className="af-dot" style={{ background: '#a855f7' }} />数据</span>
          <span><i className="af-dot" style={{ background: '#14b8a6' }} />CI</span>
          <span><i className="af-line" style={{ borderColor: '#3b82f6' }} />数据流</span>
          <span><i className="af-line af-dash" style={{ borderColor: '#8b5cf6' }} />部署</span>
          <span><i className="af-line af-dash" style={{ borderColor: '#f59e0b' }} />外部 API</span>
        </div>
      </div>
    </div>
  );
}

export default function ArchDiagram() {
  return (
    <ReactFlowProvider>
      <Diagram />
    </ReactFlowProvider>
  );
}
