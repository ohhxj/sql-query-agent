# UI Design Specification: SQL 填写 Agent

**Version**: 1.0 | **Date**: 2026-04-19 | **Status**: Draft

---

## 1. Concept & Vision

**"The Developer's Notebook"** — A SQL writing tool that feels like a modern IDE crossed with a clean productivity app. Professional enough for serious query building, approachable enough that anyone can use it without SQL expertise.

The experience should evoke the feeling of writing in a well-organized notebook: structured sections, clear hierarchy, instant feedback. Dark mode primary (developers expect it), with a warm, slightly desaturated palette that feels less "harsh tech" and more "crafted tool."

**Core interaction metaphor**: You have a toolbox on the left (your database schema), you select components and assemble them in the center workspace, and the output appears in the preview pane — like selecting parts from a catalog and watching the machine assemble itself.

---

## 2. Design Language

### Aesthetic Direction
**Reference**: Linear meets VS Code — precise, information-dense, but with refined typography and subtle depth. Not the cold blue of enterprise software; warmer, more human.

### Color Palette

#### Dark Theme (Primary)
```css
:root {
  /* Backgrounds - layered depth */
  --bg-base: #0C0C0E;           /* Deepest layer - main background */
  --bg-surface: #141417;          /* Cards, panels */
  --bg-elevated: #1C1C21;        /* Modals, dropdowns, hover states */
  --bg-overlay: #252529;          /* Tooltips, popovers */

  /* Borders & Dividers */
  --border-subtle: #2A2A30;      /* Subtle separators */
  --border-default: #3A3A42;     /* Default borders */
  --border-strong: #4A4A55;      /* Emphasized borders */

  /* Text */
  --text-primary: #F0F0F2;       /* Headings, primary content */
  --text-secondary: #A0A0A8;     /* Labels, secondary content */
  --text-tertiary: #6A6A72;      /* Placeholders, disabled */
  --text-inverse: #0C0C0E;       /* Text on light backgrounds */

  /* Primary - Teal/Cyan accent */
  --primary-50: #E6FFFA;
  --primary-100: #B5FFED;
  --primary-200: #7FFFDD;
  --primary-300: #4DFFD2;
  --primary-400: #2AEDBA;
  --primary-500: #1DD6A8;        /* Primary brand color */
  --primary-600: #14A882;        /* Primary hover */
  --primary-700: #0D7D61;        /* Primary active */

  /* Accent - Warm Amber for highlights, warnings */
  --accent-50: #FFF8E6;
  --accent-100: #FFEAB3;
  --accent-200: #FFD980;
  --accent-300: #FFC84D;
  --accent-400: #FFB81A;         /* Accent default */
  --accent-500: #E5A00D;         /* Accent hover */

  /* Semantic - Risk colors */
  --risk-high: #FF4757;          /* Red - High risk */
  --risk-high-bg: rgba(255, 71, 87, 0.12);
  --risk-medium: #FFA502;         /* Orange - Medium risk */
  --risk-medium-bg: rgba(255, 165, 2, 0.12);
  --risk-low: #7BED9F;            /* Green - Low/Pass */
  --risk-low-bg: rgba(123, 237, 159, 0.12);

  /* SQL Syntax Highlighting (Monaco compatible) */
  --sql-keyword: #FF79C6;         /* SELECT, FROM, WHERE - pink */
  --sql-function: #50FA7B;        /* SUM, COUNT, AVG - green */
  --sql-string: #F1FA8C;          /* 'string values' - yellow */
  --sql-number: #BD93F9;          /* numbers - purple */
  --sql-operator: #FF79C6;         /* =, >, <, AND, OR - pink */
  --sql-comment: #6272A4;         /* comments - muted blue */
}
```

#### Light Theme
```css
.light {
  --bg-base: #FAFAFA;
  --bg-surface: #FFFFFF;
  --bg-elevated: #F5F5F7;
  --bg-overlay: #EBEBED;

  --border-subtle: #E8E8EC;
  --border-default: #D0D0D8;
  --border-strong: #B0B0B8;

  --text-primary: #1A1A1E;
  --text-secondary: #6A6A72;
  --text-tertiary: #A0A0A8;

  --primary-500: #0D9F7E;
  --primary-600: #0A8A6A;
  --accent-400: #E5A00D;

  --risk-high: #DC3545;
  --risk-medium: #FD7E14;
  --risk-low: #28A745;
}
```

