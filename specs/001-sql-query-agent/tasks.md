# Tasks: SQL 填写 Agent

**Feature**: `001-sql-query-agent` | **Plan**: [plan.md](./plan.md)
**Generated**: 2026-04-19

## 前置准备

### [P] 1. 项目初始化

- [ ] 使用 Vite 初始化 React + TypeScript 项目
- [ ] 安装依赖：Tailwind CSS、Monaco Editor、Zustand
- [ ] 配置 Tailwind CSS
- [ ] 配置 Monaco Editor CDN 引入
- [ ] 创建目录结构：`components/`、`store/`、`utils/`、`types/`
- [ ] 定义 TypeScript 类型：`types/index.ts`（Database/Table/Field/Tag/SelectedField/WhereCondition/JoinConfig/SQLDraft）

**产出**: 可运行的基础项目结构

---

## 模块 1: JSON 解析与数据库结构管理

### [P] 2. JSON 解析器

- [ ] 实现 `utils/jsonParser.ts`
  - [ ] 解析 JSON，校验字段完整性（name、type、comment）
  - [ ] 支持新旧两种 JSON 格式兼容
  - [ ] 抛出有意义的解析错误信息
- [ ] 编写单元测试：`utils/jsonParser.test.ts`
  - [ ] 正确格式 JSON 解析成功
  - [ ] 缺少必填字段时报错
  - [ ] 空表/空字段列表处理

**前置**: 1 | **产出**: `utils/jsonParser.ts`

### [P] 3. 数据库状态管理

- [ ] 实现 `store/useDatabaseStore.ts`（Zustand）
  - [ ] `databases`: Database[] — 导入的数据库列表
  - [ ] `tags`: Tag[] — 所有标签
  - [ ] `selectedDatabase`: string | null — 当前选中数据库
  - [ ] `addDatabases(json)`: 导入数据库
  - [ ] `createTag(name)`: 创建标签
  - [ ] `deleteTag(id)`: 删除标签
  - [ ] `addTagToTables(tableIds, tagId)`: 批量给表打标签
  - [ ] `removeTagFromTables(tableIds, tagId)`: 批量移除标签
  - [ ] `getTablesByTag(tagId)`: 按标签获取表列表
  - [ ] `getFilteredTables(tagId?, databaseId?)`: 组合筛选表

**前置**: 2 | **产出**: `store/useDatabaseStore.ts`

### [P] 4. 数据库树组件

- [ ] 实现 `components/DatabaseTree/index.tsx`
  - [ ] 展示库 → 表 → 字段三层结构
  - [ ] 支持折叠/展开
  - [ ] 字段显示名称、类型、注释
  - [ ] 支持按标签筛选（接收 tagId prop）
  - [ ] 选中表时高亮显示
- [ ] 编写组件测试

**前置**: 3 | **产出**: `components/DatabaseTree/`

---

## 模块 2: 标签管理

### [P] 5. 标签筛选组件

- [ ] 实现 `components/TagFilter/index.tsx`
  - [ ] 横向展示所有标签（创建时间顺序）
  - [ ] 显示每个标签的表数量
  - [ ] 支持"全部"按钮（取消标签筛选）
  - [ ] 支持创建新标签（输入框 + 回车确认）
  - [ ] 支持删除标签（hover 显示删除按钮）
  - [ ] 点击标签高亮筛选
- [ ] 与 `useDatabaseStore` 集成

**前置**: 3, 4 | **产出**: `components/TagFilter/`

---

## 模块 3: 查询构建状态与字段选择

### [P] 6. 查询构建状态管理

