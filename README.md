# SQL 填写 Agent

## 项目信息

**项目路径**: `/Users/reshui/Downloads/rs-project/github项目/sql-project`

## 本地运行

```bash
cd /Users/reshui/Downloads/rs-project/github项目/sql-project
npm run dev
```

**开发服务器地址**: http://localhost:5173/

## 构建生产版本

```bash
npm run build
```

构建产物在 `dist/` 目录

## 技术栈

- React + TypeScript
- Vite
- Tailwind CSS
- Monaco Editor（SQL 编辑器）
- Zustand（状态管理）

## 项目结构

```
sql-project/
├── src/
│   ├── components/
│   │   ├── Header/           # 顶栏（导入、主题切换）
│   │   ├── Sidebar/
│   │   │   ├── DatabaseTree.tsx  # 库-表-字段树
│   │   │   └── TagFilter.tsx      # 标签筛选
│   │   ├── QueryBuilder/
│   │   │   ├── FieldSelector.tsx # 字段选择
│   │   │   ├── WhereBuilder.tsx   # WHERE 条件
│   │   │   ├── JoinConfig.tsx     # 表关联
│   │   │   └── OrderByLimit.tsx   # 排序和 LIMIT
│   │   ├── SQLPreview/       # SQL 预览（Monaco Editor）
│   │   └── Validation/
│   │       ├── AIValidator.tsx    # AI 校验
│   │       └── RiskPanel.tsx      # 风险评估
│   ├── stores/
│   │   ├── useDatabaseStore.ts   # 数据库结构状态
│   │   └── useQueryBuilderStore.ts # 查询构建状态
│   ├── utils/
│   │   ├── jsonParser.ts      # JSON 解析器
│   │   ├── sqlGenerator.ts   # SQL 生成器
│   │   └── riskChecker.ts     # 风险评估规则
│   └── types/
│       └── index.ts            # TypeScript 类型定义
├── specs/
│   └── 001-sql-query-agent/
│       ├── spec.md         # 功能规格说明书
│       ├── plan.md         # 技术实现计划
│       ├── tasks.md        # 任务拆解
│       └── ui-spec.md      # UI 设计规范
└── package.json
```

## 功能说明

### 支持的 JSON 格式

**1. DBA 导出格式（单表）**
```json
{
  "header": [["列名","列类型",...]],
  "data": [
    {"列名": "id", "列类型": "int(10)", "列说明": "ID"}
  ]
}
```

**2. 标准格式（多库多表）**
```json
{
  "databases": [{
    "name": "shop_db",
    "tables": [{
      "name": "orders",
      "comment": "订单表",
      "fields": [
        {"name": "id", "type": "int", "comment": "订单ID"}
      ]
    }]
  }]
}
```

### 功能清单

- [x] JSON 导入（支持 DBA 导出格式）
- [x] 库-表-字段三层树形展示
- [x] 标签管理（创建、删除、筛选）
- [x] 字段选择（原始字段 + 聚合统计）
- [x] WHERE 条件构建（=、!=、>、<、LIKE、IN、BETWEEN、IS NULL 等）
- [x] 多表关联（INNER/LEFT/RIGHT JOIN）
- [x] 排序配置（升序/降序）
- [x] LIMIT 配置
- [x] SQL 生成
- [x] Monaco Editor SQL 编辑
- [x] AI 校验（模拟）
- [x] 风险评估（11 条规则）
- [x] 本地持久化（localStorage）
- [x] 深色/浅色主题切换

### 待完成

- [ ] 多表导入后按表名自动关联
- [ ] AI 校验接入真实 API
- [ ] 完整的测试覆盖

## 快捷命令

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建
npm run build

# 预览构建结果
npm run preview
```

## 测试数据

测试用 JSON 文件位于：`/Users/reshui/Downloads/field.json`
