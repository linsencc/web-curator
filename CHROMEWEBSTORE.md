# Chrome Web Store Listing — 首页清选 · Bilibili

Last Updated: 2026-10-10

## Store Listing

Extension Name: 首页清选 · Bilibili
Short Description: 过滤首页广告、直播，并用互动表现保留小众视频。规则、记录仅保存在本机。
Detailed Description: 按内容类型、播放量和点赞率筛选 Bilibili 首页推荐。可独立设置三条规则和顺序，为点赞率配置颜色，查看过滤记录、恢复单条视频和管理 UP 白名单。安装后打开设置调整规则，再刷新 B 站首页。仅面向桌面浏览器。
Category: Productivity（待发布时确认）
Single Purpose: 帮助用户按自定义规则筛选 Bilibili 首页推荐。
Primary Language: 简体中文

## Graphics & Assets

| Asset | Dimensions | Status | Filename |
| --- | --- | --- | --- |
| Store Icon | 128×128 PNG | 已制作；另有 16/32/48 尺寸 | icons/icon-128.png；源图 icons/icon.svg |
| Screenshot | 1280×800 or 640×400 | 待制作 | 现有 settings-preview.png、records-preview.png 仅供开发验收 |

## Permissions Justification

| Permission | Type | Justification |
| --- | --- | --- |
| storage | permissions | Saves filtering rules, like-rate colors, filtered recommendation records and restored/whitelisted items locally so preferences survive browser restarts. Session storage reports homepage integration status. |
| https://www.bilibili.com/* | content_scripts.matches | Reads homepage recommendation metadata and adjusts recommendation cards according to the user's settings. Does not read unrelated websites. |

| https://t.bilibili.com/* | content_scripts.matches | Applies the optional dynamic-page layout preference. Does not fetch the follow list or send names elsewhere. |

No host_permissions, tabs, cookies, history or webRequest permission. Packaged modules are exposed only to www.bilibili.com and t.bilibili.com for content-script imports. No remotely hosted executable code.

## Privacy & Data Use

The extension processes and locally stores website content: video IDs, titles, URLs, thumbnails, author names/IDs, play and like statistics, filtering reasons and timestamps. Settings, restore choices and whitelist choices are user activity stored locally. It does not use analytics or send these records to a developer server.

| Data Type | Processed locally | Transmitted by extension | Purpose |
| --- | --- | --- | --- |
| Website content / filtered recommendation history | Yes | No developer upload | Filtering, rate labels and records |
| User preferences and whitelist | Yes | No | Settings persistence |
| Authentication, health, financial, messages, location | No | No | Not used |

Bilibili's own recommendation requests continue normally. Custom batch loading triggers additional native recommendation loads. Record thumbnails load from Bilibili's image servers; this causes ordinary network requests with the user's IP address. Opening a video or UP page navigates to Bilibili. Do not describe this as completely offline or as making no network requests.

- Data is not sold, used for unrelated purposes, or used for lending decisions.
- Local history is capped at 500 records; runtime recommendation cache is capped at 2000 items.
- Users can clear history and remove whitelist entries. Settings and restore choices persist until cleared or the extension is uninstalled.

## Privacy Policy

Public Privacy Policy URL: pending; above data handling is the draft basis. Publisher contact must be filled before publishing. No publication requested or performed.

## Distribution

Visibility / regions: pending publisher decision; currently unpacked local development.

## Developer Info

Publisher Name / Contact Email / Support URL / Homepage: not supplied; required items must be completed before submission.

## Version History