- [ ] 实现 `store/useQueryBuilderStore.ts`（Zustand）
  - [ ] `mainTable`: Table | null — 主表
  - [ ] `selectedFields`: SelectedField[] — 已选字段（主表）
  - [ ] `joinConfigs`: JoinConfig[] — 联表配置
  - [ ] `joinFields`: SelectedField[] — 已选联表字段
  - [ ] `whereConditions`: WhereCondition[] — WHERE 条件
  - [ ] `orderByFields`: { field: SelectedField, direction: 'ASC' | 'DESC' | null }[]
  - [ ] `limit`: number | null
  - [ ] `setMainTable(table)`: 选择主表
  - [ ] `addField(field, aggregate?)`: 添加字段
  - [ ] `removeField(field)`: 移除字段
  - [ ] `updateFieldAggregate(field, aggregate)`: 更新聚合方式
  - [ ] `addJoin(config)`: 添加联表
  - [ ] `removeJoin(tableId)`: 移除联表
  - [ ] `addJoinField(joinId, field, aggregate?)`: 添加联表字段
  - [ ] `addWhereCondition(condition)`: 添加 WHERE 条件
  - [ ] `removeWhereCondition(index)`: 移除 WHERE 条件
  - [ ] `updateWhereCondition(index, condition)`: 更新 WHERE 条件
  - [ ] `setOrderBy(field, direction)`: 设置排序
  - [ ] `setLimit(n)`: 设置 LIMIT
  - [ ] `reset()`: 重置所有状态

**前置**: 1 | **产出**: `store/useQueryBuilderStore.ts`

### [P] 7. 字段选择器组件

- [ ] 实现 `components/FieldSelector/index.tsx`
  - [ ] 展示当前表的所有字段（checkbox 列表）
  - [ ] 每个字段支持选择聚合方式（下拉：原始/SUM/AVG/COUNT/MAX/MIN）
  - [ ] 已选字段高亮显示
  - [ ] 支持展开/折叠字段详情（类型、注释）
- [ ] 支持联表字段选择模式（传入 `joinId` prop）
- [ ] 与 `useQueryBuilderStore` 集成

**前置**: 6 | **产出**: `components/FieldSelector/`

---

## 模块 4: WHERE 条件构建器

### [P] 8. WHERE 条件组件

- [ ] 实现 `components/WhereBuilder/index.tsx`
  - [ ] 展示已添加的条件列表
  - [ ] 每行条件：字段下拉 + 运算符下拉 + 值输入（单值/双值/BETWEEN）
  - [ ] 字段下拉：显示字段名（注释），按表分组
  - [ ] 运算符下拉：=, !=, >, <, >=, <=, LIKE, IN, NOT IN, IS NULL, IS NOT NULL, BETWEEN
  - [ ] 特殊运算符处理：
    - [ ] IS NULL/IS NOT NULL：隐藏值输入框
    - [ ] IN/NOT IN：提示逗号分隔，生成 `IN ('v1','v2')`
    - [ ] BETWEEN：双值输入框，生成 `BETWEEN 's' AND 'e'`
  - [ ] 条件行之间显示 AND/OR 连接符（可切换）
  - [ ] 支持添加新条件行
  - [ ] 支持删除条件行
- [ ] 与 `useQueryBuilderStore` 集成

**前置**: 6 | **产出**: `components/WhereBuilder/`

---

## 模块 5: 联表配置

### [P] 9. 联表配置组件

- [ ] 实现 `components/JoinConfig/index.tsx`
  - [ ] 展示已添加的联表列表
  - [ ] 每行联表：
    - [ ] 表名下拉（从数据库树选择）
    - [ ] JOIN 类型选择（INNER/LEFT/RIGHT）
    - [ ] ON 条件：左表字段下拉 + "=" + 右表字段下拉
    - [ ] 删除按钮
  - [ ] 支持添加新联表
  - [ ] 表下拉支持按标签筛选（与主表选择器一致）
- [ ] 与 `useQueryBuilderStore` 集成

**前置**: 6 | **产出**: `components/JoinConfig/`

---

## 模块 6: SQL 生成器

### [P] 10. SQL 生成器核心

- [ ] 实现 `utils/sqlGenerator.ts`
  - [ ] `generateSelect(fields: SelectedField[]): string` — SELECT 列表
  - [ ] `generateFrom(table: Table): string` — FROM 主表
  - [ ] `generateJoin(configs: JoinConfig[]): string` — JOIN 子句
  - [ ] `generateWhere(conditions: WhereCondition[]): string` — WHERE 子句
  - [ ] `generateGroupBy(fields: SelectedField[]): string` — GROUP BY（聚合场景自动包含非聚合字段）
  - [ ] `generateOrderBy(orderBy: OrderByItem[]): string` — ORDER BY
  - [ ] `generateLimit(limit: number): string` — LIMIT
  - [ ] `generateSQL(draft: SQLDraft): string` — 完整 SQL（调用上述函数组装）
