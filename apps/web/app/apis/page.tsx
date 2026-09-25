import { ApiCatalog } from "@/components/api-catalog";

export const metadata = {
  title: "API discovery",
  description: "Inspect simulated REST and SOAP contracts discovered in the ACME estate.",
};

export default function ApisPage() {
  return <ApiCatalog />;
}
