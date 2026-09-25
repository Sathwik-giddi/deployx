export const navigationGroups = [
  {
    label: "Operate",
    items: [
      { href: "/", label: "Overview", short: "OV", description: "Production posture and next decisions" },
      { href: "/topology", label: "Environment graph", short: "TP", description: "Resources, permissions, and blast radius" },
      { href: "/incidents", label: "Incidents", short: "IC", description: "Evidence and remediation workspace" },
      { href: "/deployments", label: "Deployments", short: "DP", description: "Preflight, canary, and rollback" },
    ],
  },
  {
    label: "Build",
    items: [
      { href: "/data", label: "Data mapping", short: "DT", description: "Review canonical field suggestions" },
      { href: "/apis", label: "API discovery", short: "AP", description: "Observed REST and SOAP contracts" },
      { href: "/integrations", label: "Integration studio", short: "IN", description: "Mappings, policies, and adapter evidence" },
      { href: "/lab", label: "ACME-LAB", short: "LB", description: "Reproduce enterprise failure modes" },
    ],
  },
  {
    label: "Reuse",
    items: [
      { href: "/playbooks", label: "Customer playbooks", short: "PB", description: "Environment-specific operating rules" },
      { href: "/memory", label: "Deployment memory", short: "DM", description: "Patterns learned from prior deployments" },
    ],
  },
] as const;
