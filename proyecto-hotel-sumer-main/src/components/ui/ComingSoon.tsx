import { PageHeader } from "./PageHeader";
import { Card } from "./Card";

type ComingSoonProps = {
  name: string;
  taskRef?: string;
};

export const ComingSoon = ({ name, taskRef }: ComingSoonProps) => (
  <>
    <PageHeader
      title={name}
      description="Próximamente — en construcción."
    />
    <Card>
      <p className="text-sm text-slate-600">
        Esta sección estará disponible en la próxima iteración del rediseño
        v1.1.
        {taskRef && (
          <span className="block mt-2 text-xs text-slate-400 font-mono">
            Pendiente · {taskRef}
          </span>
        )}
      </p>
    </Card>
  </>
);
