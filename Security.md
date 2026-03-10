# Vibe‑Coded Next.js 14.2 + React 18.3 + TypeScript 5.9 Security Guide

Use this as documentation for AI agents or developers to implement defense‑in‑depth for vibe‑coded websites.

---

## 1. Scope and assumptions

- Framework: Next.js 14.2.x (App Router).  
- UI: React 18.3.x.  
- Type system: TypeScript 5.9.x.  
- Deployment: Modern cloud‑native (Vercel / AWS / self‑hosted Node).  

This guide assumes vibe‑coded apps are **AI‑generated or AI‑assisted** and must be hardened against XSS, injection, auth bypass, and prompt‑injection‑style attacks.

---

## 2. Core principles

- Treat all AI‑generated code as **untrusted** until validated.  
- Embed security in **CI/CD pipelines** (SAST, SCA, artifact signing).  
- Apply **least‑privilege IAM**, **secrets‑management**, and **compliance‑by‑design**.  
- Use **type‑safe guards** and **runtime validation** to close the gap between “AI‑written” and “production‑safe”.

---

## 3. Next.js App Router hardening

### 3.1. Use Server Components for sensitive logic

- Move authentication, data fetching, and business logic into **Server Components** and **Server Actions**.  
- Minimize client‑side exposure of sensitive data structures and logic.

### 3.2. Middleware for edge‑level protection

In `middleware.ts`:

- Enforce HTTPS and secure cookies.  
- Reject malformed or suspicious headers (e.g., invalid `Host`, `Origin`, or `Authorization` patterns).

Example:

```ts
export default function middleware(req: NextRequest) {
  const headers = new Headers(req.headers);

  // Enforce HTTPS in production
  if (!req.url.startsWith('https://')) {
    return NextResponse.redirect(
      `https://${req.headers.get('host')}${req.url}`,
      301,
    );
  }

  // Optional: block clearly malicious headers
  const userAgent = headers.get('user-agent');
  if (userAgent?.includes('sqlmap') || userAgent?.includes('nmap')) {
    return new NextResponse(null, { status: 403 });
  }

  return NextResponse.next();
}
3.3. Secure API routes and Server Actions
Every API route and Server Action must:

Validate and sanitize all inputs (body, query, params) using Zod or similar.

Use parameterized queries or ORM‑driven queries to prevent SQL injection.

Re‑verify authentication and authorization server‑side, even if middleware already checked it.

4. Authentication and authorization
4.1. Auth architecture
Use a mature auth provider (e.g., Clerk, Auth0, WorkOS, or Descope) for Next.js App Router.

Store session tokens in HttpOnly, Secure, SameSite=strict cookies.

Do not store raw tokens in client‑side state unless strictly necessary.

4.2. RBAC checks
Define roles and permissions (e.g., user, admin, editor).

Check roles server‑side before returning sensitive data:

ts
async function getData(userId: string, role: Role) {
  if (!isAuthorized('view_sensitive_data', role)) {
    throw new Error('Unauthorized');
  }
  // ...
}
Use middleware + Server Actions defense‑in‑depth:

Middleware checks authentication.

Data‑access functions re‑verify roles and permissions.

4.3. Rate limiting and login hygiene
Recommended thresholds:

General API: ~100 requests / 15 minutes.

Auth‑related routes: ~5 requests / 15 minutes with progressive delays.

Password‑reset tokens: short‑lived, single‑use, server‑verified only.

5. React‑specific XSS and client‑side hardening
5.1. Do not trust dangerouslySetInnerHTML
Never pass raw user‑generated HTML via dangerouslySetInnerHTML.

If you must, sanitize with a library like DOMPurify:

ts
import DOMPurify from 'dompurify';

const cleanHtml = DOMPurify.sanitize(userHtml);
Reject or strip javascript: and data: URLs in user‑provided links.

5.2. Content Security Policy (CSP)
In next.config.js (or via middleware):

Avoid 'unsafe‑inline' for scripts.

Use nonces for inline scripts.

Restrict connect‑src, script‑src, and style‑src to known domains.

Example:

