import PlaybookEditor from "@/components/playbook-editor";

export const metadata = {
  title: "Playbooks",
  description: "Edit and save a simulated deployment policy contract.",
};

export default function PlaybooksPage() {
  return <PlaybookEditor />;
}
