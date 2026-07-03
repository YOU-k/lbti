#!/usr/bin/env python3
"""为每个人格类型「扮演一个完美用户」，跑完整测试逻辑，看是否落到目标型。

原理：每型的 pattern 就是它的"理想画像"（L/M/H 组合）。我们据此生成
20 道题的答题（L→(1,1)=2, M→(2,3)=5, H→(4,4)=8），通过 engine 计算
level 向量、曼哈顿距离匹配，输出实际 Top-1 是否等于目标型。
"""
import json

t = json.load(open('data/types.json'))
d = json.load(open('data/dimensions.json'))
q = json.load(open('data/questions.json'))
c = json.load(open('data/config.json'))

order = d['order']
LEVEL_NUM = {'L': 1, 'M': 2, 'H': 3}
thresh = c['scoring']['levelThresholds']

# 每个 dim 对应 2 道题
per_dim = {}
for question in q['main']:
    per_dim.setdefault(question['dim'], []).append(question['id'])


def levels_to_answers(levels_by_dim):
    """把 dim→level 转成 20 道题的 answer values."""
    answers = {}
    for dim, level in levels_by_dim.items():
        qids = per_dim[dim]
        if level == 'L':
            answers[qids[0]] = 1
            answers[qids[1]] = 1
        elif level == 'H':
            answers[qids[0]] = 4
            answers[qids[1]] = 4
        else:  # M
            answers[qids[0]] = 2
            answers[qids[1]] = 3
    return answers


def calc_scores(answers):
    scores = {}
    for question in q['main']:
        if question['id'] in answers:
            scores[question['dim']] = scores.get(question['dim'], 0) + answers[question['id']]
    return scores


def scores_to_levels(scores):
    levels = {}
    for dim, s in scores.items():
        if s <= thresh['L'][1]:
            levels[dim] = 'L'
        elif s >= thresh['H'][0]:
            levels[dim] = 'H'
        else:
            levels[dim] = 'M'
    return levels


def match_all(user_levels):
    results = []
    for typ in t['standard']:
        pat = typ['pattern'].replace('-', '')
        dist = 0
        for i, dim in enumerate(order):
            dist += abs(LEVEL_NUM[user_levels[dim]] - LEVEL_NUM[pat[i]])
        sim = max(0, round((1 - dist / 20) * 100))
        results.append((typ['code'], typ['cn'], dist, sim))
    results.sort(key=lambda x: (x[2], -x[3]))
    return results


print(f"{'目标型':<14}{'实际 Top-1':<14}{'sim':>5}  {'次匹配':<14}{'sim':>5}  结果")
print('─' * 80)

correct = 0
mismatches = []
for typ in t['standard']:
    pat = typ['pattern'].replace('-', '')
    ideal_levels = {order[i]: pat[i] for i in range(len(order))}
    answers = levels_to_answers(ideal_levels)
    scores = calc_scores(answers)
    user_levels = scores_to_levels(scores)
    ranked = match_all(user_levels)
    top1 = ranked[0]
    top2 = ranked[1] if len(ranked) > 1 else None

    ok = top1[0] == typ['code']
    if ok:
        correct += 1
        mark = '✓'
    else:
        mark = '✗'
        mismatches.append((typ['cn'], top1[1], top1[3]))

    top2_str = f"{top2[1]}{top2[3]:>4}%" if top2 else "-"
    print(f"{typ['cn']:<14}{top1[1]:<14}{top1[3]:>4}%  {top2[1]:<14}{top2[3]:>4}%  {mark}")

print('─' * 80)
print(f"\n命中率：{correct}/{len(t['standard'])} = {100 * correct / len(t['standard']):.0f}%")

if mismatches:
    print("\n错配详情：")
    for target, actual, sim in mismatches:
        print(f"  {target} → 实际匹配到 {actual} ({sim}%)")
