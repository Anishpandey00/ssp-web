# Security policy

## Reporting a vulnerability

Please do **not** open a public issue for security problems. Use GitHub's
[private vulnerability reporting](https://github.com/Anishpandey00/ssp-web/security/advisories/new)
instead, with steps to reproduce and the affected version or commit.

## Security measures in this project

- Passwords are stored as bcrypt hashes; no default administrator exists.
- Every protected route checks a signed JWT; students can reach only their own data.
- All database queries are parameterised.
- PostgreSQL runs on an internal network with no published port.
- Secrets live only in `.env` files, which are git-ignored.
- AI requests are rate-limited per student.
