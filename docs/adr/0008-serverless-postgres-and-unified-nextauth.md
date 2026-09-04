# 0008: Serverless PostgreSQL and Unified NextAuth with Auto-Provisioning

To support production deployment on Vercel's serverless edge infrastructure while eliminating operational credential overhead, the system transitions from local SQLite to Neon Serverless PostgreSQL and implements NextAuth.js with a unified JWT session strategy.

NextAuth unifies production Google OAuth (with automated clinician provisioning into the primary care facility) and an OPD Quick Switcher for rotational clinic workflows and local demonstration. Stateless JWT sessions eliminate repetitive database roundtrips across serverless middleware and server actions while preserving strict PDPA-aligned role and clinic tenancy boundaries.
