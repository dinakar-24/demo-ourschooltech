

## Problem Identified

The subdomain `sse.ourschooltech.com` is resolving correctly to your app. The DNS is working. However, the school "SSE" in your database has `is_active` set to `false`.

The `get_school_by_code` function filters with `WHERE ... AND s.is_active = true`, so inactive schools return no data, triggering the "School Not Found" error page.

## Fix

No code changes needed. You need to **activate the school** in your Super Admin panel:

1. Go to the Super Admin dashboard
2. Navigate to Schools
3. Find "SSE" and toggle it to **Active**

Once the school is marked active, `sse.ourschooltech.com` will immediately show the school-branded login page.

Alternatively, this can be done directly in the database by updating the school's `is_active` field to `true`.

