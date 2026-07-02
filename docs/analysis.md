# LBTI 数据结构分析

## 15 维度 × 5 大类模型

### A · 依恋模型（Attachment）

底色：你在关系里的默认姿势。

| 代码 | 名字 | H 极端 | L 极端 |
|---|---|---|---|
| A1 | 焦虑水平 | 手机不弹消息就觉得 ta 不爱了 | ta 消失三天你才反应过来 |
| A2 | 回避倾向 | 太近就想跑 | 24 小时黏在一起也不腻 |
| A3 | 信任度 | 你说是就是 | 全世界都可能是间谍 |

### E · 表达模型（Expression）

怎么"给"。

| A | Name | H | L |
|---|---|---|---|
| E1 | 主动追求 | 看上就冲 | 暗恋十年不表白 |
| E2 | 情绪外显 | 全写脸上 | 表面平静 |
| E3 | 仪式感 | 纪念日全不能少 | 情人节是骗局 |

### B · 边界模型（Boundary）

边界在哪。

| 代码 | 名字 | H | L |
|---|---|---|---|
| B1 | 独立性 | 各有各世界 | 共用大脑 |
| B2 | 占有欲 | 手机相册全看 | ta 出轨也是自由 |
| B3 | 时间分配 | 所有空闲留 ta | 一周一次算频繁 |

### C · 冲突模型（Conflict）

吵架时。

| 代码 | 名字 | H | L |
|---|---|---|---|
| C1 | 冷战倾向 | 生气就闭麦 | 有气当场爆发 |
| C2 | 沟通意愿 | 凡事摊开讲 | 让 ta 猜 |
| C3 | 让步度 | 退一步海阔天空 | 宁死不认错 |

### M · 动机模型（Motive）

为什么谈。

| 代码 | 名字 | H | L |
|---|---|---|---|
| M1 | 激情驱动 | 没心跳等于坐牢 | 稳定平淡最好 |
| M2 | 陪伴需求 | 24 小时都要 | 一个人也行 |
| M3 | 长期规划 | 第一次约会就想到结婚 | 谈以后就想逃 |

## 27 型速查

### 25 标准型

| 代码 | 名字 | Pattern (A1-A3 · E1-E3 · B1-B3 · C1-C3 · M1-M3) |
|---|---|---|
| LICK | 舔狗型 | `HLH-HHH-LLH-LHH-MHM` |
| LOVEBRAIN | 恋爱脑型 | `HLM-HHH-LMH-MHH-HHH` |
| SEAKING | 海王/海后型 | `LHL-HLM-HLL-MML-HLL` |
| WHITEMOON | 白月光型 | `LHH-LLM-HLL-LLL-LLL` |
| BACKUP | 备胎候鸟型 | `HLH-LLL-LLH-LHL-LHL` |
| COOL | 清冷主义型 | `LMH-LLL-HLM-MMM-LLL` |
| CP | CP 狂魔型 | `MLH-HHH-LHH-LMM-HHM` |
| COLDWAR | 冷战大师型 | `MHL-LLL-HMM-HLL-MML` |
| RENGE | 报复性单身型 | `LHL-LLL-HLL-HLL-MLL` |
| MODEL | 模范情侣型 | `LLH-MMH-MMM-LHH-MMH` |
| WORK | 事业型 | `LMM-MLL-HLL-MMM-LLM` |
| CTRL | 控制欲爆棚型 | `MLL-HMM-LHH-MML-MHH` |
| VAMPIRE | 情绪吸血鬼型 | `HLL-MHM-LHH-MHL-MHM` |
| ANALYST | 精神分析师型 | `MMM-MLL-HLM-MHM-LMM` |
| CONTRACT | 契约恋人型 | `LMM-MLM-HLM-LHM-LMH` |
| INTENSE | 强度选手型 | `HLM-HHH-LHH-HMM-HHM` |
| SAINT | AA 制圣人型 | `LMH-MLL-HLM-LHM-LMM` |
| WEDDING | 结婚脑型 | `MLH-HMH-LMH-LHH-MHH` |
| FEARW | 恐婚型 | `LHM-MML-HLM-MMM-MML` |
| BOOM | 原地爆炸型 | `HLM-HHM-MHH-HML-HHM` |
| SOLO | 独处王/女王型 | `LHM-LMM-HLL-MHM-MLL` |
| JIEDOG | 姐狗/哥狗型 | `MLH-HHM-LMH-LHH-HHM` |
| BIG | 大哥/大姐型 | `LMH-HMM-MHM-LHM-MMH` |
| LOOP | 复读机型 | `MLM-MHM-LMH-LHL-MHM` |
| CLEAR | 人间清醒型 | `LMM-MMM-HMM-LHM-MMM` |

### 2 特殊型

| 代码 | 名字 | 触发条件 |
|---|---|---|
| EMO | emo 深夜代表 | 最后一题选"就是今晚" |
| SCHRODINGER | 薛定谔的暧昧 | 与所有标准型相似度均 <60% |

## Pattern 分布报告

跑 `npm run check-patterns` 得到（当前值）：

```
Pairs: 300
Mean distance: 12.94  (target >= 6)
Min: 3                (should be >= 3)
Max: 26
```

任意两型间的曼哈顿距离均 ≥ 3，确保用户命中不会挤在同一型。

## 天菜 & 毒药机制

每型附带两个字段：
- `match_high`: 天然搭配（相似度回补机制）
- `match_low`: 天然相克（避雷提醒）

字段值是其他类型的 `code`。这是一个纯配置项，引擎不参与计算。
