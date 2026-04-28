# DoNotNervous

## What This Is

一个反焦虑的目标追踪 Web 小工具。帮助忙碌的人慢下来好好生活 —— 完成任务赚积分，用积分奖励自己。支持从简单待办到项目制的全层级任务管理，完成任务时记录心情，有可爱的吉祥物陪伴鼓励你。核心理念：不是做更多，而是做了就要好好犒劳自己。

面向自己使用，也可以分享给身边同样忙碌的朋友。

## Core Value

完成任务 → 赚积分 → 奖励自己。正向激励循环，反焦虑，慢生活。

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

(None yet — ship to validate)

### Active

<!-- Current scope. Building toward these. -->

- [ ] 全层级任务管理：简单清单、分类+子任务、项目→里程碑→任务
- [ ] 虚拟积分系统：完成任务获得积分，任务难度对应不同积分
- [ ] 奖励兑换：用户自设奖励项目及所需积分，自己兑现
- [ ] 心情记录：完成任务时可快速选心情标签，也可写几句文字日记
- [ ] 连击机制：连续完成任务有连击加成，中断重新计数
- [ ] 可爱趣味风 UI：吉祥物角色、完成任务动画、升级/解锁视觉反馈
- [ ] 每日/每周总结：回顾完成情况、心情变化趋势、积分收支
- [ ] 数据本地优先：使用 IndexedDB/localStorage 存储，无需注册登录即可使用
- [ ] 响应式 Web 应用：桌面和手机浏览器都能用

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- 云端同步/多设备同步 — 先本地优先，后续再加
- 社交功能（朋友协助兑现）— v2 考虑
- 原生 iOS/Android App — 先 Web，后续可考虑 PWA
- 付费功能/内购 — 个人工具，无商业化需求
- 任务协作/团队功能 — 纯个人使用场景

## Context

- 这是一个全新的 greenfield 项目，无已有代码
- 目标用户是忙碌的上班族/学生，需要简单的正向激励来管理日常任务
- "反焦虑"是核心理念：不是催你做更多，而是鼓励你每做一步都值得奖励
- 可爱趣味风格需要吉祥物设计和丰富的微交互动画
- 本地优先意味着离线可用，隐私友好
- Web 技术栈，需要考虑移动端适配

## Constraints

- **Tech stack**: Web 应用（前端框架 + 本地存储）
- **Data storage**: 本地优先（IndexedDB），暂无后端
- **Visual style**: 可爱趣味风，需要吉祥物角色设计
- **Platform**: 浏览器（桌面 + 移动端响应式）
- **Performance**: 纯前端，加载快速，离线可用

## Key Decisions

<!-- Decisions that constrain future work. Add throughout project lifecycle. -->

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 本地优先存储 | 简单、隐私友好、离线可用，符合个人工具定位 | — Pending |
| 虚拟积分 + 自兑现 | 降低复杂度，不需要对接支付，先自己奖励自己 | — Pending |
| 可爱趣味风 UI | 符合"反焦虑"理念，温暖治愈感，增强完成动力 | — Pending |
| Web 应用形态 | 跨平台，开发快，后续可 PWA 增强 | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-28 after initialization*
