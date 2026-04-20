# Implementation Plan: SQL 填写 Agent

**Branch**: `001-sql-query-agent` | **Date**: 2026-04-19 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/sql-project/specs/001-sql-query-agent/spec.md`

## Summary

创建纯前端 SQL 填写工具，通过可视化界面让用户导入数据库 JSON 结构、选择字段/聚合/联表/WHERE条件，生成对应 SQL，并提供 AI 校验与本地规则风险评估。

## Technical Context

**Language/Version**: TypeScript 5.x + HTML/CSS/JavaScript（纯前端，无需构建）|
**Primary Dependencies**:
- Monaco Editor（SQL 编辑器，MIT License）
- Tailwind CSS（样式，MIT License）
- Zustand（状态管理，MIT License）
- 可选：Prism.js/Downshift（如果需要下拉搜索）|
**Storage**: 浏览器 localStorage（标签数据、用户配置）|
**Testing**: 手动测试 + 单元测试（Jest/Vitest）|
**Target Platform**: Web 浏览器（Chrome/Firefox/Safari/Edge 最新版）|
**Project Type**: 纯前端单页应用（Single HTML File 或 轻量 Vite 项目）|
**Performance Goals**: 首屏加载 < 2s，JSON 解析 1000 表结构 < 1s |
**Constraints**: 纯前端不离线运行；AI 校验需用户自备 API Key |
**Scale/Scope**: 支持 100+ 数据库、1000+ 表、10000+ 字段的元数据 |

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Simplicity Gate (Article VII)
- [x] 使用单项目结构（纯前端，无后端）
- [x] 不需要额外的基础设施（Docker/K8s）
- [x] 不需要额外的微服务拆分

### Anti-Abstraction Gate (Article VIII)
- [x] 使用原生 HTML/CSS/JS 或轻量框架（不引入过度抽象层）
- [x] 使用 Monaco Editor 而非自研编辑器
- [x] 单一状态管理方案（Zustand）

### Integration-First Gate (Article IX)
- [x] Monaco Editor 集成方案已确认（CDN 引入）
- [x] AI 校验通过 fetch 调用外部 API（符合 RESTful）

## Project Structure

### Documentation (this feature)

```text
sql-project/
├── SPEC.md                    # 项目总体规格（可选）
├── specs/
│   └── 001-sql-query-agent/
│       ├── spec.md            # 功能规格说明书（已确认）
│       ├── plan.md             # 本文件（实现计划）
│       └── tasks.md            # 任务拆解（后续生成）
└── src/                       # 源代码目录
```

### Source Code

**推荐方案：轻量 Vite + React 项目**（便于维护和扩展）

```text
src/
├── components/                # React 组件
│   ├── DatabaseTree/          # 库-表-字段树形组件
│   ├── TagFilter/             # 标签筛选组件
│   ├── FieldSelector/         # 字段选择器（主表字段）
│   ├── JoinConfig/            # 联表配置组件
│   ├── WhereBuilder/          # WHERE 条件构建器
│   ├── OrderByConfig/         # 排序配置组件
│   ├── SQLPreview/            # Monaco Editor SQL 预览/编辑区
│   ├── RiskPanel/             # 风险评估结果展示
│   └── Header/                # 顶栏（标题、导入按钮）
├── store/                     # Zustand 状态管理
│   ├── useDatabaseStore.ts    # 数据库结构状态
│   ├── useQueryBuilderStore.ts # 查询构建状态（已选字段、WHERE、JOIN等）
│   └── useAIStore.ts          # AI 配置状态（API Key、端点）
├── utils/                     # 工具函数
│   ├── sqlGenerator.ts        # SQL 生成器核心逻辑
│   ├── riskChecker.ts         # 风险评估规则引擎
│   ├── jsonParser.ts          # JSON 元数据解析
│   └── clipboard.ts           # 剪贴板操作
├── types/                     # TypeScript 类型定义
│   └── index.ts               # 所有实体类型（Database/Table/Field/Tag等）
├── App.tsx                    # 根组件
├── main.tsx                   # 入口文件
└── index.css                  # Tailwind 入口
```

**备选方案：Single HTML File**（如需极致简单）

```text
src/
└── index.html                 # 单文件，包含所有 HTML/CSS/JS
```

**结构决策**：
- 选用 **Vite + React** 方案，便于后续功能扩展
- 组件按功能模块划分，清晰分离关注点
- 状态管理采用 Zustand（轻量、TypeScript 友好）

## Complexity Tracking

> 无 Constitution Check 违规，无需记录。

## 功能模块分解

### 模块 1: JSON 元数据导入与解析
- **输入**: 用户选择 JSON 文件
- **输出**: Database/Table/Field 树形结构存入 store
- **关键逻辑**: 解析 JSON，校验格式，构建内存树
- **文件**: `utils/jsonParser.ts`, `store/useDatabaseStore.ts`

### 模块 2: 标签管理
- **输入**: 用户创建/删除标签，选中表打标签
- **输出**: Tag 列表存入 store，Table 的 tags 字段更新
- **关键逻辑**: 标签 CRUD，批量打标签，按标签筛选表
- **文件**: `store/useDatabaseStore.ts`, `components/TagFilter/`

### 模块 3: 字段选择（主表 + 联表）
- **输入**: 用户勾选字段，选择聚合方式
- **输出**: SelectedField 列表（带聚合方式、排序方式、别名）
- **关键逻辑**: 聚合字段生成 `SUM(field) AS comment`，GROUP BY 自动处理
- **文件**: `store/useQueryBuilderStore.ts`, `components/FieldSelector/`

### 模块 4: WHERE 条件构建器
- **输入**: 用户添加条件行（字段+运算符+值）
- **输出**: WhereCondition 列表，生成 SQL 时拼接 WHERE 子句
- **关键逻辑**: 运算符处理（IN/BETWEEN/NULL 特殊处理），AND/OR 连接符拼接
- **文件**: `store/useQueryBuilderStore.ts`, `components/WhereBuilder/`

### 模块 5: 联表配置
- **输入**: 用户添加联表，选择 JOIN 类型，指定 ON 字段
- **输出**: JoinConfig 列表
- **关键逻辑**: 验证 ON 条件字段类型匹配，生成 `LEFT JOIN table ON ...`
- **文件**: `store/useQueryBuilderStore.ts`, `components/JoinConfig/`

### 模块 6: SQL 生成器
- **输入**: SelectedField 列表 + JoinConfig 列表 + WhereCondition 列表 + OrderBy
- **输出**: 完整 SQL 字符串
- **关键逻辑**:
  1. 拼接 SELECT 列表（处理聚合、表别名）
  2. 拼接 FROM 主表
  3. 拼接 JOIN 子句
  4. 拼接 WHERE 子句（AND/OR 拼接）
  5. 拼接 GROUP BY（聚合字段自动加入）
  6. 拼接 ORDER BY
  7. 拼接 LIMIT（如有）
- **文件**: `utils/sqlGenerator.ts`

### 模块 7: Monaco Editor 集成
- **输入**: SQL 生成器输出
- **输出**: 可编辑的 SQL 展示区
- **关键逻辑**: SQL 语法高亮、手动编辑支持、undo/redo
- **文件**: `components/SQLPreview/`

### 模块 8: AI 校验
- **输入**: Monaco Editor 中的 SQL 文本
- **输出**: AI 返回的校验结果（语法错误、逻辑问题、修改建议）
- **关键逻辑**: fetch 调用用户配置的 AI 接口（Claude/GPT API），构造评审提示词
- **文件**: `store/useAIStore.ts`, `utils/aiValidator.ts`

### 模块 9: 风险评估
- **输入**: Monaco Editor 中的 SQL 文本
- **输出**: 风险列表（高/中/低）及说明
- **关键逻辑**: 本地正则/字符串匹配规则扫描（RR-001 ~ RR-011）
- **文件**: `utils/riskChecker.ts`, `components/RiskPanel/`

### 模块 10: 剪贴板复制
- **输入**: SQL 文本
- **输出**: 复制成功提示
- **关键逻辑**: navigator.clipboard.writeText，视觉反馈
- **文件**: `utils/clipboard.ts`

## SQL 生成器详细逻辑

### SELECT 拼接规则
```
IF 聚合方式 != null:
  输出: {AGGREGATE}({table}.{field}) AS {comment}