### Typography

**UI Font**: `"DM Sans", "PingFang SC", system-ui, sans-serif`
- Headings: DM Sans Medium (500) or SemiBold (600)
- Body/Labels: DM Sans Regular (400)
- Captions: DM Sans Regular, 12px

**Monospace (SQL Editor)**: `"JetBrains Mono", "Fira Code", "SF Mono", monospace`
- SQL content: JetBrains Mono Regular, 14px
- SQL line numbers: JetBrains Mono, 12px, tertiary color

**Scale**:
```
--text-xs: 11px;
--text-sm: 12px;
--text-base: 14px;
--text-lg: 16px;
--text-xl: 18px;
--text-2xl: 24px;
--text-3xl: 32px;
```

### Spatial System

**Base unit**: 4px

```
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
```

**Border Radius**:
```
--radius-sm: 4px;     /* Buttons, inputs */
--radius-md: 6px;     /* Cards, panels */
--radius-lg: 8px;     /* Modals, large containers */
--radius-xl: 12px;    /* Special containers */
```

**Shadows**:
```
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
--shadow-md: 0 4px 12px rgba(0, 0, 0, 0.4);
--shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.5);
--shadow-glow: 0 0 20px rgba(29, 214, 168, 0.15); /* Primary glow */
```

### Motion Philosophy

**Principle**: "Purposeful and quick" — animations should guide attention and confirm actions, never delay them.

**Timing**:
```
--duration-instant: 50ms;   /* Hover states, toggles */
--duration-fast: 150ms;      /* Buttons, small elements */
--duration-normal: 250ms;     /* Panels, modals */
--duration-slow: 400ms;      /* Page transitions, reveals */
```

**Easing**:
```
--ease-out: cubic-bezier(0.16, 1, 0.3, 1);      /* Primary - smooth deceleration */
--ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);  /* Symmetric animations */
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1); /* Bouncy, for selections */
```

**Key Animations**:
- **Tree expand/collapse**: Height 0 → auto, 200ms ease-out, with chevron rotation
- **Checkbox/Select**: Scale 0.95 → 1 with spring easing (50ms)
- **Panel slide**: Translate Y 8px → 0 + opacity, 250ms ease-out
- **Button hover**: Background color 150ms, scale 1 → 1.02
- **Risk badge appear**: Scale 0.8 → 1 + opacity, 200ms spring
- **Monaco focus**: Box-shadow glow 300ms ease-out
- **Tag appear**: Scale 0 → 1, 150ms spring, stagger 30ms between tags

---

## 3. Layout & Structure

