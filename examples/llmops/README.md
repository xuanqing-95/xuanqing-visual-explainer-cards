# Example · LLMOps · Day 04

完整跑通 visual-explainer-cards 的样例 —— 把"每天吃透一个 AI 知识点"系列的 Day 04 LLMOps 内容做成 5 张小红书知识卡。

## 内容

```
llmops/
├── source.md                          # Step 1 — 原始内容 + 不稳定事实标注
├── storyboard.yaml                    # Step 3-7 — 5 页分镜 + layout 选型
├── prompts/page-02.md                 # Step 9 — labeled-gpt-image 提示词
├── assets/page-02-placeholder.svg     # 占位插图(未跑真实 GPT Image 2 时使用)
├── index.html                         # Step 12-13 — 5 页 HTML
└── output/                            # Step 14 — 渲染结果
    ├── xhs-01-cover.png
    ├── xhs-02-concept.png
    ├── xhs-03-symptoms.png
    ├── xhs-04-case.png
    └── xhs-05-closing.png
```

## 页面 layout 决策

| # | 内容职能 | Layout | 视觉类型 |
|---|---|---|---|
| 1 | 封面 + 引子提问 | S01 Accent Cover | 纯 HTML |
| 2 | 比喻解释(餐厅后厨) | S02 Concept + Image | labeled-gpt-image |
| 3 | 缺 LLMOps 的症状 | S09 Tall Ledger | 纯 HTML |
| 4 | Before / After 真实案例 | S03 Evidence Split | 纯 HTML(两列对照) |
| 5 | 今日行动 | S12 Closing Note | 纯 HTML + ring matrix |

5 页里只有 page 2 用了生成插图 —— 符合 SKILL.md 的 "1-3 张/组" 原则。

## 关于 page 2 的占位图

`assets/page-02-placeholder.svg` 是手画的 Swiss 风格示意图,用来在不消耗 GPT Image 2 配额的前提下展示完整工作流。生产环境应该跑:

```bash
python3 ../../scripts/generate-labeled-illustration.py \
  --prompt-file prompts/page-02.md \
  --output assets/page-02.png \
  --ar 4:3
```

然后把 `index.html` 中 page 2 的 `<img src="assets/page-02-placeholder.svg">` 改成 `assets/page-02.png`。

## 如何重新跑

```bash
# 在仓库根目录
node scripts/render.mjs examples/llmops
node scripts/validate.mjs examples/llmops
```

预期 5/5 PASS。

## 验证器学到的教训

第一次渲染时 page 5 (closing) 因为 ledger 行间距 + 大标题用了 `.h-statement` 撑到 1502px 而被 R1 抓出。修复:`.h-statement` → `.h-xl`、ledger 行 padding 从 32px 收紧到 20px。这正是 R1-R7 校验存在的意义 —— 视觉上看着差不多,但 1080×1440 是硬约束。
