# WebCurator 开发规范

- 仅面向桌面 Chrome，使用 Manifest V3 与最小权限。
- 当前 Bilibili 功能位于 extension/；不因整理代码改变规则及数据处理行为。
- 修改扩展前使用可用的 chrome-extensions 技能；涉及 UI 时使用 modern-web-guidance。
- 更新 CHROMEWEBSTORE.md，保持功能、权限、版本与实际实现一致。
- npm test 验证逻辑，npm run test:browser 验证隔离浏览器主流程；明确区分模拟测试和真实站点验证。
- 页面及推荐数据不可信，保持校验；用户配置仅保存在本机。
- 不提交截图、用户记录、凭据、临时文件或本机绝对路径。