| Version | Date | Changes | Status |
| --- | --- | --- | --- |
| 0.16.1 | 2026-10-10 | 微调动态导航宽度与文字密度，增加卡片间隔，统一圆角及边框 | Local build; not submitted |
| 0.16.0 | 2026-10-10 | 动态页采用侧边 UP 导航、独立滚动及吸顶分类栏；保留原生节点交互 | Local build; not submitted |
| 0.15.2 | 2026-10-10 | 移除动态 UP 搜索及数量，隐藏个人资料，单栏居中布局 | Local build; not submitted |
| 0.15.1 | 2026-10-10 | 动态页隐藏发布框与空容器；UP 默认两排、支持展开；优化阅读宽度 | Local build; not submitted |
| 0.15.0 | 2026-10-10 | 动态页独立优化开关、多行 UP 与名称搜索；扩展失效后清理旧脚本 | Local build; not submitted |
| 0.14.5 | 2026-10-10 | 首屏可见骨架自动触发原生加载，限制尝试次数并在失败或滚动后停止 | Local build; not submitted |
| 0.14.4 | 2026-10-10 | 新增播放与勾选图标；组合过滤原因显示播放量及阈值，旧记录按历史快照补全 | Local build; not submitted |
| 0.14.3 | 2026-10-10 | 点赞率置于原生标签之后；统一说明标签对齐；修正首页按钮初始位置；重启和版本升级持久化验证通过 | Local build; not submitted |
| 0.14.2 | 2026-10-10 | 质量规则按指标统一列对齐，修正标题、提示和开关垂直对齐；设置及筛选回归通过 | Local build; not submitted |
| 0.14.1 | 2026-10-10 | 修复加载锚点隐藏内层后仍占一格；保留原生加载检测 | Local build; not submitted |
| 0.14.0 | 2026-10-10 | 12 label colors, aligned controls, empty-card handling | Local build; not submitted |

## Review Notes

Store readiness: incomplete (store-sized screenshots, public privacy URL and publisher details outstanding). No rejection history.
Unknown recommendation statistics are retained conservatively. Bilibili DOM and recommendation endpoint changes may require adapter updates. Existing regression tests use isolated Chromium and mock responses; live public batch validation was performed in 0.12.0, not a guarantee for every logged-in session.

## Development Tools

Development uses the chrome-extensions and modern-web-guidance skills when available. Browser regression tests run in isolated Chromium with mocked responses. A configured debugging tool alone does not establish access to the signed-in browser.


0.14.3 validation: isolated Chromium mocked main-flow regression passed, including late native badges and shared help alignment. Same-profile restart and version update preserved all saved settings. Public Bilibili live toolbar geometry passed at scroll 0 and 1000; this was an isolated browser, not the user signed-in session. Settings screenshot refreshed; store screenshots remain pending.

0.14.5 validation: public Bilibili at 2265×1244 in isolated Chromium reproduced a visible initial skeleton with a below-viewport sentinel. After the fix, one native request increased cards from 10 to 22 and removed visible skeletons without scrolling. Mocked opening-viewport tests cover success, failure, three-attempt limit, user-scroll handoff and no-skeleton idle. User signed-in session not directly tested.

0.15.0: Optional dynamic homepage layout hides sidebar distractions and provides multi-row, searchable loaded UP entries. Search terms and UP-list names stay in page memory and are not persisted or transmitted. Scope now includes t.bilibili.com. Screenshot dynamic-preview.png is a fixture, not a logged-in-site screenshot. Public production CSS was inspected; authenticated browser access timed out. Isolated tests verify switch/save/reload, list filtering/native click, late entries, disabled restoration and runtime reload cleanup. Store screenshots need refreshing.
0.15.1: Fixture browser tests passed for publishing-section removal, expand/collapse, search, native clicks, switch persistence and full disabled restoration. Layout screenshot refreshed. No authenticated live-page validation performed.
0.15.2 supersedes dynamic search: search and count UI removed; profile sidebar hidden; 860px centered single column. Fixture tests verify centering, removed controls, native UP selection, expand/collapse and full restoration. Authenticated live page not directly tested.
0.16.0: Sidebar UP navigation replaces the expanded avatar grid. CSS positioning preserves native nodes; no follow-list fetching. Fixture validation covers native clicks, independent scroll persistence with late updates, sidebar/filter stickiness, settings reload, disabled restoration and extension invalidation cleanup. Authenticated live-page verification remains unavailable. Development screenshot updated.

0.16.1: Visual refinement uses existing Bilibili color tokens, a slightly wider rail, clearer typography and separated feed cards. Isolated fixture regression passed for scrolling, sticky filters, native selection, persistence, disabled restoration and invalidation cleanup; card borders and horizontal overflow checked. Authenticated live page was not directly tested; store screenshots remain pending.

Repository migration: WebCurator is now an independent project. Runtime remains version 0.16.1 with no permission or behavior changes. Source, regression tests and packaging tools are separated; local screenshots and generated releases are excluded from Git.

Migration validation: 11 unit tests and all three isolated browser suites passed after directory restructuring (homepage, dynamic page and initial loading). Manifest and extension behavior unchanged.
