import { Sparkles } from "lucide-react";
import { EmptyState, ModuleHead } from "../../ui/ModuleHead";

export function Docs({ topic }: { topic: string }) {
  return (
    <>
      <ModuleHead />
      <EmptyState icon={<Sparkles size={28} />} title={`Aide · ${topic}`} />
    </>
  );
}
export default Docs;
