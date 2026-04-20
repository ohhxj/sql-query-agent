# Feature Specification: SQL 填写 Agent

**Feature Branch**: `001-sql-query-agent`
**Created**: 2026-04-19
**Status**: Draft
**Input**: 用户描述：创建一个 SQL 填写工具，支持导入数据库结构（库/表/字段/注释），通过可视化界面选择字段生成 SQL，支持聚合统计、多表联查、AI校验和风险评估。

## User Scenarios & Testing

### User Story 1 - JSON 元数据导入与树形展示 (Priority: P1)

作为用户，我希望导入数据库的 JSON 结构文件，并在左侧看到库→表→字段的树形展示，方便我了解可查询的内容。

**Why this priority**: 这是工具的基础，所有后续功能都依赖于此。不可分割的最小功能单元。

**Independent Test**: 导入 JSON 文件后，树形结构正确展示所有库/表/字段，且字段包含名称、类型、注释。

**Acceptance Scenarios**:
1. **Given** 用户准备好的 JSON 元数据文件，**When** 用户点击导入并选择该文件，**Then** 左侧面板展示完整的库-表-字段三层树形结构，每个字段显示字段名、类型、注释
2. **Given** 已导入的数据库结构，**When** 用户展开某个库，**Then** 显示该库下所有表；展开某张表，显示该表所有字段
3. **Given** 多个数据库的情况，**When** 用户查看树形结构，**Then** 不同数据库分区展示，互不混淆

---

### User Story 2 - 标签分组管理 (Priority: P1)

作为用户，我希望给表打标签（项目分组），支持按标签快速筛选，这样在表很多时能快速找到目标表。

**Why this priority**: 核心效率功能，用户明确提出的需求，能大幅提升查找表的效率。

**Independent Test**: 创建标签后，给某张表打标签，点击标签筛选，能正确显示打该标签的表。

**Acceptance Scenarios**:
1. **Given** 导入的数据库结构，**When** 用户在标签管理区创建新标签（如"电商"），**Then** 标签出现在横向标签栏中，可重复创建多个标签
2. **Given** 已创建的标签，**When** 用户在某数据库下批量勾选多张表并选择一个标签，**Then** 所选表都被打上该标签
3. **Given** 打上标签的表，**When** 用户点击某个标签按钮，**Then** 表选择区只显示打该标签的表，支持组合筛选
4. **Given** 已存在的标签，**When** 用户删除某个标签，**Then** 所有表的该标签被移除，标签栏中该标签消失

---

### User Story 3 - SQL 生成（单表 + 聚合 + WHERE 条件） (Priority: P1)

作为用户，我希望选择一张表的字段，选择聚合统计方式，配置 WHERE 筛选条件，配置排序，就能生成对应的 SQL 语句。

**Why this priority**: 核心功能，用户的核心诉求，用于替代手动编写简单 SQL。

**Independent Test**: 选择 orders 表的 id、amount 字段，对 amount 使用 SUM，添加 WHERE 条件 `created_at >= '2024-01-01' AND amount > 100`，选择按 amount 降序，能生成正确的聚合 SQL。

**Acceptance Scenarios**:
1. **Given** 已导入的表，**When** 用户选择一张表作为主表，**Then** 右侧字段选择区显示该表所有字段
2. **Given** 显示的字段列表，**When** 用户勾选 amount 字段并选择"SUM"统计方式，**Then** 该字段显示为 `SUM(amount) AS 订单总额`（注释作为别名）
3. **Given** 已选字段列表，**When** 用户为某字段选择"升序"/"降序"，**Then** 排序配置区显示该字段及其排序方式
4. **Given** 所有配置完成，**When** 用户点击"生成"按钮，**Then** Monaco Editor 区域显示完整的 SELECT 语句（含聚合、WHERE、ORDER BY）
5. **Given** 生成的 SQL，**When** 用户点击"复制"按钮，**Then** SQL 文本被复制到剪贴板

---

### User Story 3.1 - WHERE 条件配置 (Priority: P1)

作为用户，我希望添加 WHERE 筛选条件，包括字段、运算符、值，支持多条件 AND/OR 组合，以便精确筛选数据。

**Why this priority**: 查询场景中最常用的功能，用户明确提出需要支持 >=、=、LIKE 等运算符。

**Independent Test**: 添加条件 `amount >= 100 AND status = 'paid'`，生成的 SQL 包含 `WHERE amount >= 100 AND status = 'paid'`。

