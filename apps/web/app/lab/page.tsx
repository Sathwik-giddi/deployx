import LabControl from "@/components/lab-control";

export const metadata = {
  title: "ACME-LAB",
  description: "Inject simulated faults, run a sweep, and reset the DEPLOYX lab.",
};

export default function LabPage() {
  return <LabControl />;
}
