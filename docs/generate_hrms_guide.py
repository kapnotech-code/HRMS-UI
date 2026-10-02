"""Generate HRMS process / plan / code Word guide for KapnoTech."""
from datetime import date
from pathlib import Path

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor


OUT = Path(__file__).resolve().parent / "HRMS-Process-Plan-and-Code-Guide.docx"

NAVY = RGBColor(0x0F, 0x3D, 0x33)
GREEN = RGBColor(0x14, 0x83, 0x5E)
MUTED = RGBColor(0x4A, 0x55, 0x68)


def set_run(run, *, size=11, bold=False, color=None, italic=False):
    run.font.name = "Calibri"
    run._element.rPr.rFonts.set(qn("w:eastAsia"), "Calibri")
    run.font.size = Pt(size)
    run.bold = bold
    run.italic = italic
    if color:
        run.font.color.rgb = color


def add_heading(doc, text, level=1):
    p = doc.add_heading(text, level=level)
    for run in p.runs:
        run.font.color.rgb = NAVY if level <= 2 else GREEN
    return p


def add_p(doc, text, *, size=11, bold=False, italic=False, color=None):
    p = doc.add_paragraph()
    run = p.add_run(text)
    set_run(run, size=size, bold=bold, italic=italic, color=color)
    p.paragraph_format.space_after = Pt(8)
    return p


def add_bullets(doc, items):
    for item in items:
        p = doc.add_paragraph(item, style="List Bullet")
        for run in p.runs:
            set_run(run, size=11)


def add_numbered(doc, items):
    for item in items:
        p = doc.add_paragraph(item, style="List Number")
        for run in p.runs:
            set_run(run, size=11)


def shade_header(cell):
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    shd = tcPr.makeelement(qn("w:shd"), {qn("w:fill"): "0F5C43", qn("w:val"): "clear"})
    tcPr.append(shd)
    for p in cell.paragraphs:
        for run in p.runs:
            run.font.color.rgb = RGBColor(255, 255, 255)
            run.bold = True
            run.font.size = Pt(10)
            run.font.name = "Calibri"


def add_table(doc, headers, rows):
    table = doc.add_table(rows=1 + len(rows), cols=len(headers))
    table.style = "Table Grid"
    for i, h in enumerate(headers):
        cell = table.rows[0].cells[i]
        cell.text = h
        shade_header(cell)
    for r_i, row in enumerate(rows, start=1):
        for c_i, val in enumerate(row):
            cell = table.rows[r_i].cells[c_i]
            cell.text = str(val)
            for p in cell.paragraphs:
                for run in p.runs:
                    set_run(run, size=10)
    doc.add_paragraph()
    return table