**Acceptance Scenarios**:
1. **Given** 已选择主表，**When** 用户点击"添加条件"按钮，**Then** 条件行展示：字段下拉框（显示字段名+注释）、运算符下拉框、值输入框
2. **Given** 条件行，**When** 用户展开运算符下拉框，**Then** 显示支持的运算符：`=`、`!=`、`>`、` <`、`>=`、`<=`、`LIKE`、`IN`、`NOT IN`、`IS NULL`、`IS NOT NULL`、`BETWEEN`
3. **Given** 字段为 varchar/char 类型，**When** 用户选择 `LIKE` 运算符，**Then** 值输入框提示"支持 % 通配符"
4. **Given** 字段为 varchar/char 类型，**When** 用户选择 `IN` 运算符，**Then** 值输入框提示"格式：value1,value2,value3"，实际输出 `IN ('value1','value2','value3')`
5. **Given** 字段为 date/datetime 类型，**When** 用户选择 `BETWEEN` 运算符，**Then** 值输入框变为双字段，提示"格式：起始值 AND 结束值"，实际输出 `BETWEEN '2024-01-01' AND '2024-12-31'`
6. **Given** 字段允许 NULL，**When** 用户选择 `IS NULL` 或 `IS NOT NULL`，**Then** 值输入框隐藏
7. **Given** 已添加多条条件，**When** 用户在两条条件之间选择"AND"或"OR"连接符，**Then** 连接符显示在两条条件之间，生成时按顺序拼接（支持括号优先级由用户手动在 SQL 中调整）
8. **Given** 已添加条件，**When** 用户删除某条条件，**Then** 该条件行移除，SQL 重新生成
9. **Given** 联表查询场景，**When** 用户添加 WHERE 条件，**Then** 字段下拉框显示主表字段和所有联表字段，生成时字段自动加上表别名（如 `orders.amount >= 100`）
10. **Given** GROUP BY 已配置，**When** 用户添加 WHERE 条件，**Then** WHERE 条件位于 GROUP BY 之前（标准 SQL 语序）

---

### User Story 4 - 多表联查 (Priority: P1)

作为用户，我希望在选择主表后，能联查其他表，手动指定 ON 匹配字段，选择联表中的字段，生成多表 JOIN 的 SQL。

**Why this priority**: 核心功能，用户明确提出需要联表能力，支持 INNER/LEFT/RIGHT JOIN。

**Independent Test**: 选择 orders 为主表，联查 users 表，指定 orders.user_id = users.id，选择 users.username 和 SUM(orders.amount)，能生成正确的 JOIN SQL。

**Acceptance Scenarios**:
1. **Given** 已选择主表，**When** 用户点击"添加联表"并选择另一张表，**Then** 联表配置区显示该联表，可选择 JOIN 类型（INNER/LEFT/RIGHT）
2. **Given** 联表配置区，**When** 用户为联表选择 ON 条件字段（左表字段 = 右表字段），**Then** ON 条件被记录并展示
3. **Given** 联表已配置，**When** 用户在联表字段区勾选 users.username，**Then** 该字段加入 SELECT 列表
4. **Given** 联表字段区，**When** 用户对某联表数值字段选择 SUM/AVG 等统计方式，**Then** 该字段显示为 `SUM(orders.amount) AS 订单总额` 并加入 SELECT

---

### User Story 5 - AI 校验与风险评估 (Priority: P1)

作为用户，我希望对生成的 SQL 进行 AI 校验和风险评估，知道 SQL 是否有语法错误或潜在风险。

**Why this priority**: 用户明确提出的质量保障需求，帮助非DBA用户避免常见错误。

**Independent Test**: 生成一条无 LIMIT 的全表扫描 SQL，点击"AI校验"能得到反馈，点击"风险评估"能识别出高风险项。

**Acceptance Scenarios**:
1. **Given** Monaco Editor 中的 SQL 语句，**When** 用户点击"AI校验"按钮，**Then** 调用用户配置的 AI 接口，返回语法/逻辑校验结果
2. **Given** Monaco Editor 中的 SQL 语句，**When** 用户点击"风险评估"按钮，**Then** 本地规则引擎扫描，返回风险等级（高/中/低）及具体风险项列表
3. **Given** SQL 存在风险（如 SELECT *），**When** 风险评估完成，**Then** 显示"高风险"标签及风险说明："检测到 SELECT * ，建议明确指定字段"
4. **Given** SQL 存在全表扫描风险，**When** 风险评估完成，**Then** 显示"高风险"标签及风险说明："WHERE 子句缺少索引字段，可能导致全表扫描"

