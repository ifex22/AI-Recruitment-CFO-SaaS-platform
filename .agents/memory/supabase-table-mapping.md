---
name: Supabase table mapping
description: How the 7 existing Supabase tables map to Nexus platform domains
---

Cannot create new tables — Supabase access is REST API only (no DDL). All domains use existing tables.

| Supabase table | Platform domain | Key column mappings |
|---|---|---|
| `employees` | HR employees | `name`→`full_name`, `job_title`, `base_salary`, `hire_date`→`start_date` |
| `customers` | Candidates | `name`→`full_name`, `status`→`stage`, `total_orders`→`experience_years`, `total_spent`→`expected_salary`, `loyalty_points`→`ai_score×10`, `address`→JSON{skills,location,job_id,notes} |
| `products` | Jobs | `name`→`title`, `barcode`→`status`, `category`→`department`, `subcategory`→`employment_type`, `brand`→`location`, `price`→`salary_max`, `discount_price`→`salary_min` |
| `sales` | Finance transactions | `items`→JSONB{type,category,description,date}, `total`→`amount`, `payment_status`→`status` |
| `suppliers` | Payroll runs | `name`→`period_label`, `total_amount`→`gross`, `address`→JSON details |
| `categories` | Interviews | `subcategories`→JSONB with all interview fields |
| `brands` | Org settings | First row = Nexus Corp config |

**Why:** Project uses a Supabase tenant with pre-existing tables. No DDL access — only REST via `@supabase/supabase-js`.

**How to apply:** When adding new entity types, map to one of these 7 tables using the JSONB/flexible columns for extra fields. Never attempt `CREATE TABLE` or DDL.