ELSE:
  输出: {table}.{field} AS {comment}
```

### 表别名规则
- 主表: 使用原表名（如 `orders`）
- 联表: 使用原表名（如 `users`）
- 如需缩短，使用 `{table}__{index}` 格式

### GROUP BY 自动处理
```
IF 存在聚合字段 AND 存在非聚合原始字段:
  GROUP BY 字段 = 所有非聚合原始字段（不含聚合字段）
ELSE IF 只有聚合字段:
  不需要 GROUP BY
```

### WHERE 拼接规则
```
条件1.field + " " + 条件1.operator + " " + 条件1.value
连接符（AND/OR）
条件2.field + " " + 条件2.operator + " " + 条件2.value
```

### 运算符处理
| 运算符 | SQL 输出格式 |
|--------|-------------|
| `=` | `field = 'value'` |
| `!=` | `field != 'value'` |
| `>`/`<`/`>=`/`<=` | `field > 'value'` |
| `LIKE` | `field LIKE '%value%'` |
| `IN` | `field IN ('val1','val2')` |
| `NOT IN` | `field NOT IN ('val1','val2')` |
| `IS NULL` | `field IS NULL` |
| `IS NOT NULL` | `field IS NOT NULL` |
| `BETWEEN` | `field BETWEEN 'start' AND 'end'` |

## AI 校验提示词模板

```
【角色】你是一个资深数据库工程师，负责校验 SQL 查询的正确性和合理性。
【任务】请校验以下 SQL 语句，从语法、逻辑、性能、安全四个维度进行分析。
【SQL】
{user_sql}
【要求】
1. 如果语法错误，指出错误位置和修改建议
2. 如果逻辑问题，说明问题所在
3. 如果有性能风险，提示优化建议
4. 如果有 SQL 注入风险，标注高危
5. 如果没有问题，返回"校验通过"
```

## TODO

- [ ] 确认项目结构方案（Vite + React vs Single HTML）
- [ ] 确认 Monaco Editor 集成方式（CDN vs npm）
- [ ] 确认 AI API 配置方式（环境变量/配置文件/界面输入）
- [ ] 实现 JSON 解析器
- [ ] 实现数据库树组件
- [ ] 实现标签管理
- [ ] 实现字段选择器
- [ ] 实现 WHERE 条件构建器
- [ ] 实现联表配置
- [ ] 实现 SQL 生成器
- [ ] 集成 Monaco Editor
- [ ] 实现 AI 校验
- [ ] 实现风险评估引擎
- [ ] 实现剪贴板复制
- [ ] 集成测试
