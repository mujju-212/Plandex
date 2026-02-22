# Expense Tracker

> Income and expense management with categories, budgets, and financial summaries.

---

## Overview

Track daily expenses and income, organize by categories, and view spending summaries with breakdowns.

**Screen:** `app/(stacks)/expenses.tsx`  
**Store:** `useExpenseStore`  
**Tables:** `expenses`, `expense_categories`

## Data Model

### `expense_categories` Table

| Column | Type | Default | Description |
|---|---|---|---|
| `id` | INTEGER PK | AUTO | Unique identifier |
| `name` | TEXT | required | Category name |
| `icon` | TEXT | `'attach-money'` | MaterialIcons icon |
| `color` | TEXT | `'#4CAF50'` | Hex color |
| `budget_limit` | REAL | NULL | Monthly budget cap |
| `is_default` | BOOLEAN | 0 | System default flag |

### Default Categories (seeded on first run)

| Category | Icon | Color |
|---|---|---|
| Food & Drinks | `restaurant` | `#FF7043` |
| Transport | `directions-car` | `#42A5F5` |
| Shopping | `shopping-bag` | `#AB47BC` |
| Bills | `receipt` | `#26A69A` |
| Entertainment | `movie` | `#FFA726` |
| Health | `local-hospital` | `#EF5350` |
| Education | `school` | `#5C6BC0` |
| Other | `more-horiz` | `#78909C` |

### `expenses` Table

| Column | Type | Default | Description |
|---|---|---|---|
| `id` | INTEGER PK | AUTO | Unique identifier |
| `category_id` | INTEGER FK | NULL | References `expense_categories.id` |
| `title` | TEXT | required | Expense description |
| `amount` | REAL | required | Amount value |
| `expense_type` | TEXT | `'expense'` | `expense` / `income` |
| `date` | TEXT | required | Date string |
| `notes` | TEXT | NULL | Additional notes |
| `payment_method` | TEXT | `'cash'` | Payment method enum |
| `is_recurring` | BOOLEAN | 0 | Recurring flag |
| `tags` | TEXT | `'[]'` | JSON array of tags |

## Payment Methods

`cash` | `card` | `upi` | `bank_transfer` | `other`

## Expense Summary

The tracker generates a financial summary:

```typescript
interface ExpenseSummary {
  totalExpense: number;    // Sum of all expenses
  totalIncome: number;     // Sum of all income
  balance: number;         // income - expenses
  byCategory: {
    category: string;
    color: string;
    icon: string;
    total: number;
    percentage: number;    // % of total spending
  }[];
}
```

## Features

- **Dual Tracking:** Separate expense and income entries
- **Category Organization:** Color-coded categories with icons
- **Budget Limits:** Set per-category spending caps
- **Date Filtering:** View by date range
- **Payment Methods:** Track how you pay
- **Recurring Expenses:** Flag regular payments
- **Summary View:** Total income, expenses, balance, and category breakdown with percentages