### Page Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  HEADER (56px fixed)                                                         │
│  ┌─────────────────────┐  ┌──────────────────────────────────────────────┐  │
│  │ ◈ SQL Query Agent   │  │  [Import JSON]  [Theme Toggle]  [Settings]   │  │
│  └─────────────────────┘  └──────────────────────────────────────────────┘  │
├──────────────────┬──────────────────────────────────────────────────────────┤
│  SIDEBAR (320px) │  MAIN WORKSPACE                                          │
│  ┌──────────────┐│  ┌────────────────────────────────────────────────────┐  │
│  │ 🔍 Search    ││  │  QUERY BUILDER PANEL (collapsible)                │  │
│  ├──────────────┤│  │  ┌──────────────────────────────────────────────┐  │  │
│  │ Tags Filter  ││  │  │ Main Table: [Dropdown]                       │  │  │
│  │ [tag][tag][+] ││  │  │ Fields: ☐ id  ☐ username  ☑ amount[SUM]   │  │  │
│  ├──────────────┤│  │  └──────────────────────────────────────────────┘  │  │
│  │ Database Tree ││  │  ┌──────────────────────────────────────────────┐  │  │
│  │ ├─ shop_db   ││  │  │ WHERE: [field ▼][op ▼][value] AND            │  │  │
│  │ │  ├─ orders ││  │  │       [field ▼][op ▼][value]                 │  │  │
│  │ │  │  ├─ id  ││  │  └──────────────────────────────────────────────┘  │  │
│  │ │  │  ├─ ... ││  │  ┌──────────────────────────────────────────────┐  │  │
│  │ │  └─ users  ││  │  │ JOIN: [table ▼] [type ▼] ON [field]=[field]  │  │  │
│  │ └─ erp_db    ││  │  └──────────────────────────────────────────────┘  │  │
│  └──────────────┘│  │  ┌──────────────────────────────────────────────┐  │  │
│                  │  │  │ ORDER BY: amount ↓  LIMIT: [100]             │  │  │
│                  │  │  └──────────────────────────────────────────────┘  │  │
│                  │  │  [Generate SQL]                                     │  │
│                  │  └────────────────────────────────────────────────────┘  │
│                  │  ┌────────────────────────────────────────────────────┐  │
│                  │  │  SQL PREVIEW                                       │  │
│                  │  │  ┌──────────────────────────────────────────────┐  │  │
│                  │  │  │ 1 │ SELECT                                    │  │  │
│                  │  │  │ 2 │   users.username AS "用户名",             │  │  │
│                  │  │  │ 3 │   SUM(orders.amount) AS "订单总额"        │  │  │
│                  │  │  │ 4 │ FROM orders                               │  │  │
│                  │  │  │ 5 │ ...                                      │  │  │
│                  │  │  └──────────────────────────────────────────────┘  │  │
│                  │  │  [Copy] [Format] [AI Validate] [Risk Check]        │  │
│                  │  └────────────────────────────────────────────────────┘  │
│                  │  ┌────────────────────────────────────────────────────┐  │
│                  │  │  VALIDATION PANEL (collapsible)                    │  │
│                  │  │  ┌────────┐ ┌────────┐ ┌────────┐                  │  │
│                  │  │  │ 🔴高风险│ │ 🟡中风险│ │ 🟢低风险│                  │  │
│                  │  │  └────────┘ └────────┘ └────────┘                  │  │
│                  │  │  • 检测到 SELECT *                                │  │
│                  │  │  • 缺少 LIMIT 子句                                │  │
│                  │  └────────────────────────────────────────────────────┘  │
│                  │                                                         │
└──────────────────┴──────────────────────────────────────────────────────────┘
```

### Responsive Strategy

**Breakpoints**:
```
sm: 640px   - Not primary target, basic stack
md: 768px   - Tablet, sidebar collapses to icons
lg: 1024px  - Primary desktop, full layout
xl: 1280px  - Wide desktop, expanded sidebar
2xl: 1536px - Ultra-wide, max content width 1400px
```

**Responsive Behaviors**:
- **≥1024px (lg)**: Full three-column layout as shown
- **768-1023px (md)**: Sidebar collapses to icon-only (48px), expandable on hover/click
- **<768px (sm)**: Stack vertically — sidebar becomes top drawer, workspace full-width

### Visual Pacing

**Header**: Minimal, 56px, subtle bottom border. Logo left, actions right. Stays fixed.

**Sidebar**: 320px fixed width, scrollable internally. Three sections stacked:
1. Search (sticky top)
2. Tags filter (horizontal scroll if many tags)
3. Database tree (flex-grow, scrollable)

**Main Workspace**: Flexible width, divided into collapsible panels:
1. **Query Builder** (primary interaction zone) — gets attention by being first
2. **SQL Preview** (output zone) — Monaco Editor, visually distinct as "result"
3. **Validation Panel** — hidden by default, slides up when triggered

---

## 4. Component Specifications

### 4.1 Database Tree

**Purpose**: Hierarchical view of imported databases, tables, and fields.

**Structure**:
```
├── Database (collapsible)
│   ├── Table (collapsible, selectable)
│   │   ├── Field (leaf node, selectable)
│   │   ├── Field
│   │   └── Field
│   └── Table
└── Database
```

**Visual States**:

| State | Appearance |
|-------|------------|
| Default | Text secondary color, subtle hover background |
| Hover | bg-elevated, text-primary |
| Selected (table as main) | Primary color left border (3px), primary/10 background |
| Selected (table for join) | Accent color left border (3px), accent/10 background |
| Expanded | Chevron rotated 90°, children visible |
| Collapsed | Chevron right, children hidden |
| Disabled | Opacity 0.5, cursor not-allowed |
| Loading | Skeleton pulse animation |

**Field Node Display**:
```
┌────────────────────────────────────────┐
│ 🔤 id          int(11)     订单ID       │
│ 🔤 user_id     int(11)     用户ID       │
│ 💰 amount      decimal     订单金额     │
│ 📅 created_at  datetime    下单时间     │
└────────────────────────────────────────┘
```
- Icon: 🔤 (varchar/char), 🔢 (int/numeric), 💰 (decimal/float), 📅 (date/datetime), 🔘 (boolean), 📦 (other)
- Field name: text-primary, medium weight
- Type: text-tertiary, monospace
- Comment: text-secondary, in quotes

**Interactions**:
- Click chevron or double-click name: Toggle expand
- Click table name: Select as main table (single select)
- Right-click table: Context menu (Add to Join, Add Tag, Copy Name)
- Ctrl/Cmd + Click: Add to multi-select for batch tagging
- Drag table: To join zone or field selector

**Animation**:
- Expand: Children fade in staggered (30ms delay each), height animate
- Collapse: Reverse, 150ms
- Chevron rotation: 200ms ease-out

---

### 4.2 Tag Filter Bar

**Purpose**: Quick filtering of tables by user-defined tags.

**Layout**: Horizontal scrollable row of tag chips, plus "New Tag" button.

**Tag Chip States**:

| State | Appearance |
|-------|------------|
| Default | bg-elevated, text-secondary, subtle border |
| Hover | border-strong, text-primary |
| Active/Selected | primary/20 background, primary border, primary text |
| With Count | Badge showing number of tables with that tag |

**Visual**:
```
[ 🏷️ 电商 (5)] [ 🏷️ 用户 (3)] [ 🏷️ 核心 (2)] [ + New Tag ]
```

**Interactions**:
- Click tag: Toggle filter (multiple tags = OR logic)
- Click "New Tag": Inline input appears, type name + Enter to create
- Hover tag: Shows × button to delete
- Empty state: "No tags yet. Create one to organize your tables."

---

### 4.3 Field Selector

**Purpose**: Select which fields to include in SELECT clause, optionally apply aggregation.

**Layout**: Checkbox list with optional aggregate dropdown per field.

**Field Row**:
```
┌─────────────────────────────────────────────────────────────────┐
│ ☑ 💰 amount        订单金额        [SUM ▼]                    │
└─────────────────────────────────────────────────────────────────┘
```
- Checkbox: Left, 18×18px
- Field icon + name: text-primary
- Field comment: text-secondary
- Aggregate dropdown: Right, only appears when field is numeric

**Aggregate Dropdown Options**:
```
原始（无聚合）
SUM(求和)
AVG(平均值)
COUNT(计数)
MAX(最大值)
MIN(最小值)
```

**When Aggregated**: Field displays as `SUM(amount) AS "订单总额"` in preview, automatically added to GROUP BY if other non-aggregated fields exist.

**States**:

| State | Appearance |
|-------|------------|
| Unselected | Checkbox empty, text-secondary |
| Selected (no aggregate) | Checkbox filled primary, text-primary |
| Selected (with aggregate) | Checkbox filled primary, aggregate badge shown |
| Disabled (not applicable) | Hidden completely |

---

### 4.4 WHERE Condition Builder

**Purpose**: Visually construct WHERE clauses with field + operator + value + connector logic.

**Single Condition Row**:
```
┌──────────────────────────────────────────────────────────────────────────────┐
│ [orders.amount ▼]  [ >= ▼]  [ 100 ]                    [AND ▼]  [ 🗑️ ]      │
└──────────────────────────────────────────────────────────────────────────────┘
```
- Field dropdown: Shows all fields from main table + join tables, grouped by table
- Operator dropdown: =, !=, >, <, >=, <=, LIKE, IN, NOT IN, IS NULL, IS NOT NULL, BETWEEN
- Value input: Single input for most operators
- Connector: AND/OR dropdown (hidden on last item, first item has no connector)
- Delete button: 🗑️ icon, appears on hover

**Special Operator Behaviors**:

| Operator | Value Input Behavior |
|----------|---------------------|
| IN / NOT IN | Placeholder "value1, value2, value3", outputs `IN ('v1', 'v2', 'v3')` |
| BETWEEN | Two value inputs: "起始值" and "结束值" |
| IS NULL / IS NOT NULL | Value input hidden entirely |
| LIKE | Placeholder "支持 % 通配符", input shows % buttons |

**Multi-condition Layout**:
```
┌──────────────────────────────────────────────────────────────────────────────┐
│ [field ▼]  [ = ▼]  [ 'paid' ]                    [AND ▼]  [ 🗑️ ]          │
├──────────────────────────────────────────────────────────────────────────────┤
│                              ▼ AND                                           │
├──────────────────────────────────────────────────────────────────────────────┤
│ [field ▼]  [ >= ▼]  [ 100 ]                        [OR ▼]   [ 🗑️ ]          │
├──────────────────────────────────────────────────────────────────────────────┤
│                              ▼ OR                                            │
├──────────────────────────────────────────────────────────────────────────────┤
│ [field ▼]  [ IS NULL ▼]  [ - ]                                    [ 🗑️ ] │
└──────────────────────────────────────────────────────────────────────────────┘
```
- Connector appears between rows, centered
- Connector click cycles: AND → OR → AND
- "Add Condition" button below last row

**States**:

| State | Appearance |
|-------|------------|
| Empty | "No conditions. Click '+ Add Condition' to start." centered message |
| Valid | Green subtle left border on condition row |
| Warning | Orange left border if operator may cause risk (e.g., LIKE '%...') |
| Error | Red left border + tooltip if invalid (e.g., empty IN values) |

---

### 4.5 Join Config Panel

**Purpose**: Configure table joins with type and ON conditions.

**Single Join Row**:
```
┌──────────────────────────────────────────────────────────────────────────────┐
│ [users ▼]  [ LEFT JOIN ▼]  ON [orders.user_id ▼] = [users.id ▼]  [ 🗑️ ]    │
└──────────────────────────────────────────────────────────────────────────────┘
```
- Table dropdown: Filterable list of available tables (excluding main table)
- Join type dropdown: INNER JOIN, LEFT JOIN, RIGHT JOIN
- ON condition: Left field dropdown + "=" + Right field dropdown
- Delete: 🗑️ icon

**Layout for multiple joins**:
```
┌──────────────────────────────────────────────────────────────────────────────┐
│ [users ▼]  [ LEFT JOIN ▼]  ON [orders.user_id ▼] = [users.id ▼]  [ 🗑️ ]   │
├──────────────────────────────────────────────────────────────────────────────┤
│ [products ▼]  [ INNER JOIN ▼]  ON [orders.product_id ▼] = [products.id ▼]  │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Add Join Button**: Below joins, "+ Add Join Table"

