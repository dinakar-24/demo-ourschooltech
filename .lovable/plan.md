
## Backend Scalability & Security Audit

**Date:** 2026-03-06  
**Target:** 200,000 users across 100+ schools

---

### 1. Database Query Performance & Indexing

#### Critical Issues Found & Fixed ✅

| Issue | Severity | Status |
|-------|----------|--------|
| `students.user_id` — No index (used in every student RLS policy) | 🔴 Critical | ✅ Fixed |
| `students.parent_email` — No index (used in every parent RLS JOIN) | 🔴 Critical | ✅ Fixed |
| `user_roles` — Duplicate index (idx_user_roles_user = idx_user_roles_user_id) | 🟡 Medium | ✅ Fixed |
| `profiles` — No covering index for `get_user_school_id()` | 🟡 Medium | ✅ Fixed |
| `fee_payments` — No school+student composite index | 🟢 Low | ✅ Fixed |
| `audit_logs` — No entity_type index for filtered queries | 🟢 Low | ✅ Fixed |

#### Sequential Scan Analysis (Pre-Fix)

| Table | Seq Scans | Index Usage | Risk at 200K |
|-------|-----------|-------------|-------------|
| `user_roles` | 797,451 | 0.2% | ⚠️ OK — planner correctly chooses seq scan for 4 rows; will auto-switch to index at scale |
| `profiles` | 220,162 | 5.1% | ⚠️ Same — tiny table, planner prefers seq scan |
| `schools` | 22,718 | 1.0% | ✅ Single row, seq scan is optimal |
| `students` | 4,172 | 79.1% | ✅ Good index usage |

#### Indexes Already Well-Configured ✅
- `attendance`: 4 composite indexes covering school+date, student+date
- `fees`: school+status, school+student, school+due_date, receipt_number (partial)
- `fee_invoices`: school+student, status, student+due_date
- `notifications`: user+created_at, user+unread (partial)
- `exams`: school+class, school+date

---

### 2. RPC Latency & Slow Endpoints

| RPC Function | Complexity | Risk | Notes |
|--------------|-----------|------|-------|
| `lookup_user_by_email` | 3-table JOIN | Low | Uses `idx_profiles_email` unique index |
| `get_user_auth_data` | 3-table JOIN | Low | Indexed by PK |
| `get_admin_dashboard_stats` | 4 subqueries | Medium | Multiple COUNT(*) on large tables |
| `get_admin_attendance_by_class` | GROUP BY + aggregation | Medium | Needs `idx_attendance_school_date` ✅ |
| `record_fee_payment` | Transaction with FOR UPDATE | Low | Single-row lock, fast |
| `get_fee_stats` | Full table aggregation | High | No date filter — scans entire `fees` table |

**Recommendation:** `get_fee_stats` should accept a date range parameter to avoid full-table scans at scale.

---

### 3. Rate Limiting & Login Abuse Protection

| Area | Current State | Risk |
|------|--------------|------|
| Login RPC (`lookup_user_by_email`) | No rate limiting | 🔴 High — brute-force email enumeration possible |
| Super Admin OTP | No rate limiting on requests | 🔴 High — OTP flooding possible |
| Password Reset OTP | No rate limiting | 🟡 Medium |
| Edge Functions | No per-IP throttling | 🟡 Medium |

**Recommendations:**
1. Add a `login_attempts` table or use Supabase Auth's built-in rate limiting
2. Add IP-based throttling in Edge Functions (5 attempts/minute per IP)
3. Add exponential backoff for failed login attempts
4. Consider CAPTCHA after 3 failed attempts

---

### 4. Caching Opportunities

| Data | Current | Recommendation |
|------|---------|----------------|
| School branding | sessionStorage (client) | ✅ Already optimized |
| User auth data | sessionStorage (client) | ✅ Already optimized |
| QueryClient | 5min staleTime, 30min gcTime | ✅ Well-configured |
| RPC results | No server-side cache | Add `pg_cache` or materialized views for dashboard stats |
| Static lookups (classes, sections) | Re-fetched per page | Consider longer staleTime (15min) |

---

### 5. Long-Term Database Scaling Strategy

#### Current Data Volumes
- Audit logs: **10,972 rows** (growing ~31/week)
- All other tables: <30 rows (early stage)

#### At 200K Users (Projected)
| Table | Estimated Rows | Growth Rate |
|-------|---------------|-------------|
| `attendance` | 40M/year | ~200K/day (200K students × 1 record/day) |
| `audit_logs` | 5M/year | ~15K/day |
| `fees/fee_invoices` | 2.4M/year | ~200K students × 12 months |
| `notifications` | 10M/year | High volume, needs cleanup |
| `homework` | 500K/year | Moderate |

#### Recommendations
1. **Table Partitioning:** Partition `attendance` by month (date range) and `audit_logs` by month
2. **Data Retention:** Auto-delete audit logs >12 months, archive attendance >2 years
3. **Notifications Cleanup:** Auto-mark read notifications for deletion after 90 days
4. **Connection Pooling:** Already handled by Supabase infrastructure (PgBouncer)
5. **Read Replicas:** Consider for super-admin dashboard queries at >50K concurrent users

---

### 6. Row-Level Security — Multi-School Isolation Audit

#### Architecture: ✅ Well-Designed
- Uses `SECURITY DEFINER` helper functions (`has_role()`, `get_user_school_id()`) to prevent recursive RLS
- Separate `user_roles` table (not on profiles) — prevents privilege escalation ✅
- Super admin bypass is explicitly scoped via `has_role(auth.uid(), 'super_admin')`

#### Policy Pattern Analysis

| Pattern | Tables Using It | Assessment |
|---------|----------------|------------|
| `school_id = get_user_school_id(auth.uid())` | 20+ tables | ✅ Correct isolation |
| `has_role(auth.uid(), role)` for admin access | All admin operations | ✅ Correct |
| Student self-access via `students.user_id = auth.uid()` | attendance, results, fees | ✅ Now indexed |
| Parent access via `students.parent_email = profiles.email` JOIN | attendance, results, fees | ✅ Now indexed |
| Super admin global access | user_roles, classes, sections, teachers, students | ✅ Correct |

#### Remaining Security Concerns
1. **`audit_logs` INSERT uses `WITH CHECK (true)`** — Intentional for logging, but allows any authenticated user to insert arbitrary audit entries. Consider restricting to service role only.
2. **Leaked password protection disabled** — Enable in Auth settings for production.
3. **No IP logging in Edge Functions** — Login attempts don't record source IP for abuse detection.

---

### 7. Actions Taken in This Audit

#### Migrations Applied ✅
1. Added `idx_students_user_id` — Critical for student RLS performance
2. Added `idx_students_parent_email` — Critical for parent RLS JOINs  
3. Added `idx_user_roles_user_role` — Composite index for `has_role()` function
4. Added `idx_profiles_id_school` — Covering index for `get_user_school_id()`
5. Added `idx_fee_payments_school_student` — Fee lookup optimization
6. Added `idx_audit_logs_entity_type` — Filtered audit queries
7. Removed duplicate `idx_user_roles_user` index
8. Added OTP auto-cleanup triggers on both OTP tables
9. Added ascending `created_at` index on audit_logs for retention queries

#### Future Actions (Manual/Scheduled)
- Enable leaked password protection in Auth settings
- Add rate limiting to login Edge Functions
- Add `get_fee_stats` date range parameter
- Set up scheduled job for audit log retention (>12 months)
- Partition `attendance` table when it exceeds 10M rows