---

### User Story 6 - SQL 手动编辑 (Priority: P2)

作为用户，我希望在生成 SQL 后能手动修改，以便微调 AI 无法理解的边界情况。

**Why this priority**: 工具生成的 SQL 可能不完全满足需求，手动编辑是必要的兜底手段。

**Independent Test**: 生成的 SQL 手动修改了 WHERE 条件后，复制出的 SQL 是修改后的内容。

**Acceptance Scenarios**:
1. **Given** 生成的 SQL，**When** 用户在 Monaco Editor 中修改 SQL 内容，**Then** 修改被实时保存，再次生成会基于修改后的内容重新生成
2. **Given** 用户手动编辑了 SQL，**When** 用户再次点击"生成"按钮，**Then** 弹窗提示："是否覆盖当前编辑？"，确认后重新生成，取消则保留手动编辑

---

### User Story 7 - 联表字段筛选（按库/按标签） (Priority: P1)

作为用户，我希望在选择主表和联表时，能按库层级查找，也能按标签快速筛选，方便在大量表中快速定位。

**Why this priority**: 用户强调的核心效率需求，在多数据库、多表场景下快速找到目标表。

**Independent Test**: 有 20 张表的数据库，通过点击"核心"标签，能筛选出打该标签的 5 张表。

**Acceptance Scenarios**:
1. **Given** 主表/联表选择区，**When** 用户在库-表层级树中逐级展开选择，**Then** 能准确定位到具体表
2. **Given** 主表/联表选择区，**Then** 标签筛选栏横向展示所有已创建标签，点击标签只显示打该标签的表
3. **Given** 标签筛选和库-表层级同时存在，**Then** 两者交集：先按标签筛选出表，再在已筛选的表中按库-表层级选择

---

## Requirements

### Functional Requirements

- **FR-001**: 系统 MUST 支持导入 JSON 格式的数据库元数据（库/表/字段/字段注释）
- **FR-002**: 系统 MUST 以树形结构展示库→表→字段，支持折叠/展开
- **FR-003**: 系统 MUST 支持用户创建、删除、重命名标签
- **FR-004**: 系统 MUST 支持在数据库下批量选择表，为其添加/移除标签
- **FR-005**: 系统 MUST 支持按标签筛选表，同时显示匹配结果数量
- **FR-006**: 系统 MUST 支持选择主表，并从该表选择原始字段
- **FR-007**: 系统 MUST 支持对数值字段选择聚合方式（SUM/AVG/COUNT/MAX/MIN），聚合字段以字段注释作为别名
- **FR-008**: 系统 MUST 支持为已选字段配置排序方式（升序 ASC/降序 DESC/不排序）
- **FR-009**: 系统 MUST 支持添加 WHERE 条件，条件组成为：字段 + 运算符 + 值
- **FR-010**: 系统 MUST 支持 WHERE 运算符：`=`、`!=`、`>`、`<`、`>=`、`<=`、`LIKE`、`IN`、`NOT IN`、`IS NULL`、`IS NOT NULL`、`BETWEEN`
- **FR-011**: 系统 MUST 支持 IN 运算符的值格式为逗号分隔多值，生成 `IN ('val1','val2',...)`
- **FR-012**: 系统 MUST 支持 BETWEEN 运算符的双值输入，生成 `BETWEEN 'start' AND 'end'`
- **FR-013**: 系统 MUST 支持 IS NULL / IS NOT NULL 运算符时隐藏值输入框
- **FR-014**: 系统 MUST 支持多条件之间的 AND/OR 连接符
- **FR-015**: 系统 MUST 支持删除已添加的 WHERE 条件
- **FR-016**: 系统 MUST 支持联表查询中的 WHERE 条件字段自动加上表别名
- **FR-017**: 系统 MUST 支持添加联表，选择 JOIN 类型（INNER/LEFT/RIGHT）
- **FR-018**: 系统 MUST 支持为联表配置 ON 条件字段（左表字段 = 右表字段）
- **FR-019**: 系统 MUST 支持从联表选择原始字段或统计后字段加入 SELECT
- **FR-020**: 系统 MUST 支持点击"生成"输出完整 SQL 语句
- **FR-021**: 系统 MUST 支持 Monaco Editor 展示和编辑 SQL
- **FR-022**: 系统 MUST 支持"AI校验"功能，调用外部 AI 接口返回校验结果
- **FR-023**: 系统 MUST 支持"风险评估"功能，本地规则扫描并返回风险等级
- **FR-024**: 系统 MUST 支持一键复制 SQL 到剪贴板