**Validation**:
- Circular reference detection: If A joins B, B cannot join A
- Field type compatibility hint (warning if joining int to varchar)

---

### 4.6 ORDER BY & LIMIT

**Purpose**: Configure sorting for selected fields.

**Layout**:
```
┌─────────────────────────────────────────────────────────────────┐
│ ORDER BY                                                       │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ [amount ▼]  [ ↓ 降序 ▼]                      [ 🗑️ ]       │ │
│ └─────────────────────────────────────────────────────────────┘ │
│ [ + Add Sort ]                                                  │
│                                                                  │
│ LIMIT: [ 100 ] (留空表示不限制)                                   │
└─────────────────────────────────────────────────────────────────┘
```

**Sort Direction Options**:
- ↑ 升序 (ASC)
- ↓ 降序 (DESC)
- — 不排序 (移除 from ORDER BY)

---

### 4.7 SQL Preview (Monaco Editor)

**Purpose**: Display generated SQL with syntax highlighting, allow manual editing.

**Layout**:
```
┌─────────────────────────────────────────────────────────────────┐
│ SQL Preview                                    [Copy] [Format] │
├─────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │  1 │ SELECT                                                 │ │
│ │  2 │   users.username AS "用户名",                        │ │
│ │  3 │   SUM(orders.amount) AS "订单总额"                     │ │
│ │  4 │ FROM orders                                           │ │
│ │  5 │ LEFT JOIN users ON orders.user_id = users.id         │ │
│ │  6 │ WHERE orders.created_at >= '2024-01-01'              │ │
│ │  7 │ GROUP BY users.username                              │ │
│ │  8 │ ORDER BY SUM(orders.amount) DESC                     │ │
│ │  9 │ LIMIT 100                                             │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

**Monaco Configuration**:
- Language: mysql
- Theme: Custom dark theme matching our palette
- Font: JetBrains Mono, 14px
- Line numbers: On
- Minimap: Off (not needed for short queries)
- Word wrap: On
- Automatic layout: On

**Toolbar Actions**:
- **Copy**: Clipboard icon, copies full SQL, shows "Copied!" tooltip for 2s
- **Format**: Prettify SQL with proper indentation

**Focus State**: Subtle primary glow around editor border.

**Manual Edit Indication**: If user has edited the auto-generated SQL, show subtle indicator (small dot on tab) and "Manual edit" label.

---

### 4.8 AI Validation Panel

**Purpose**: Show AI-powered SQL validation results.

**Layout**:
```
┌─────────────────────────────────────────────────────────────────┐
│ AI Validation                                    [ Validate ] │
├─────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │                                                             │ │
│ │  🔍 Analyzing your SQL...                                  │ │
│ │                                                             │ │
│ │  ✓ Syntax: Correct                                         │ │
│ │  ⚠️ Logic: Consider adding a LIMIT clause                  │ │
│ │  ℹ️ Performance: The JOIN condition could benefit from     │ │
│ │      an index on orders.user_id                            │ │
│ │                                                             │ │
│ │  Suggested Fix:                                             │ │
│ │  ┌─────────────────────────────────────────────────────┐   │ │
│ │  │ -- Add LIMIT to prevent large result sets           │   │ │
│ │  │ LIMIT 1000                                          │   │ │
│ │  └─────────────────────────────────────────────────────┘   │ │
│ │  [Copy Suggested Fix]                                       │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

