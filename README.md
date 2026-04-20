# SQL Query Agent

可视化 SQL 填写工具，通过图形界面选择字段、配置条件、设置关联，快速生成 SQL 查询语句。

## 功能特性

- **多格式导入**：支持 JSON 和 SQL DDL 格式导入表结构
- **字段选择**：支持主表和关联表字段选择，配合聚合函数（SUM、AVG、COUNT、MAX、MIN）
- **条件构建**：支持 =、!=、>、<、LIKE、IN、BETWEEN、IS NULL 等运算符
- **多表关联**：支持 INNER/LEFT/RIGHT JOIN，跨库关联
- **SQL 生成**：实时预览生成 SQL，支持格式化
- **AI 校验**：自动检测 SQL 问题并提供优化建议
- **风险评估**：11 条风险规则检测
- **标签管理**：对表进行分类筛选
- **主题切换**：支持深色/浅色模式
- **本地持久化**：数据存储在浏览器 localStorage

## 快速开始

```bash
# 克隆项目
git clone https://github.com/ohhxj/sql-query-agent.git

# 安装依赖
npm install

# 开发模式
npm run dev

# 构建生产版本
npm run build
```

## 技术栈

- React + TypeScript
- Vite
- Tailwind CSS
- Monaco Editor（SQL 编辑器）
- Zustand（状态管理）

## 支持的数据格式

### JSON 格式
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

### SQL DDL 格式
```sql
CREATE TABLE orders (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '订单ID',
    order_no VARCHAR(32) NOT NULL COMMENT '订单号',
    amount DECIMAL(10,2) DEFAULT 0 COMMENT '订单金额'
) COMMENT '订单表';
```

## 项目结构

```
src/
├── components/
│   ├── Header/           # 顶栏（导入、主题切换）
│   ├── Sidebar/          # 侧边栏
│   │   ├── DatabaseTree.tsx  # 库-表-字段树
│   │   └── TagFilter.tsx      # 标签筛选
│   ├── QueryBuilder/     # 查询构建
│   │   ├── FieldSelector.tsx # 字段选择
│   │   ├── WhereBuilder.tsx   # WHERE 条件
│   │   ├── JoinConfig.tsx     # 表关联
│   │   └── OrderByLimit.tsx   # 排序和 LIMIT
│   ├── SQLPreview/       # SQL 预览
│   └── Validation/       # 校验
│       ├── AIValidator.tsx    # AI 校验
│       └── RiskPanel.tsx      # 风险评估
├── stores/               # Zustand 状态管理
├── utils/                # 工具函数
└── types/                # TypeScript 类型定义
```

## 开源协议

MIT License
# update
