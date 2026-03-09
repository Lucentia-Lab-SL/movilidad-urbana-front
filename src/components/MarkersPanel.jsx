import { Trash2 } from "lucide-react";

const MarkersPanel = ({ markers, onRemove, onClearAll }) => (
  <div className="flex flex-col gap-3">
    <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">Marcadores</h3>
    <p className="text-xs text-muted-foreground">Haz click en el mapa para añadir un punto.</p>

    {markers.length === 0 ? (
      <p className="text-xs text-muted-foreground italic py-4 text-center">
        Aún no hay marcadores. Haz click en el mapa para crear el primero.
      </p>
    ) : (
      <>
        <ul className="flex flex-col gap-2 max-h-48 overflow-y-auto">
          {markers.map((m, i) => (
            <li key={i} className="flex items-center justify-between bg-secondary rounded-md px-3 py-2">
              <div className="text-xs">
                <span className="font-medium text-foreground">Punto {i + 1}</span>{" "}
                <span className="text-muted-foreground">
                  ({m.lat.toFixed(5)}, {m.lng.toFixed(5)})
                </span>
              </div>
              <button onClick={() => onRemove(i)} className="text-xs text-destructive hover:opacity-70 transition-opacity">
                Eliminar
              </button>
            </li>
          ))}
        </ul>
        <button onClick={onClearAll} className="text-xs font-medium text-muted-foreground hover:text-destructive transition-colors self-start">
          Borrar todos
        </button>
      </>
    )}
  </div>
);

export default MarkersPanel;