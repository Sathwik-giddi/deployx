import { TopologyMap } from "@/components/topology-map";

export const metadata = {
  title: "Environment graph",
  description: "Trace simulated infrastructure, data, identity, and service dependencies.",
};

export default function TopologyPage() {
  return <TopologyMap />;
}
