import { useState } from 'react';
import './FormulariosView.css';

export const FORMULARIOS_URL = 'https://directorio-paneles-yaavs.onrender.com/';

export function FormulariosView() {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <div className="formularios-view">
      {!loaded && !failed && (
        <p className="formularios-view-status" role="status">
          Cargando formularios…
        </p>
      )}
      {failed ? (
        <div className="formularios-view-fallback">
          <p>No se pudo mostrar el directorio aquí dentro.</p>
          <a href={FORMULARIOS_URL} target="_self" rel="noopener noreferrer">
            Abrir directorio de paneles
          </a>
        </div>
      ) : (
        <iframe
          className="formularios-view-frame"
          src={FORMULARIOS_URL}
          title="Directorio de paneles Yaavs — Formularios"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}
