import DeploymentControl from "@/components/deployment-control";

export const metadata = {
  title: "Deployments",
  description: "Run a simulated deployment preflight, remediation, and canary release sequence.",
};

export default function DeploymentsPage() {
  return <DeploymentControl />;
}
