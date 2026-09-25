import { MappingWorkbench } from "@/components/mapping-workbench";

export const metadata = {
  title: "Data mapping",
  description: "Review simulated customer field mappings and record human decisions.",
};

export default function DataPage() {
  return <MappingWorkbench />;
}
