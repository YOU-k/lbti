# LBTI · 恋爱脑分型

> MBTI 分不出你在爱里是哪种物种。

14 种恋爱人格 · 15 个隐秘维度 · 一次看清你自己（然后立刻想删掉结果页）。

## 在线体验

本项目是纯静态站，可直接部署到 GitHub Pages / Vercel / Netlify。本地两种跑法：

### 方式一：Vite（推荐，生产用）

```bash
npm install
npm run dev
# 打开 http://localhost:5173
```

### 方式二：任意静态服务器（免 npm，用于快速预览）

```bash
python3 -m http.server 8765
# 打开 http://localhost:8765/preview.html
```

`preview.html` 是一个不依赖打包器的入口 —— 它用 `fetch()` 加载 `data/*.json`，可以直接在任何 HTTP 静态服务器上跑。生产部署仍建议走 Vite 构建。

## 关于本项目

**LBTI 是 [pingfanfan/SBTI](https://github.com/pingfanfan/SBTI) 的主题二创**。SBTI 本身是 B 站 UP 主 [@蛆肉儿串儿](https://space.bilibili.com/417038183) 原创娱乐测试的开源实现，采用 MIT 协议。LBTI 复用了 SBTI 的以下代码：

- `src/engine.js`（打分/曼哈顿距离匹配纯函数）
- `src/chart.js`（Canvas 雷达图）
- `src/utils.js`
- `data/config.json` 的 schema

**所有题目、维度、人格类型、文案均为 LBTI 原创**（主题：恋爱/亲密关系）。

## 项目结构

```
├── data/
│   ├── questions.json    # 30 题 + 1 emo 触发题
│   ├── dimensions.json   # 15 维度 × 5 大类模型
│   ├── types.json        # 25 标准型 + 2 特殊型
│   └── config.json       # 阈值、彩蛋触发规则、显示文案
├── src/
│   ├── engine.js         # ← 复用自 SBTI（MIT）
│   ├── chart.js          # ← 复用自 SBTI（配色改）
│   ├── utils.js          # ← 复用自 SBTI
│   ├── quiz.js           # 答题流程
│   ├── result.js         # 结果页（新增"天菜 & 毒药"）
│   ├── share.js          # 分享文本 & 剪贴板
│   ├── main.js           # Vite 入口
│   ├── preview-main.js   # 免打包器入口（fetch 加载 JSON）
│   └── style.css         # 恋爱主题皮
├── scripts/
│   ├── check-patterns.js # 校验 pattern 两两距离分布
│   └── e2e-test.js       # 端到端测试引擎
├── docs/analysis.md      # 15 维含义 + 27 型速查
├── index.html            # Vite 入口
└── preview.html          # 免打包器入口
```

## 15 维度速览

| 模型 | 子维度 |
|---|---|
| **依恋 A** | A1 焦虑水平 / A2 回避倾向 / A3 信任度 |
| **表达 E** | E1 主动追求 / E2 情绪外显 / E3 仪式感 |
| **边界 B** | B1 独立性 / B2 占有欲 / B3 时间分配 |
| **冲突 C** | C1 冷战倾向 / C2 沟通意愿 / C3 让步度 |
| **动机 M** | M1 激情驱动 / M2 陪伴需求 / M3 长期规划 |

## 定制你自己的测试

所有可编辑内容都在 `data/` 目录。改文案不需要改代码：

- 加题目：往 `data/questions.json.main` 追加，指定 `dim`
- 改维度：`data/dimensions.json` 的 `dims` / `order`
- 加人格：`data/types.json.standard` 追加 15 字符的 pattern（L/M/H）
- 阈值/彩蛋触发：`data/config.json`

改完后跑：

- `npm run check-patterns` — 校验类型分布（两两距离均值应 ≥ 6、最小距离 ≥ 3）
- `npm test` — 端到端跑 engine.js 验证 normal / emo / fallback 三种模式都正常

## 评分算法（复用自 SBTI）

1. **求和**：每维度 2 题分值相加（范围 2-6）
2. **分级**：≤3 → L / 4 → M / ≥5 → H
3. **向量化**：L=1, M=2, H=3，生成 15 维数值向量
4. **匹配**：曼哈顿距离
5. **排名**：距离升序 → 精准命中降序 → 相似度降序
6. **特殊覆盖**：
   - `emo 深夜代表`（最后一题选"就是今晚"触发）
   - `薛定谔的暧昧`（<60% 兜底）

详见 [docs/analysis.md](docs/analysis.md)。

## 部署

### GitHub Pages（推荐）
1. Push 到 GitHub 后，在 Settings → Pages → Source 选 **GitHub Actions**
2. `.github/workflows/deploy.yml` 会自动运行：跑 `npm test` + `npm run check-patterns` → `npm run build` → 部署 `dist/`
3. 部署完成后地址：`https://<你的用户名>.github.io/<仓库名>/`

### Vercel / Netlify / Cloudflare Pages
直接连仓库，零配置识别 Vite 项目。**大陆访问快**建议选 Cloudflare Pages。

## 技术栈

- [Vite](https://vitejs.dev/) — 构建
- 原生 JavaScript / Canvas — 无框架依赖
- CSS Variables — 主题化

## 致谢

- 引擎 & 结构：[pingfanfan/SBTI](https://github.com/pingfanfan/SBTI)（MIT）
- 原始 SBTI 灵感来源：B 站 UP 主 [@蛆肉儿串儿](https://space.bilibili.com/417038183)

## 声明

本测试仅供娱乐，请勿用于分手、追人、催婚、算命、约会决策或任何严肃场景。测出什么怪东西请对号入座后自娱自乐。

## License

[MIT](LICENSE)
