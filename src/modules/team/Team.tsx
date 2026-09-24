import { Sparkles } from "lucide-react";
import { EmptyState, ModuleHead } from "../../ui/ModuleHead";

export function Team() {
  return (
    <>
      <ModuleHead />
      <EmptyState icon={<Sparkles size={28} />} title="Bientôt disponible" />
    </>
  );
}
export default Team;
