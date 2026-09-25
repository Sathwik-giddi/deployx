import { IntegrationStudio } from "@/components/integration-studio";

export const metadata = {
  title: "Integration studio",
  description: "Configure a simulated customer adapter and generate local validation evidence.",
};

export default function IntegrationsPage() {
  return <IntegrationStudio />;
}
