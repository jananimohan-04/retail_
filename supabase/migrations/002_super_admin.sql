-- 002: designate jananimohan44@gmail.com as Super Admin (Google OAuth login).
-- Run after 001. Auto-bootstrap in the backend does the same on first Google login,
-- so this is a belt-and-suspenders record.
insert into public.retail_users (id, company_id, name, email, role, mobile, active)
values ('U-super-janani', null, 'Janani Mohan', 'jananimohan44@gmail.com', 'super_admin', '', true)
on conflict (email) do update set role = 'super_admin', active = true, company_id = null;