### Risk Rules（风险评估规则）

- **RR-001**: 高风险 — SQL 包含 `SELECT *`（建议明确指定字段）
- **RR-002**: 高风险 — 查询无 LIMIT 子句且返回结果无上限（无 WHERE 条件或 WHERE 条件无法有效限制结果集）
- **RR-003**: 高风险 — WHERE 子句中对索引字段使用函数或运算（如 `WHERE YEAR(created_at) = 2024`、`WHERE price * 1.1 > 100`）
- **RR-004**: 高风险 — WHERE 子句使用 `LIKE '%xxx'`（以通配符开头）导致无法使用索引
- **RR-005**: 高风险 — WHERE 子句使用 `OR` 连接且无索引覆盖（如 `WHERE a = 1 OR b = 2`）
- **RR-006**: 中风险 — OFFSET 值较大（>1000）可能导致深分页性能问题
- **RR-007**: 中风险 — 多表联查（≥3表）且缺少合适的 ON 条件
- **RR-008**: 中风险 — IN 子句包含大量值（>100），可能导致性能问题
- **RR-009**: 低风险 — 未指定排序方式，大结果集可能每次返回顺序不一致
- **RR-010**: 低风险 — 使用了 `SQL_CALC_FOUND_ROWS`（已废弃）
- **RR-011**: 低风险 — WHERE 条件使用字符串拼接而非参数化查询（AI 校验检测）

### Key Entities

- **Database**: 数据库节点，包含名称、注释、子表列表
- **Table**: 数据表节点，包含名称、注释、标签列表、字段列表、所属数据库
- **Field**: 字段节点，包含名称、类型、注释、是否支持聚合（数值类型支持）
- **Tag**: 标签实体，包含唯一ID、名称
- **SelectedField**: 已选字段，包含字段引用、聚合方式（无/SUM/AVG/COUNT/MAX/MIN）、排序方式、别名
- **WhereCondition**: WHERE 条件，包含字段引用、运算符（=, !=, >, <, >=, <=, LIKE, IN, NOT IN, IS NULL, IS NOT NULL, BETWEEN）、值（单值/多值/BETWEEN双值）、连接符（AND/OR，与下一条件的关系）
- **JoinConfig**: 联表配置，包含被联表、JOIN类型（INNER/LEFT/RIGHT）、ON条件字段对（左表字段、右表字段）
- **SQLDraft**: SQL草稿，包含SELECT列表、FROM主表、JOIN列表、WHERE条件列表、GROUP BY列表（可选）、ORDER BY列表、LIMIT（可选）

## Success Criteria

### Measurable Outcomes

- **SC-001**: 用户可在 30 秒内完成 JSON 导入并看到完整的库-表-字段树
- **SC-002**: 用户可在 3 步内（创建标签→批量选表→打标签）为表打上标签
- **SC-003**: 用户可在 10 秒内通过标签筛选从 20 张表中定位到目标表
- **SC-004**: 生成的单表聚合 SQL 语法正确，执行结果与预期一致
- **SC-005**: 生成的两表 JOIN SQL 语法正确，ON 条件准确，执行结果与预期一致
- **SC-006**: 添加 WHERE 条件后，生成的 SQL 包含正确的 WHERE 子句，字段自动加表别名
- **SC-007**: IN / BETWEEN / IS NULL 等特殊运算符生成 SQL 格式正确
- **SC-008**: 多条件 AND/OR 连接生成 SQL 正确
- **SC-009**: AI 校验能识别出明确的 SQL 语法错误并给出修改建议
- **SC-010**: 风险评估对 RR-001 至 RR-011 规则均能正确识别并提示
- **SC-011**: SQL 可一键复制，复制成功有视觉反馈（提示文字）

## Assumptions

- 用户通过外部脚本（如 mysqldump）从已有数据库导出 JSON 元数据，不从此工具直连数据库
- AI 校验使用用户自行配置的 AI 接口（Claude/GPT API），工具不内置 AI 能力
- 风险评估使用本地规则引擎，不调用外部 AI
- 标签数据存储在浏览器 localStorage，随 JSON 导入时一起持久化（嵌入 JSON 中）
- Monaco Editor 使用开源版本，不涉及商业许可问题