ts
export default withSecurity({
  headers: [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'Content-Security-Policy',
          value: `
            default-src 'self';
            script-src 'self' 'nonce-GENERATED_NONCE';
            style-src 'self' 'unsafe-inline';
            img-src 'self' data:;
            connect-src 'self' https://api.example.com;
          `.replace(/\s+/g, ' ').trim(),
        },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
      ],
    },
  ],
});
6. TypeScript 5.9.x for type‑safe security
6.1. Avoid any and use narrow types
Replace any‑based user inputs with narrow, validated types:

ts
interface User {
  id: string;
  email: string;
  profile: {
    createdAt: Date;
  };
}

function isValidUser(user: unknown): user is User {
  return (
    typeof user === 'object' &&
    user !== null &&
    typeof (user as any).id === 'string' &&
    typeof (user as any).email === 'string' &&
    (user as any).profile?.createdAt instanceof Date
  );
}
Call this guard before casting AI‑generated data to domain types.

6.2. Use refined types and guards
Define types like Email, NonEmptyString, SecurePassword, etc.

Use runtime guards to enforce these invariants:

ts
function isNonEmptyString(s: unknown): s is string {
  return typeof s === 'string' && s.length > 0;
}
This reduces the chance that AI‑generated code passes invalid or unsanitized data to data stores or APIs.

7. Secrets and environment hygiene
7.1. Never hardcode secrets
No database credentials, API keys, JWT secrets, or LLM keys in client‑side code.

Use .env.local for local dev; keep secrets outside Git.

Use environment‑specific variables validated at runtime:

ts
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl || !dbUrl.startsWith('postgresql://')) {
  throw new Error('Invalid DATABASE_URL');
}
7.2. Use a secrets manager in production
Options: AWS Secrets Manager, Azure Key Vault, HashiCorp Vault, or similar.

Rotate keys and credentials regularly and avoid long‑lived static secrets.

8. Protecting vibe‑coded APIs and data flows
Apply this to every vibe‑coded API route and Server Action:

Validate and sanitize all inputs (body, query, params) with schemas.

Use parameterized queries (or ORM methods) to prevent SQL injection.

Apply rate limiting and brute‑force protection to auth and sensitive endpoints.

Log and monitor:

Failed validations.

Suspicious payloads.

Repeated errors (possible attack patterns).

9. Supply‑chain and build‑time security
Run SAST and SCA in CI for every commit (e.g., Semgrep, Snyk, Sonar).

Generate SBOMs and sign artifacts with Sigstore‑style provenance.

Map pipeline controls to NIST SSDF and SLSA levels for supply‑chain assurance.

Use policy‑as‑code for:

IAM roles used by CI/CD.

Cloud resources provisioned by Terraform / Pulumi.

10. Vibe‑specific security habits
10.1. Treat prompts and LLM‑generated code as “inputs”
Treat all AI‑generated prompts that touch production code as untrusted.

Sandboxed or reviewed automatically:

Before merging into main.

Before exposing via API routes or Server Actions.

10.2. Defend against prompt injection
Sanitize and constrain user inputs that are passed to LLMs:

Length, format, allowed characters.

Separate system‑controlled templates from user‑controlled text.

Log and monitor:

Prompt‑like payloads.

Attempts to exfiltrate data via LLM‑generated outputs.

11. Human‑driven review and governance
Mandatory security review for high‑impact areas:

Auth and identity logic.

Payments and financial flows.

Admin panels and data‑export features.

Use AI‑SPM or cloud‑native security platforms to:

Map vibe‑coded apps to cloud identities, data, and APIs.

Surface real attack paths (not just isolated vulnerabilities).

12. Checklist for each vibe‑coded project
Use this as a living checklist for every new Next.js + React + TypeScript project.

✅ All auth checked at middleware and data‑access layer.
✅ All API routes and Server Actions have schema validation and parameterized queries.
✅ Content Security Policy, X‑Content‑Type‑Options, X‑Frame‑Options, and HTTPS enforced.
✅ No any‑based trust in user‑input; use type guards and refined types.
✅ Secrets never in client‑side code; env vars validated at runtime.
✅ SAST + SCA + dependency‑vulnerability scanning in CI.
✅ Human‑driven review for high‑impact logic (auth, payments, admin).
✅ Compliance‑by‑design (SOC 2, ISO 27001, NIST SSDF, GDPR, HIPAA, PCI DSS, NIST AI RMF where applicable).