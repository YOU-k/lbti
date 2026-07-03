#!/usr/bin/env python3
"""带噪音的扮演测试：每次翻转 2-3 道题，模拟真实用户的答题偏差。

对每型跑 200 次带噪音的答题，统计：
  - 依然命中目标型的比例
  - 最容易被误认成的邻居型
"""
import json
import random
from collections import Counter

random.seed(42)

t = json.load(open('data/types.json'))
d = json.load(open('data/dimensions.json'))
q = json.load(open('data/questions.json'))
c = json.load(open('data/config.json'))

order = d['order']
LEVEL_NUM = {'L': 1, 'M': 2, 'H': 3}
thresh = c['scoring']['levelThresholds']

per_dim = {}
for question in q['main']:
    per_dim.setdefault(question['dim'], []).append(question['id'])


def ideal_answers(levels_by_dim):
    ans = {}
    for dim, lv in levels_by_dim.items():
        qs = per_dim[dim]
        if lv == 'L':
            ans[qs[0]], ans[qs[1]] = 1, 1
        elif lv == 'H':
            ans[qs[0]], ans[qs[1]] = 4, 4
        else:
            ans[qs[0]], ans[qs[1]] = 2, 3
    return ans


def add_noise(answers, num_flips):
    """随机改 num_flips 道题的答案（改 ±1，或跳一档）。"""
    noisy = dict(answers)
    qids = random.sample(list(noisy.keys()), num_flips)
    for qid in qids:
        current = noisy[qid]
        # 从其他 3 个选项里随机挑一个
        choices = [v for v in [1, 2, 3, 4] if v != current]
        noisy[qid] = random.choice(choices)
    return noisy


def determine_result(answers):
    scores = {}
    for question in q['main']:
        if question['id'] in answers:
            scores[question['dim']] = scores.get(question['dim'], 0) + answers[question['id']]
    levels = {}
    for dim, s in scores.items():
        if s <= thresh['L'][1]:
            levels[dim] = 'L'
        elif s >= thresh['H'][0]:
            levels[dim] = 'H'
        else:
            levels[dim] = 'M'

    results = []
    for typ in t['standard']:
        pat = typ['pattern'].replace('-', '')
        dist = sum(abs(LEVEL_NUM[levels[order[i]]] - LEVEL_NUM[pat[i]]) for i in range(len(order)))
        sim = max(0, round((1 - dist / 20) * 100))
        results.append((typ['code'], typ['cn'], sim))
    results.sort(key=lambda x: -x[2])
    return results[0]


N_TRIALS = 200

print(f"{'型':<14}{'噪音=2':>10}{'噪音=3':>10}{'噪音=4':>10}  常见误配")
print('─' * 85)

for typ in t['standard']:
    pat = typ['pattern'].replace('-', '')
    ideal_levels = {order[i]: pat[i] for i in range(len(order))}
    base = ideal_answers(ideal_levels)

    stats = {}
    misconceptions = Counter()
    for noise in [2, 3, 4]:
        hits = 0
        for _ in range(N_TRIALS):
            noisy = add_noise(base, noise)
            top = determine_result(noisy)
            if top[0] == typ['code']:
                hits += 1
            elif noise == 3:  # 只在中等噪音记录误配
                misconceptions[top[1]] += 1
        stats[noise] = 100 * hits / N_TRIALS

    common = ', '.join(f"{name}({cnt})" for name, cnt in misconceptions.most_common(2))
    print(f"{typ['cn']:<14}{stats[2]:>9.0f}%{stats[3]:>9.0f}%{stats[4]:>9.0f}%  {common}")

print('─' * 85)
