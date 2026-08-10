# H3 Prompt Studio

一个本地运行、开箱即用的 MiniMax H3 结构化视频提示词编辑器，支持 Ref2VA、T2VA、I2VA 和 FL2VA。

它不调用模型，也不需要账号、后端或 API。你填写分镜内容，工具负责组织官方字段、引用标签、Shot 时间和声音结构，并实时检查常见格式问题。

> 本项目是独立的提示词格式辅助工具，与 MiniMax 官方无隶属关系。

## 特点

- 默认使用“专注分镜”，新手只需关注时长、分镜和声音
- 随时切换“完整设置”，编辑 Subject、Retention、Summary 和参考资产关系
- 内置 14 个模板，每种模式都有通用起步模板
- 支持保存、覆盖、应用和删除自定义模板
- 自动生成 Picture、Video、Audio 和 Subject 编号
- 提供规范的切镜、摄影机运动和中文台词格式快捷插入
- 检查英文正文、引用标签、台词标签、Shot 时间及首尾帧关系
- 实时生成可复制、可下载的 H3 提示词
- 支持整个工作区的 JSON 导入和导出
- 数据只保存在当前浏览器本地，不会上传
- 纯 HTML、CSS 和 JavaScript，无运行时依赖

## 快速开始

需要 Node.js 18 或更高版本。

```bash
git clone https://github.com/YOUR_NAME/h3-prompt-studio.git
cd h3-prompt-studio
npm start
```

浏览器打开：

```text
http://127.0.0.1:4173
```

这个项目也可以直接双击 `index.html` 使用；通过本地静态服务器运行时，浏览器存储和下载行为通常更稳定。

## 使用方法

1. 选择生成模式。
2. 从编辑器顶部选择模板并点击“应用”。
3. 修改分镜中的英文镜头描述。
4. 查看右侧检查结果。
5. 复制提示词，或下载 TXT。

如果需要调整参考素材、Subject、Retention、任务类型或 Summary，点击“打开完整设置”。

## 生成模式

| 模式 | 输入 | 输出结构 | 适用场景 |
| --- | --- | --- | --- |
| Ref2VA 全能参考 | 图片、视频、音频参考 | 官方六字段 | 角色参考、人物替换、多素材组合 |
| T2VA 文生视频 | 文字 | 三字段正文 | 从文字构建完整视频 |
| I2VA 图生视频 | Picture 1 首帧 | 首帧指令＋三字段正文 | 从一张图自然向后发展 |
| FL2VA 首尾帧视频 | Picture 1、Picture 2 | 首尾帧对齐＋三字段正文 | 描述两张图之间的连续变化 |

## 输出规范

Ref2VA 按以下顺序输出：

```text
subject_definitions
summary
retention_analysis
detailed_description
overall_soundscape
non_diegetic_music
```

T2VA、I2VA 和 FL2VA 使用：

```text
integrated_multimodal_description
overall_soundscape
non_diegetic_music
```

I2VA 会自动添加 0 秒首帧指令；FL2VA 会自动添加首尾帧时间对齐指令。

正文建议使用英文。中文台词保留在 `<d>[Chinese] ...</d>` 中；画面内可见文字使用英文双引号包裹。工具会提示中文误写、标签未定义、时间不递增、台词标签不完整等问题，但不会擅自改写你的剧情。

## 工作区与隐私

- 编辑内容和自定义模板保存在浏览器 `localStorage` 中。
- 项目不会上传图片、视频、音频或提示词。
- 清除浏览器站点数据会删除本地内容。
- 建议定期使用“项目 → 导出工作区”保存 JSON 备份。

## GitHub Pages

本项目没有构建步骤，可以直接部署到 GitHub Pages：

1. 将代码推送到 GitHub。
2. 打开仓库的 **Settings → Pages**。
3. 选择 **Deploy from a branch**。
4. 选择 `main` 分支和 `/ (root)` 目录。

## 开发与验证

检查 JavaScript 语法：

```bash
npm run check
```

完整浏览器冒烟测试覆盖四种模式、14 个内置模板、自定义模板、格式校验、工作区备份和移动端布局。测试脚本通过 Chrome DevTools Protocol 连接本机 `9223` 端口：

```bash
npm run smoke
```

运行冒烟测试前，需要先启动本地服务器，并以 `--remote-debugging-port=9223` 启动一个指向 `http://127.0.0.1:4173` 的 Chrome 测试实例。测试会临时生成桌面和移动端截图；这些文件已加入 `.gitignore`。

## 项目结构

```text
.
├─ index.html          # 页面结构
├─ styles.css          # 黑白响应式界面
├─ app.js              # 状态、模板、格式生成和校验逻辑
├─ dev-server.mjs      # 零依赖本地静态服务器
├─ smoke-test.mjs      # 浏览器冒烟测试
├─ package.json        # 本地运行与检查命令
└─ .github/workflows   # GitHub Actions 语法检查
```

## 发布说明

仓库当前未附带开源许可证。公开发布前，请根据你的授权需求选择并添加合适的 `LICENSE` 文件。
