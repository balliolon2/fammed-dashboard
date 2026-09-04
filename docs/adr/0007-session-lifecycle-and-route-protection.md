# 0007: Clinician Session Lifecycle and Route Protection

To secure patient consultation records while optimizing clinical usability in outpatient (OPD) shared workstations, the system manages active clinician identity via secure HttpOnly session cookies coupled with Next.js Middleware route protection. Unauthenticated requests to clinical routes are redirected to `/login`, which supports both institutional Google SSO for production and a Quick Clinician Switcher for local development and rotating clinic shifts. Signing out immediately clears the session cookie and revokes route access.
