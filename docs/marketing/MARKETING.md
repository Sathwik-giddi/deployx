# DEPLOYX marketing kit

This directory contains original vector product visuals for demos, documentation, social posts, and portfolio pages. They are product previews based on the DEPLOYX simulation workspace, not screenshots of a live customer environment.

## Asset index

| Asset | Use | Suggested alt text |
| --- | --- | --- |
| `../../apps/web/public/marketing/console-preview.svg` and `.png` | README hero, demo thumbnail, launch post | DEPLOYX operations console showing a production graph, three deployment blockers, and an incident workspace |
| `../../apps/web/public/marketing/architecture.svg` and `.png` | Architecture explainer, conference slide, README section | DEPLOYX architecture showing discovery, customer graph, compatibility, integration, deployment, release evidence, incident, and memory layers |
| `../../apps/web/public/marketing/workflow.svg` and `.png` | Process explanation, social carousel, onboarding | Six-step DEPLOYX operator workflow from discovery to deployment memory |
| `../../apps/web/public/marketing/og-card.svg` and `.png` | Social preview and video title card | DEPLOYX open-source deployment operations project card |

## Short project description

DEPLOYX is an open-source deployment operations workspace for Forward Deployment Engineers. It models the path from discovering an unfamiliar enterprise estate to reviewing data mappings, validating compatibility, rehearsing a canary, responding to an incident, and saving a reusable deployment pattern.

The current repository is simulation-first. ACME is fictional, the control plane uses deterministic in-memory data, and the project does not connect to customer infrastructure or execute deployments.

## README embed

```markdown
![DEPLOYX operations console preview](apps/web/public/marketing/console-preview.svg)

![DEPLOYX architecture showing discovery, customer graph, compatibility, integration, deployment, release evidence, incident, and memory layers](apps/web/public/marketing/architecture.svg)

![DEPLOYX operator workflow](apps/web/public/marketing/workflow.svg)
```

## Launch copy

### One-line version

DEPLOYX models unfamiliar enterprise estates as evidence-backed deployment plans in a safe simulation.

### Short version

I built DEPLOYX as an open-source deployment operations workspace for FDEs. It brings environment discovery, data and API review, compatibility checks, canary rehearsal, incident response, and deployment memory into one simulation-first workflow.

### Longer version

Before a release, an operator needs to answer four questions: which system owns the data, which dependencies sit behind an API, which network path is blocked, and which failure will return during the next release. The current console makes those answers visible and reviewable in local rehearsal views. The repository includes a Next.js console, a FastAPI control plane, a reproducible ACME-LAB, domain tests, and CI configuration.

Use the project as a technical portfolio piece, a discussion starter for FDE workflows, or a safe foundation for adding real provider adapters behind explicit controls.

## Demo script

1. Open the environment graph and select Customer DB.
2. Show the dependent services and the blocked Snowflake path.
3. Review a customer identifier mapping and record a decision.
4. Generate adapter evidence in the integration studio.
5. Run deployment preflight and apply one remediation.
6. Run a fresh preflight, open the gate, and rehearse a canary rollback.
7. Open the incident workspace and record containment.
8. Show the customer playbook and deployment memory.

## Content rules

- Keep the ACME and simulation labels visible.
- Do not present the preview as a live customer deployment.
- Do not add customer logos, testimonials, performance claims, or security certifications without evidence.
- Replace simulation metrics with measured results only after collecting them.
- Use the original vector assets as the source for new crops and video frames.