- [ ] 编写单元测试：`utils/sqlGenerator.test.ts`
  - [ ] 简单 SELECT（无聚合）
  - [ ] 聚合 SELECT（带 GROUP BY）
  - [ ] 带 WHERE 条件
  - [ ] 单表 JOIN
  - [ ] 多表 JOIN
  - [ ] ORDER BY 多字段
  - [ ] LIMIT
  - [ ] 特殊运算符（IN/BETWEEN/NULL）

**前置**: 6 | **产出**: `utils/sqlGenerator.ts`

### [P] 11. 排序配置组件

- [ ] 实现 `components/OrderByConfig/index.tsx`
  - [ ] 展示已选字段的排序配置
  - [ ] 每字段可选：升序（↑）/ 降序（↓）/ 不排序（—）
  - [ ] 支持拖拽调整优先级
- [ ] 与 `useQueryBuilderStore` 集成

**前置**: 6 | **产出**: `components/OrderByConfig/`

---

## 模块 7: Monaco Editor 集成

### [P] 12. SQL 预览/编辑组件

- [ ] 实现 `components/SQLPreview/index.tsx`
  - [ ] 使用 Monaco Editor 展示生成的 SQL
  - [ ] SQL 语法高亮（MySQL 语法）
  - [ ] 支持手动编辑（onChange 更新外部状态）
  - [ ] 格式化按钮（使用 Monaco 内置格式化）
  - [ ] 字号调节
  - [ ] 主题切换（浅色/深色）
- [ ] 与 `useQueryBuilderStore` 集成（接收外部 SQL）

**前置**: 1 | **产出**: `components/SQLPreview/`

---

## 模块 8: AI 校验

### [P] 13. AI 状态管理

- [ ] 实现 `store/useAIStore.ts`（Zustand）
  - [ ] `apiKey`: string — 用户配置的 API Key
  - [ ] `apiEndpoint`: string — API 端点（默认 Claude API）
  - [ ] `setApiKey(key)`: 设置 API Key
  - [ ] `setApiEndpoint(endpoint)`: 设置端点
  - [ ] `validate(sql): Promise<AIResult>` — 调用 AI 校验

**前置**: 1 | **产出**: `store/useAIStore.ts`

### [P] 14. AI 校验功能

- [ ] 实现 `utils/aiValidator.ts`
  - [ ] `validateSQL(sql: string, config: AIConfig): Promise<AIResult>`
  - [ ] 构造评审提示词模板（见 plan.md）
  - [ ] 调用 fetch 向 AI API 发送请求
  - [ ] 解析 AI 返回结果
  - [ ] 错误处理（网络错误、超时、API 错误）
- [ ] 实现 `components/AIValidator/index.tsx`
  - [ ] "AI校验" 按钮
  - [ ] 调用时显示 loading
  - [ ] 校验结果展示区（通过/问题列表）
  - [ ] 复制修改建议按钮
- [ ] 与 `useAIStore` 集成

**前置**: 13 | **产出**: `utils/aiValidator.ts`, `components/AIValidator/`

---

## 模块 9: 风险评估

### [P] 15. 风险评估引擎