**States**:

| State | Appearance |
|-------|------------|
| Idle | "Click 'Validate' to check your SQL" placeholder |
| Loading | Animated dots, "Analyzing your SQL..." |
| Success (no issues) | Green checkmark, "✓ Validation passed - SQL looks good!" |
| Issues Found | List of items with severity icons |
| Error | Red icon, error message, suggest retry |

---

### 4.9 Risk Assessment Panel

**Purpose**: Show local rule-based risk assessment results.

**Layout**:
```
┌─────────────────────────────────────────────────────────────────┐
│ Risk Assessment                                  [ Check Risks]│
├─────────────────────────────────────────────────────────────────┤
│  ┌────────┐ ┌────────┐ ┌────────┐                              │
│  │ 🔴高风险│ │ 🟡中风险│ │ 🟢低风险│                              │
│  │   2    │ │   1    │ │   1    │                              │
│  └────────┘ └────────┘ └────────┘                              │
│                                                                  │
│  🔴 High Risk                                                    │
│  ├─ 检测到 SELECT *，建议明确指定字段                            │
│  │   └─ Suggestion: List specific columns instead               │
│  └─ 查询缺少 LIMIT 子句，可能返回大量数据                        │
│      └─ Suggestion: Add LIMIT 1000 or use pagination            │
│                                                                  │
│  🟡 Medium Risk                                                  │
│  └─ OFFSET 值较大 (>1000)，深分页可能较慢                       │
│      └─ Suggestion: Use cursor-based pagination instead          │
│                                                                  │
│  🟢 Low Risk                                                     │
│  └─ 未指定排序，大结果集返回顺序可能不一致                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Risk Badge Colors**:
- High: --risk-high background, white text
- Medium: --risk-medium background, dark text
- Low: --risk-low background, dark text

---

### 4.10 Action Buttons

**Primary Button** (Generate SQL):
```
Background: primary-500
Text: white
Padding: 10px 20px
Border-radius: 6px
Hover: primary-600 + scale(1.02) + shadow-glow
Active: primary-700 + scale(0.98)
Disabled: opacity 0.5, cursor not-allowed
Loading: Spinner icon + "Generating..."
```

**Secondary Button** (Copy, Format):
```
Background: transparent
Border: border-default
Text: text-secondary
Padding: 8px 16px
Border-radius: 6px
Hover: bg-elevated + border-strong + text-primary
Active: bg-overlay
```

**Danger Button** (Delete):
```
Background: transparent
Text: risk-high
Hover: risk-high-bg background
```

---

## 5. Component States Summary

### Empty States

| Component | Empty State Message |
|------------|---------------------|
| Database Tree | "Import a JSON file to view your database schema" + Import button |
| Tags | "No tags yet. Create one to organize your tables." + New Tag button |
| Fields Selected | "Select fields from the tree or search above" |
| WHERE Conditions | "No conditions. Click '+ Add Condition' to start." |
| JOIN Config | "No joins. Click '+ Add Join Table' to add related tables." |
| SQL Preview | "Select fields and conditions, then click 'Generate SQL'" (placeholder) |
| AI Validation | "Click 'Validate' to check your SQL" |
| Risk Assessment | "Click 'Check Risks' to analyze potential issues" |

### Loading States

| Component | Loading State |
|-----------|---------------|
| JSON Import | Full-screen overlay: "Parsing database structure..." + progress |
| AI Validation | Button shows spinner, panel shows animated dots |
| SQL Generation | Button shows spinner for 100-300ms (even if instant, for perceived value) |

### Error States

| Component | Error State |
|-----------|-------------|
| JSON Import (invalid) | Red toast: "Invalid JSON format. Please check your file." + details |
| AI Validation (API fail) | Orange alert: "Validation unavailable. Check your API key." |
| Risk Check (crash) | Red alert: "Risk check failed. Please try again." |

---

## 6. Theme Implementation

### CSS Variables Approach

All colors, spacing, typography defined as CSS custom properties on `:root`. Light theme toggled by adding `.light` class to root or using `data-theme="light"` attribute.

```css
:root {
  /* All dark theme variables */
}

