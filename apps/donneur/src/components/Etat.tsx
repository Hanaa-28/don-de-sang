import type { ReactNode } from "react";
import { CircleCheck, CircleMinus, Clock, TriangleAlert } from "lucide-react";

const FIGURES = {
  seve: CircleCheck,
  ocre: Clock,
  sang: TriangleAlert,
  neutre: CircleMinus,
};

/** Un état s'écrit toujours avec une icône ET un mot (daltonisme, écran mal réglé). */
export default function Etat({ ton = "neutre", children }: { ton?: keyof typeof FIGURES; children: ReactNode }) {
  const Icone = FIGURES[ton];
  return (
    <span className={`etat etat--${ton}`}>
      <Icone size={18} aria-hidden="true" />
      <span>{children}</span>
    </span>
  );
}
