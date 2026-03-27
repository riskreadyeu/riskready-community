# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in RiskReady Community Edition, please report it responsibly.

**Do not open a public GitHub issue for security vulnerabilities.**

Instead, please email: **security@riskready.dev**

Include the following in your report:

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

We will acknowledge receipt within 48 hours and aim to provide an initial assessment within 5 business days.

## Supported Versions

| Version | Supported |
|---------|-----------|
| 0.1.x   | Yes       |

## Scope

### In Scope

- Authentication and authorisation bypass
- SQL injection, XSS, CSRF
- Remote code execution
- Privilege escalation
- Data exposure
- Dependency vulnerabilities with known exploits

### Out of Scope

- Denial of service attacks
- Social engineering
- Vulnerabilities in third-party services not maintained by this project
- Issues requiring physical access to the server
- Missing security headers that do not lead to a concrete exploit

## Disclosure

We follow a coordinated disclosure process. We ask that you:

1. Allow us reasonable time to fix the issue before public disclosure
2. Make a good faith effort to avoid privacy violations, data destruction, or service disruption
3. Do not access or modify data belonging to other users

We will credit reporters in the release notes unless anonymity is requested.