[data-theme="light"] {
  /* All light theme overrides */
  --bg-base: #FAFAFA;
  --bg-surface: #FFFFFF;
  /* ... */
}
```

### Theme Toggle Behavior

- Toggle button in header: Sun/Moon icon
- Persists to localStorage
- Respects system preference on first visit (`prefers-color-scheme`)
- Transition: All color properties transition 200ms on toggle

---

## 7. Accessibility

- All interactive elements keyboard accessible (Tab, Enter, Space, Arrow keys)
- Focus visible outlines: 2px primary-500 offset 2px
- ARIA labels on icon-only buttons
- Color not sole indicator of state (icons + text accompany colors)
- Minimum contrast ratio: 4.5:1 for text
- Monaco Editor: Full keyboard navigation

---

## 8. File Structure for Implementation

```
src/
├── styles/
│   ├── index.css          # Tailwind imports + CSS variables
│   └── monaco-theme.ts    # Monaco custom theme definition
├── components/
│   ├── Header/
│   ├── Sidebar/
│   │   ├── DatabaseTree/
│   │   ├── TagFilter/
│   │   └── SearchInput/
│   ├── QueryBuilder/
│   │   ├── MainTableSelector/
│   │   ├── FieldSelector/
│   │   ├── WhereBuilder/
│   │   ├── JoinConfig/
│   │   └── OrderByLimit/
│   ├── SQLPreview/
│   │   ├── MonacoEditor/
│   │   └── Toolbar/
│   ├── Validation/
│   │   ├── AIValidator/
│   │   └── RiskPanel/
│   └── ui/                # Reusable primitives
│       ├── Button/
│       ├── Input/
│       ├── Select/
│       ├── Checkbox/
│       ├── Dropdown/
│       └── Badge/
├── hooks/
│   └── useTheme.ts
├── stores/
│   └── (existing stores)
└── App.tsx
```
