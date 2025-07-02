import React from "react";
import { Modal, Box, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

// Importa todos los SVGs de edificios de forma dinámica compatible con Vite
export default function ModalEdificio({ open, onClose, edificio, edificiosData }) {
  if (!edificio) return null;
  const edificioObj = edificiosData.find(e => e.nombre === edificio);
  if (!edificioObj) return null;

  // Usar import.meta.glob para importar todos los SVGs
  const svgs = React.useMemo(() => {
    // El glob importa todos los SVGs de la carpeta assets
    return import.meta.glob('./assets/*.svg', { eager: true, as: 'url' });
  }, []);

  // Normaliza el nombre del archivo
  const svgKey = `./assets/${edificioObj.nombre.toLowerCase().replace(/ /g, '')}.svg`;
  const imgSrc = svgs[svgKey] || '';

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', bgcolor: '#fff', boxShadow: 24, p: 2, borderRadius: 2, outline: 'none', minWidth: 320, maxWidth: 600 }}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <IconButton onClick={onClose}><CloseIcon /></IconButton>
        </Box>
        <div style={{ textAlign: 'center', marginBottom: 12, fontWeight: 700, fontSize: 18 }}>{edificioObj.nombre}</div>
        {imgSrc ? (
          <img src={imgSrc} alt={edificioObj.nombre} style={{ width: '100%', maxHeight: 400, objectFit: 'contain' }} />
        ) : (
          <div>No se encontró la imagen del edificio.</div>
        )}
      </Box>
    </Modal>
  );
}
