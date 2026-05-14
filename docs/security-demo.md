# Security Demo Dependency

This project intentionally includes `lodash@4.17.20`.

That version is old and should be detected by dependency scanners. The route `GET /api/security-demo/dependency` exposes the installed package version so you can confirm the demo dependency is present.

Do not copy this dependency choice into production work. To remove the intentional finding later, upgrade lodash:

```bash
npm install lodash@latest
```
