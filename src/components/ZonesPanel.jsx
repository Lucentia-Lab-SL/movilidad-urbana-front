import { Trash2 } from "lucide-react";

const ZonesPanel = ({ zones, isDrawing, tempZone, onStartDrawing, onCloseZone, onCancel, onRemoveZone }) => (
  <div className="flex flex-col gap-3">
    <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">Zonas</h3>
    <p className="text-xs text-muted-foreground">
      Crea zonas añadiendo vértices sobre el mapa.
    </p>

    <div className="flex gap-2 flex-wrap">
      {!isDrawing ? (
        <button
          onClick={onStartDrawing}
          className="h-[36px] px-4 rounded-md bg-accent text-accent-foreground text-xs font-medium hover:opacity-90 transition-opacity duration-150"
        >
          Crear zona
        </button>
      ) : (
        <>
          {tempZone.length >= 3 && (
            <button
              onClick={onCloseZone}
              className="h-[36px] px-4 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity duration-150"
            >
              Cerrar zona
            </button>
          )}
          <button
            onClick={onCancel}
            className="h-[36px] px-4 rounded-md border border-border text-xs font-medium text-muted-foreground hover:text-foreground transition-colors duration-150"
          >
            Cancelar
          </button>
          <span className="text-xs text-muted-foreground self-center">
            {tempZone.length} vértice(s)
          </span>
        </>
      )}
    </div>

    {zones.length === 0 && !isDrawing ? (
      <p className="text-xs text-muted-foreground italic py-4 text-center">
        Aún no hay zonas. Pulsa 'Crear zona' para dibujar una.
      </p>
    ) : (
      <ul className="flex flex-col gap-2 max-h-40 overflow-y-auto">
        {zones.map((z, i) => (
          <li key={i} className="flex items-center justify-between bg-secondary rounded-md px-3 py-2">
            <span className="text-xs font-medium text-foreground">
              Zona {i + 1} ({z.points.length} puntos)
            </span>
            <button
              onClick={() => onRemoveZone(i)}
              className="text-xs text-destructive hover:opacity-70 transition-opacity"
            >
              Eliminar
            </button>
          </li>
        ))}
      </ul>
    )}
  </div>
);

export default ZonesPanel;