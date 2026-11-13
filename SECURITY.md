# Website security

This is a static GitHub Pages site: it has no server-side code, database, account system, or form submissions. The site now has a restrictive Content Security Policy in its HTML, a strict referrer policy, no inline JavaScript, no runtime packages, and no remotely loaded fonts or scripts. Terminal input is written as text and is never evaluated as code.

## Hosting limits

GitHub Pages does not provide project-level configuration for arbitrary HTTP response headers. The HTML policy is therefore a useful browser-side restriction, but it cannot set or replace response headers such as `Strict-Transport-Security`, `X-Content-Type-Options`, or `X-Frame-Options`. Also, `frame-ancestors` is not honored when supplied through a CSP meta tag. If response-header controls become a requirement, serve the same static files through a host or proxy that supports custom headers.

## Keep the GitHub account and domain safe

- Enable two-factor authentication on the GitHub account that owns this repository.
- In GitHub Pages settings, confirm the custom domain and enable **Enforce HTTPS** once the certificate is ready.
- Verify ownership of the custom domain in GitHub before relying on it, and avoid wildcard DNS records.
- Protect the publishing branch from force pushes and direct changes where the repository plan allows it. Review changes before they are published.
- Never commit passwords, API keys, private research data, unpublished personal details, or other secrets. GitHub Pages content is public, even if the source repository is private.
- Keep the project dependency-free. If a build tool or external script is added later, review and pin it before use.

These measures reduce common risks; no website can be guaranteed immune to compromise.
