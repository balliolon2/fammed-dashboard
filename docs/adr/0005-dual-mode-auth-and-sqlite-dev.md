# 0005: Dual-Mode Authentication and SQLite Development

To provide an immediate, zero-friction developer experience while maintaining production readiness, the system implements dual-mode authentication (NextAuth with production Google OAuth and a development-only mock clinician session) and uses SQLite for local development via Prisma. Switching to hosted PostgreSQL (e.g. Supabase, Neon) for production requires only modifying the Prisma provider string without changing application code.
