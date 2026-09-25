# Security Policy

DEPLOYX is a simulation-first project. The current control plane uses deterministic in-memory ACME data, does not connect to customer infrastructure, and does not execute deployments.

## Reporting a vulnerability

If you find a security issue, use the repository's Security tab to submit a private GitHub Security Advisory when private reporting is available. Do not include exploit details, secrets, customer data, or private endpoints in a public issue.

If private reporting is unavailable, open a minimal issue that describes the affected component and asks the maintainer for a private contact channel. Move technical details into a private conversation.

## Handling sensitive data

- Never commit credentials, access tokens, certificates, private endpoints, or customer records.
- Use `.env.example` files to document variable names only.
- Keep ACME-LAB services loopback-bound unless you intentionally configure a separate, reviewed environment.
- Treat the local fault controls as a simulation surface, not as a production security boundary.

## Supported versions

The project currently has no tagged release line. Security fixes are applied to the default branch and released through the repository's normal pull request process.
