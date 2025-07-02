import React from "react";
import mapa from "./assets/mapa.jpg";
import DaractISVG from "./assets/daractI.svg";
import DaractIISVG from "./assets/daractII.svg";
import DorregoSVG from "./assets/dorrego.svg";
import HistoricoSVG from "./assets/historico.svg";

const edificiosSVG = {
  "Daract I": DaractISVG,
  "Daract II": DaractIISVG,
  "Dorrego": DorregoSVG,
  "Histórico": HistoricoSVG,
};

export default function MapaEdificios({ edificioFocus }) {
  return (
    <div style={{ position: "relative", width: "100%", maxWidth: 900, margin: "0 auto" }}>
      <img src={mapa} alt="Mapa UNM" style={{ width: "100%", display: "block" }} />
      {Object.entries(edificiosSVG).map(([nombre, SVG]) => (
        <img
          key={nombre}
          src={SVG}
          alt={nombre}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            opacity: edificioFocus === nombre ? 1 : 0.18,
            filter: edificioFocus === nombre ? "drop-shadow(0 0 10px #ff0)" : "none",
            pointerEvents: "none",
            transition: "opacity 0.3s"
          }}
        />
      ))}
    </div>
  );
}