- [ ] 实现 `utils/riskChecker.ts`
  - [ ] 实现规则函数（对应 RR-001 ~ RR-011）：
    - [ ] `checkSelectStar(sql): RiskItem | null` — RR-001
    - [ ] `checkNoLimit(sql): RiskItem | null` — RR-002
    - [ ] `checkFunctionOnIndexedField(sql): RiskItem | null` — RR-003
    - [ ] `checkLikeWithLeadingWildcard(sql): RiskItem | null` — RR-004
    - [ ] `checkOrWithoutIndex(sql): RiskItem | null` — RR-005
    - [ ] `checkLargeOffset(sql): RiskItem | null` — RR-006
    - [ ] `checkMultipleJoinsWithoutOn(sql): RiskItem | null` — RR-007
    - [ ] `checkLargeInClause(sql): RiskItem | null` — RR-008
    - [ ] `checkNoOrderBy(sql): RiskItem | null` — RR-009
    - [ ] `checkDeprecatedFoundRows(sql): RiskItem | null` — RR-010
    - [ ] `checkSqlInjectionRisk(sql): RiskItem | null` — RR-011（AI 辅助）
  - [ ] `checkAll(sql): RiskResult` — 运行所有规则，返回高/中/低风险列表
- [ ] 编写单元测试：`utils/riskChecker.test.ts`
- [ ] 实现 `components/RiskPanel/index.tsx`
  - [ ] "风险评估" 按钮
  - [ ] 风险等级展示（高/中/低，彩色标签）
  - [ ] 每条风险的详细说明和建议
- [ ] 与 `useQueryBuilderStore` 集成

**前置**: 10 | **产出**: `utils/riskChecker.ts`, `components/RiskPanel/`

---

## 模块 10: 复制与 UI 优化

### [P] 16. 剪贴板复制

- [ ] 实现 `utils/clipboard.ts`
  - [ ] `copyToClipboard(text): Promise<boolean>` — 复制并返回成功/失败
- [ ] 在 `components/SQLPreview/` 中添加 "复制" 按钮
  - [ ] 复制成功显示 tooltip "已复制！"

### [P] 17. LIMIT 配置

- [ ] 在 `components/SQLPreview/` 中添加 LIMIT 输入框
  - [ ] 数字输入，支持留空（无 LIMIT）
- [ ] 与 `useQueryBuilderStore.setLimit` 集成

### [P] 18. 主应用布局

- [ ] 实现 `App.tsx`
  - [ ] 顶部：标题 + JSON 导入按钮
  - [ ] 左侧：数据库树 + 标签筛选
  - [ ] 右侧上方：已选字段 + WHERE + JOIN + 排序配置
  - [ ] 右侧下方：SQL 预览 + AI校验 + 风险评估
- [ ] 响应式布局（支持 1024px+）
- [ ] 深色/浅色主题切换

---

## 集成与测试

### [P] 19. 集成测试

- [ ] JSON 导入 → 树展示 → 标签打标 → 字段选择 → SQL 生成 全链路测试
- [ ] 单表聚合查询生成测试
- [ ] 两表 JOIN 查询生成测试
- [ ] WHERE 条件生成测试（含 IN/BETWEEN/NULL）
- [ ] 风险评估触发测试
- [ ] AI 校验调用测试（mock API）

### [P] 20. 发版准备

- [ ] `package.json` 配置正确（name/version/description）
- [ ] README.md 编写（功能说明 + 使用方法）
- [ ] 构建生产版本：`npm run build`
- [ ] 测试生产版本正常加载

---

## 任务分组（可并行执行）

**[P] = 可并行执行的任务组**

| 任务组 | 任务编号 | 说明 | 依赖 |
|--------|---------|------|------|
| 前置 | 1 | 项目初始化 | - |
| JSON解析 | 2 | JSON解析器 | 1 |
| 数据库结构 | 3, 4 | 状态管理 + 树组件 | 2 |
| 标签管理 | 5 | 标签筛选组件 | 3, 4 |
| 查询状态 | 6, 7 | 状态管理 + 字段选择器 | 1 |
| WHERE | 8 | WHERE条件组件 | 6 |
| JOIN | 9 | 联表配置组件 | 6 |
| SQL生成 | 10, 11 | 生成器 + 排序组件 | 6 |
| Monaco | 12 | SQL预览组件 | 1 |
| AI | 13, 14 | AI状态 + 校验 | 1 |
| 风险 | 15 | 风险评估 | 10 |
| 收尾 | 16, 17, 18 | 复制 + LIMIT + 主布局 | 3-15 |
| 测试 | 19, 20 | 集成测试 + 发版 | 3-18 |
