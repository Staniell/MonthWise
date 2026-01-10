# MonthWise Database Schema

## Overview

MonthWise uses SQLite for local data storage. All monetary values are stored as **integer cents** to avoid floating-point precision issues.

## Tables

### `allowance_sources`

Income sources that contribute to the monthly allowance.

| Column         | Type    | Description                      |
| -------------- | ------- | -------------------------------- |
| `id`           | INTEGER | Primary key                      |
| `name`         | TEXT    | Source name (e.g., "Salary")     |
| `amount_cents` | INTEGER | Monthly amount in cents          |
| `is_active`    | INTEGER | 1 = active, 0 = inactive         |
| `created_at`   | TEXT    | ISO timestamp                    |
| `updated_at`   | TEXT    | ISO timestamp                    |
| `deleted_at`   | TEXT    | Soft delete timestamp (nullable) |

---

### `categories`

Expense categories for organization.

| Column       | Type    | Description                      |
| ------------ | ------- | -------------------------------- |
| `id`         | INTEGER | Primary key                      |
| `name`       | TEXT    | Category name (unique)           |
| `icon`       | TEXT    | Emoji icon                       |
| `color`      | TEXT    | Hex color code                   |
| `sort_order` | INTEGER | Display order                    |
| `created_at` | TEXT    | ISO timestamp                    |
| `updated_at` | TEXT    | ISO timestamp                    |
| `deleted_at` | TEXT    | Soft delete timestamp (nullable) |

---

### `months`

Monthly records with optional allowance overrides.

| Column                     | Type    | Description                 |
| -------------------------- | ------- | --------------------------- |
| `id`                       | INTEGER | Primary key                 |
| `year`                     | INTEGER | Year (e.g., 2026)           |
| `month`                    | INTEGER | Month (1-12)                |
| `allowance_override_cents` | INTEGER | Custom allowance (nullable) |
| `created_at`               | TEXT    | ISO timestamp               |
| `updated_at`               | TEXT    | ISO timestamp               |

**Unique constraint**: `(year, month)`

---

### `expenses`

Individual expense transactions.

| Column         | Type    | Description                      |
| -------------- | ------- | -------------------------------- |
| `id`           | INTEGER | Primary key                      |
| `month_id`     | INTEGER | FK → `months.id`                 |
| `category_id`  | INTEGER | FK → `categories.id`             |
| `amount_cents` | INTEGER | Amount in cents (must be > 0)    |
| `note`         | TEXT    | Optional description             |
| `expense_date` | TEXT    | Date string (YYYY-MM-DD)         |
| `created_at`   | TEXT    | ISO timestamp                    |
| `updated_at`   | TEXT    | ISO timestamp                    |
| `deleted_at`   | TEXT    | Soft delete timestamp (nullable) |

---

### `app_settings`

Key-value store for app configuration.

| Column       | Type | Description               |
| ------------ | ---- | ------------------------- |
| `key`        | TEXT | Setting key (primary key) |
| `value`      | TEXT | Setting value             |
| `updated_at` | TEXT | ISO timestamp             |

## Indexes

- `idx_expenses_month_id` on `expenses(month_id)`
- `idx_expenses_category_id` on `expenses(category_id)`
- `idx_months_year` on `months(year)`