def build():
    doc = Document()
    section = doc.sections[0]
    section.top_margin = Inches(0.9)
    section.bottom_margin = Inches(0.9)
    section.left_margin = Inches(1.0)
    section.right_margin = Inches(1.0)

    footer = section.footer.paragraphs[0]
    footer.alignment = WD_ALIGN_PARAGRAPH.CENTER
    fr = footer.add_run("HRMS — Process, Plan & Code Guide  |  Confidential  |  Page ")
    set_run(fr, size=9, color=MUTED)
    # PAGE field
    fld = footer._p._new_pPr() if False else None
    run2 = footer.add_run("generated for KapnoTech")
    set_run(run2, size=9, color=MUTED)

    # ----- Title -----
    t = doc.add_paragraph()
    t.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = t.add_run("HRMS")
    set_run(r, size=36, bold=True, color=GREEN)

    st = doc.add_paragraph()
    st.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = st.add_run("Human Resource Management System")
    set_run(r, size=16, color=NAVY)

    sub = doc.add_paragraph()
    sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = sub.add_run("Process, Plan, Features & Code Guide")
    set_run(r, size=18, bold=True, color=NAVY)

    meta = doc.add_paragraph()
    meta.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = meta.add_run(
        f"Written {date.today().isoformat()}  ·  Multi-tenant SaaS  ·  Angular 22 + ASP.NET Core 8"
    )
    set_run(r, size=11, italic=True, color=MUTED)

    add_p(
        doc,
        "Purpose: one place to re-learn how this product works — business flow, what was built, "
        "where the code lives, how tenants/payments/auth join together, and what is still not built.",
        italic=True,
    )

    add_heading(doc, "1. What this product is", 1)
    add_p(
        doc,
        "HRMS is a cloud HR platform sold as multi-tenant SaaS. Each customer company is a tenant. "
        "Employees, payroll, attendance, leave, shifts, documents, and 360° reviews stay inside that tenant. "
        "A platform Super Admin can see billing revenue across tenants. The product was an existing "
        "single-company HR app; it was converted to SaaS without a rewrite.",
    )
    add_p(doc, "Two workspaces on disk:", bold=True)
    add_bullets(
        doc,
        [
            r"D:\HRMS-UI — Angular 22 standalone SPA (no Material, PrimeNG, or Tailwind).",
            r"D:\HRMS-Backend — ASP.NET Core 8 API, Dapper, SQL Server, Razorpay.",
            "Canonical tenant table is dbo.master_company (CompanyID). Do not rename it. Views dbo.Company and dbo.Department exist for older SQL.",
            "UI feature folder is literally named \" features\" (leading space). Paths look like src/app/ features/Login/Login.ts.",
        ],
    )

    add_heading(doc, "2. How to run locally", 1)
    add_table(
        doc,
        ["Piece", "How / where"],
        [
            ["SQL Server", r"DESKTOP-S4R92CK\SQLEXPRESS  ·  database HRManagementSystemDB"],
            ["Migrations", r"D:\HRMS-Backend\HRMS\SqlScripts\Migrations\apply-all.ps1  (must stay idempotent)"],
            ["API", "https://localhost:7135  ·  Angular env apiUrl = https://localhost:7135/api"],
            ["UI", "ng serve  ·  http://localhost:4200  (home landing at /home)"],
            ["Swagger", "https://localhost:7135/swagger"],
        ],
    )

    add_heading(doc, "3. Stack (code, not marketing)", 1)
    add_heading(doc, "3.1 Frontend", 2)
    add_bullets(
        doc,
        [
            "Angular 22 standalone components, lazy loadComponent routes, RxJS.",
            "Auth: JWT in client + httpOnly refresh cookie.",
            "Guards: authGuard, permissionGuard, devOnlyGuard (ui-kit only in dev).",
            "Shared UI kit under src/app/shared/ui (cards, alerts, page header, CSS tokens).",
            "No Angular Material / PrimeNG / Tailwind — custom CSS using tokens (--green, --ink, --border, etc.).",
        ],
    )
    add_heading(doc, "3.2 Backend", 2)
    add_bullets(
        doc,
        [
            "ASP.NET Core 8 Web API. Projects: HRMS, common.model, common.framework, HRMS.Tests.",
            "Dapper to SQL Server stored procedures and inline SQL. BCrypt.Net-Next cost 12.",
            "JWT (System.IdentityModel.Tokens.Jwt). Claim company_id is the tenant.",
            "Razorpay NuGet for CreateOrder / Verify. Webhook HMAC on payment.captured.",
            "Invoice PDF is written without extra PDF NuGet (InvoicePdfWriter).",
        ],
    )

    add_heading(doc, "4. End-to-end product flow", 1)
    add_heading(doc, "4.1 Public visitor", 2)
    add_numbered(
        doc,
        [
            "Opens / or /home — marketing landing (Products / Solutions / Resources mega-menu).",
            "Can try /onboarding and /onboarding-checklist without an account.",
            "Can open /plans (public pricing).",
            "Register at /register or /company-register, or Sign In at /login or /c/{slug}/login.",
        ],
    )
    add_heading(doc, "4.2 Company signup (important: Razorpay does NOT open on register)", 2)
    add_p(
        doc,
        "Signup creates a PENDING company and admin user. Payment is after email verify + login. "
        "That is by design, not a bug.",
    )
    add_numbered(
        doc,
        [
            "Step 1 — company profile (name, industry, size, country, phone).",
            "Step 2 — admin account (login name, email, password rules: upper, lower, digit, special, 8+).",
            "Step 3 — choose plan (TRIAL or paid). Paid plans set paymentRequired; no Razorpay checkout here.",
            "API creates company + user (email not verified). Verification mail is sent.",
            "Step 4 success screen: “pay after you sign in” for paid plans.",
            "User clicks verify-email link → /verify-email.",
            "Login. If the company has PENDING payment, app sends them to pay (CreateOrder → Razorpay → Verify).",
            "Webhook or Verify fulfills the order: Active subscription + Invoice + GST PDF.",
        ],
    )
    add_heading(doc, "4.3 Daily HR work (inside the app shell)", 2)
    add_p(
        doc,
        "Authenticated routes sit under AppLayoutComponent (sidebar + header). authGuard + permissionGuard. "
        "Unknown paths redirect to /dashboard.",
    )
    add_numbered(
        doc,
        [
            "Masters: company, department, designation, bank, shifts, holidays, leave types, documents, users, menus, pages, permission matrix.",
            "Workforce: employee master, import, profiles, employment history.",
            "Time: attendance, employee shifts, schedule master, schedule employee, schedule transactions, schedule emails.",
            "Leave: leave types, leave requests, balances.",
            "Payroll: salary components/structures, employee salary, payroll run, adjustments, details, yearly paid, salary revisions, salary slip.",
            "Reviews: pending / history / details; public rater link /review/public/:id (no login).",
            "Tenant settings: /settings/branding (logo, colours, slug).",
            "Billing: /subscriptions/my-subscription and /plans.",
            "Platform: /admin/revenue (Super Admin).",
        ],
    )

    add_heading(doc, "5. Auth, roles, and tenant isolation", 1)
    add_heading(doc, "5.1 Login", 2)
    add_bullets(
        doc,
        [
            "AuthController + AuthService + AuthRepository. GetAuthCandidates only returns IsDeleted = 0 users.",
            "Password check: BCrypt 12. JWT includes RoleId, RoleCode, company_id, user id.",
            "Refresh token stored; refresh cookie is httpOnly.",
            "Duplicate email across tenants: picker UI (no password on picker) then tenant-specific login.",
            "Company slug login: /c/{slug}/login so a tenant can bookmark their own sign-in URL.",
        ],
    )
    add_heading(doc, "5.2 Role mapping (do not remap RoleId in DB)", 2)
    add_p(
        doc,
        "Existing RoleId values stayed. JWT also carries RoleCode. File: HRMS/Security/RoleCodes.cs.",
    )
    add_table(
        doc,
        ["RoleId", "Typical name", "RoleCode", "Meaning"],
        [
            ["1", "Admin (legacy signup)", "COMPANY_ADMIN", "Tenant admin (new signup still uses RoleId 1)"],
            ["2", "HR", "HR_MANAGER", "HR operations"],
            ["3", "Employee", "EMPLOYEE", "Self-service"],
            ["4", "Manager", "MANAGER", "Approvals / team"],
            ["5", "Super Admin", "SUPER_ADMIN", "Platform; CompanyId NULL"],
            ["6", "Company Admin", "COMPANY_ADMIN", "Same rights as RoleId 1"],
        ],
    )
    add_p(
        doc,
        "Page access: PermissionMatrix.cs + RolePagePermission tables + Angular permissionGuard. "
        "Landing after login: RoleLanding.Path(roleId, employeeId).",
    )
    add_heading(doc, "5.3 Tenant isolation layers", 2)
    add_numbered(
        doc,
        [
            "JWT company_id — every authenticated request knows the tenant.",
            "TenantAwareConnectionFactory — SESSION CONTEXT key hrms_company_id for SQL.",
            "fn_hrms_tenant_ok(@CompanyId) — Super Admin passes all; others must match SESSION CONTEXT. RLS is skipped inside dbo-owned stored procedures, so SPs must call this function themselves.",
            "Migrations 002/003/009/015 patched most list/get procedures. SP_EmployeeSalary was NOT patched (a FROM-clause replace broke it). App-layer company filter still applies.",
            "SubscriptionEnforcementMiddleware — Full / Grace / ReadOnly from CompanySubscription. Super Admin bypasses. Statuses: Active, TRIAL, PAST_DUE, EXPIRED, CANCELLED (column is still CS_Status; app still writes 'Active').",
            "SecurityHeadersMiddleware — standard HTTP security headers.",
        ],
    )

    add_heading(doc, "6. Billing, GST, coupons, invoices", 1)
    add_p(
        doc,
        "Listed plan price is exclusive of GST. GST 18% is added. Same-state (seller vs buyer) → CGST+SGST; otherwise IGST. "
        "Example: ₹999 listed → taxable 999 → GST 179.82 → payable ₹1178.82.",
    )
    add_bullets(
        doc,
        [
            "Quote: BillingService.QuoteAsync → GET /api/billing quote endpoints (BillingController).",
            "Pay: POST /api/Payment/CreateOrder (uses GST-inclusive quote) → Razorpay checkout → POST /api/Payment/Verify.",
            "Webhook: HMAC of raw body with WebhookSecret; payment.captured also fulfills.",
            "FulfillPaidOrderAsync: activate subscription, write Invoice, then PDF after TransactionScope.Complete.",
            "Yearly = SP_YearlyPrice or monthly × 12 × 0.8.",
            "Coupons (seed): WELCOME10 = 10% off; SAVE500 = ₹500 off (min order / max discount as in 013 SQL).",
            "Seller GSTIN placeholder in Billing settings: 27AAAAA0000A1Z5 — replace before go-live.",
            "Super Admin revenue: GET /api/admin/revenue → Angular /admin/revenue.",
        ],
    )
    add_p(doc, "Key backend files:", bold=True)
    add_bullets(
        doc,
        [
            r"D:\HRMS-Backend\HRMS\Billing\BillingService.cs, GstCalculator.cs, CouponMath.cs, InvoicePdfWriter.cs",
            r"D:\HRMS-Backend\HRMS\Controllers\PaymentController.cs, BillingController.cs, AdminRevenueController.cs",
            r"D:\HRMS-Backend\HRMS\Service\SubscriptionPlanService\SubscriptionPlanService.cs (CreateOrder / Verify / webhook / fulfill)",
        ],
    )

    add_heading(doc, "7. Feature catalogue", 1)
    add_table(
        doc,
        ["Area", "What users get", "Typical UI routes"],
        [
            ["Core HR", "Employee directory, roles, org, bulk import, profiles, bank/emergency", "/Recruiter/employee-master, /Recruiter/employee-profile/:id, /Recruiter/employee-import"],
            ["Onboarding", "Wizard + pre-hire checklist (also public demos)", "/onboarding, /onboarding-checklist"],
            ["Documents", "Categories, types, vault", "/masters/document-category, /master/documents, /transactions/document-types"],
            ["Time", "Web punch, attendance logs", "/masters/attendance, /transactions/master-attendance"],
            ["Shifts", "Shift master, employee shift, schedules, emails", "/masters/shifts, /transactions/employee-shift, /transactions/schedule-*"],
            ["Leave", "Types, apply, approve, balances, holidays", "/masters/leavetype, /transactions/leave-transactions, /masters/holiday"],
            ["Payroll", "Components, structures, run, adjustments, slips, revisions", "/Recruiter/payroll, /Recruiter/employee-salary, /payroll/salary"],
            ["Performance", "360 reviews, pending, history, public rater link", "/transactions/review, /review/public/:id"],
            ["Access", "Users, roles, pages, permission matrix, menus", "/masters/users, /masters/permission-matrix, /masters/pages"],
            ["SaaS", "Plans, my subscription, branding, slug login, revenue", "/plans, /subscriptions/my-subscription, /settings/branding, /admin/revenue"],
        ],
    )

    add_heading(doc, "8. Angular code map", 1)
    add_p(
        doc,
        "Entry routes: src/app/app.routes.ts (public) then children in src/app/layout/app-shell.routes.ts (logged-in).",
    )
    add_table(
        doc,
        ["Folder / file", "Role"],
        [
            ["src/app/core/services/Auth.service.ts", "Login, token, isLoggedIn, refresh"],
            ["src/app/core/guard/auth.guard.ts", "Redirect to /login if no session"],
            ["src/app/core/guard/permission.guard.ts", "RBAC on shell routes"],
            ["src/app/core/services/billing.service.ts", "Quote, invoices, revenue"],
            ["src/app/layout/app-layout.component.ts", "Logged-in chrome"],
            ["src/app/shared/ui", "Reusable UI + CSS tokens"],
            ["src/app/ features/Landing", "Marketing site + mega-menu CSS"],
            ["src/app/ features/Login", "Login including slug route"],
            ["src/app/ features/REgister", "Company signup wizard (folder name is REgister)"],
            ["src/app/ features/Auth", "verify / forgot / reset / set password"],
            ["src/app/ features/Subscriptions", "Public plans + my subscription"],
            ["src/app/ features/Admin/admin-revenue.component.ts", "Platform revenue"],
            ["src/app/ features/Settings", "Tenant branding"],
            ["src/app/ features/Master", "Masters listed above"],
            ["src/app/ features/Recruiter", "Employees, payroll, salary (space-less sibling also exists for some employee-profile routes)"],
            ["src/app/ features/Reviews", "Review details (public + internal)"],
            ["src/environments/environment.ts", "apiUrl"],
        ],
    )
    add_p(
        doc,
        "Note: some Recruiter paths import from ./features/Recruiter (no space) and others from ./ features/. "
        "That split already exists; do not “clean” it without checking every import.",
        italic=True,
    )

    add_heading(doc, "9. Backend code map", 1)
    add_table(
        doc,
        ["Area", "Where"],
        [
            ["HTTP API", r"D:\HRMS-Backend\HRMS\Controllers"],
            ["Auth", r"Controllers\AuthController.cs, Service\Auth, Repository\Auth, Security\RoleCodes.cs, PermissionMatrix.cs"],
            ["Tenancy", r"Tenancy\TenantAwareConnectionFactory.cs, SqlScripts\Migrations\009_sql_tenant_isolation.sql"],
            ["Subscription gate", r"Subscription\SubscriptionEnforcementMiddleware.cs"],
            ["Payments", r"Controllers\PaymentController.cs, Service\SubscriptionPlanService"],
            ["GST / coupons / PDF", r"HRMS\Billing"],
            ["Branding / slug", r"Branding\CompanyBrandingService.cs, Controllers\BrandingController.cs"],
            ["DTOs / entities", r"D:\HRMS-Backend\common.model"],
            ["Logging / shared infra", r"D:\HRMS-Backend\common.framework"],
            ["Tests", r"D:\HRMS-Backend\HRMS.Tests"],
        ],
    )
    add_p(doc, "Typical request path: Controller → Service → Repository (Dapper) → stored procedure or SQL. Keep API JSON contracts stable when changing SQL.")

    add_heading(doc, "10. Database migrations (order matters)", 1)
    add_p(
        doc,
        r"Folder: D:\HRMS-Backend\HRMS\SqlScripts\Migrations. Table dbo.SchemaMigrations records applied files. Re-run apply-all.ps1 is safe only because scripts are idempotent.",
    )
    add_table(
        doc,
        ["File", "What it did"],
        [
            ["000_schema_migrations.sql", "Migration log table"],
            ["001_tenant_foundation.sql", "Company views, tenant foundation"],
            ["002_company_id_on_business_tables.sql", "CompanyID on business tables"],
            ["003_tenant_unique_indexes.sql", "Uniqueness is per company, not global"],
            ["004_billing_tables.sql", "Plans, company subscription, payments"],
            ["005_auth_tokens_roles_register.sql", "Refresh tokens, register, invites"],
            ["006_auth_backfill.sql", "Fill Users.CompanyId from Employee where possible"],
            ["007_rbac_role_codes.sql", "SUPER_ADMIN / COMPANY_ADMIN extras"],
            ["008_saas_seed.sql", "SEED Acme + SEED Beta + seed users"],
            ["009_sql_tenant_isolation.sql", "fn_hrms_tenant_ok + SP patches"],
            ["010_pending_payment_register.sql", "Register without charging yet"],
            ["011_company_slug_login.sql", "CompanySlug unique among not-deleted"],
            ["012_company_branding.sql", "Logo / colours"],
            ["013_coupons_gst_invoices.sql", "Coupon, Invoice GST columns, seed coupons"],
            ["014_keep_seed_logins.sql", "Soft-delete non-seed companies/users"],
            ["015_leftover_sp_tenant_filters.sql", "Attendance GetAll/GetById/range + Users_GetByEmail IsDeleted=0"],
        ],
    )

    add_heading(doc, "11. Seed data (local only — never production)", 1)
    add_p(doc, "Password for every seed user: SeedPass1!")
    add_table(
        doc,
        ["LoginName", "RoleId", "Tenant", "Notes"],
        [
            ["seed.super", "5 SUPER_ADMIN", "(none)", "Platform admin; /admin/revenue"],
            ["seed.acme.admin", "6 COMPANY_ADMIN", "SEED Acme HR", "Paid Professional (Active). Slug like seed-acme-hr"],
            ["seed.acme.hr", "2 HR", "SEED Acme HR", "HR"],
            ["seed.acme.mgr", "4 MANAGER", "SEED Acme HR", "Manager"],
            ["seed.acme.emp", "3 EMPLOYEE", "SEED Acme HR", "Employee"],
            ["seed.beta.admin", "6 COMPANY_ADMIN", "SEED Beta HR", "TRIAL plan"],
            ["seed.beta.emp", "3 EMPLOYEE", "SEED Beta HR", "Employee"],
        ],
    )
    add_p(
        doc,
        "Migration 014 soft-deleted non-seed users/companies so old register/login rows cannot authenticate (GetAuthCandidates filters IsDeleted = 0).",
    )

    add_heading(doc, "12. Conversion plan (what was already executed)", 1)
    add_p(
        doc,
        "Work was done in phases so the old HR app kept running. Do not re-run these phases unless a later bug appears.",
    )
    add_heading(doc, "12.1 Original SaaS backend", 2)
    add_table(
        doc,
        ["Phase", "Outcome"],
        [
            ["0 Audit", "Reuse master_company; no table rename"],
            ["2 Schema", "Migrations 000–004"],
            ["3 Auth", "JWT, refresh cookie, BCrypt 12, register/verify/reset"],
            ["4 RBAC", "RoleCode mapping + PermissionMatrix"],
            ["5 Subscription", "Gate Full / Grace / ReadOnly"],
            ["6 Tenant in app", "company_id on connection"],
            ["7 Seed + tests", "008 seed"],
            ["8 SQL isolation", "009 fn_hrms_tenant_ok"],
            ["9 Headers", "SecurityHeadersMiddleware"],
        ],
    )
    add_heading(doc, "12.2 Dual SaaS + Angular (after “go ahead”)", 2)
    add_table(
        doc,
        ["Phase", "Outcome"],
        [
            ["1 Payment", "PENDING register; Razorpay after verify+login"],
            ["2 Login UX", "Slug login /c/:slug/login; duplicate-email picker"],
            ["3 Branding", "Company branding + CSS tokens"],
            ["4 Angular structure", "Lazy routes, app layout, shared/ui, /ui-kit"],
            ["5 Restyle", "Screens remapped onto tokens"],
            ["6 Billing extras", "Coupons, GST invoices, Super Admin revenue"],
            ["7 Cleanup", "Seed-only logins + leftover attendance/email SP filters"],
            ["UI fix", "Landing mega-menu: fixed panel under header so it does not clip or cover Sign In"],
        ],
    )

    add_heading(doc, "13. Important design rules (so future you does not break SaaS)", 1)
    add_bullets(
        doc,
        [
            "Do not rename master_company or CS_Status.",
            "Do not remap RoleId 1–6; add RoleCode in JWT instead.",
            "Signup must not open Razorpay. Charge after email verification + login.",
            "Uniqueness (employee code, email, leave type, etc.) is per CompanyID.",
            "Super Admin has Users.CompanyId NULL and bypasses tenant + subscription middleware.",
            "New SQL objects that list tenant data must call dbo.fn_hrms_tenant_ok(CompanyID).",
            "apply-all.ps1 re-runs every numbered file — never write a one-shot destructive script.",
            "Do not commit secrets (.env, Razorpay live keys).",
            "Angular: no Material/PrimeNG/Tailwind unless the product decision changes.",
        ],
    )

    add_heading(doc, "14. What is still remaining", 1)
    add_table(
        doc,
        ["Item", "Status", "Notes"],
        [
            ["2FA / TOTP", "Not started (optional)", "No backend or UI yet"],
            ["SP_EmployeeSalary SQL tenant filter", "Skipped", "Naive FROM patch broke the proc; app still filters by company"],
            ["Real Razorpay live keys", "Config", "Keep test keys in Development"],
            ["Real seller GSTIN", "Config", "Placeholder 27AAAAA0000A1Z5"],
            ["Production SMTP", "Config", "Needed for real verification emails"],
            ["Git commit / PR", "Not done unless asked", "Local work may be uncommitted"],
        ],
    )

    add_heading(doc, "15. Quick “where do I change X?”", 1)
    add_table(
        doc,
        ["I want to…", "Start here"],
        [
            ["Change landing menu / overflow", r"HRMS-UI\src\app\ features\Landing\landing.component.css (.mega-menu)"],
            ["Change signup copy or steps", r"HRMS-UI\src\app\ features\REgister"],
            ["Change login / slug", r"HRMS-UI\src\app\ features\Login\  and AuthController"],
            ["Add a paid feature flag", "SubscriptionPlan + PermissionMatrix + subscription middleware"],
            ["Change GST % or intra vs inter state", r"HRMS\Billing\GstCalculator.cs and Billing settings"],
            ["Add a coupon", "dbo.Coupon (see 013) + CouponMath"],
            ["Add an authenticated page", "app-shell.routes.ts + permission key + backend controller"],
            ["Add a public page", "app.routes.ts (outside auth shell)"],
            ["Seed a new demo tenant", "008_saas_seed.sql pattern (idempotent INSERT IF NOT EXISTS)"],
        ],
    )

    add_heading(doc, "16. Glossary", 1)
    add_table(
        doc,
        ["Term", "Meaning here"],
        [
            ["Tenant", "One row in master_company"],
            ["company_id", "JWT claim + SESSION CONTEXT for SQL"],
            ["PENDING", "Registered, not paid yet"],
            ["TRIAL / Active / Grace", "SubscriptionEnforcementMiddleware modes"],
            ["RoleId vs RoleCode", "Integer in DB vs string in JWT/permissions"],
            ["Slug", "CompanySlug used in /c/{slug}/login"],
            ["Fulfill", "Mark payment paid, activate plan, write invoice+PDF"],
        ],
    )

    add_heading(doc, "17. Document control", 1)
    add_p(
        doc,
        "This file describes the system as of the SaaS conversion through billing, seed cleanup, "
        "landing mega-menu fix, and NG8107 template cleanups. Update this document when 2FA ships "
        "or when production GSTIN / Razorpay / SMTP are configured.",
    )
    add_p(doc, r"Source of truth remains the git repos at D:\HRMS-UI and D:\HRMS-Backend.", italic=True)

    doc.save(OUT)
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    build()
