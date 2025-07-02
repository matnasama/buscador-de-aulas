import React, { useState, useEffect } from 'react';
import logo from '/Logo.png';
import './App.css';
import {
	Box,
	Container,
	Typography,
	Button,
	TextField,
	Grid,
	Paper,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	IconButton, // <-- Aseguramos que IconButton esté importado
} from '@mui/material';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import '@fontsource/montserrat/700.css';
import MapaEdificios from "./MapaEdificios";
import edificios from "../public/json/edificios.json";
import ModalEdificio from "./ModalEdificio";
import SearchIcon from "@mui/icons-material/Search";

// Departamentos y carreras (puedes ajustar los nombres según tus archivos JSON)
const departamentos = [
	{
		nombre: 'Departamento de Ciencias Aplicadas y Tecnología',
		carpeta: 'DCAYT',
		carreras: [
			'Ingeniería en Electrónica',
			'Licenciatura en Gestión Ambiental',
			'Arquitectura',
			'Licenciatura en Biotecnología',
			'Diseño Industrial',
			'Diseño de Indumentaria',
			'Diseño Multimedial',
			'Diseño en Comunicación Visual',
		],
	},
	{
		nombre: 'Departamento de Ciencias Económicas y Jurídicas',
		carpeta: 'DCEYJ',
		carreras: [
			'Licenciatura en Relaciones del Trabajo',
			'Licenciatura en Administración',
			'Licenciatura en Economía',
			'Contador Público Nacional',
			'Abogacía',
			'Ciclo Comun', // agregado para que se cargue el archivo CICLO_COMUN.json
		],
	},
	{
		nombre: 'Departamento de Humanidades y Ciencias Sociales',
		carpeta: 'DHYCS',
		carreras: [
			'Licenciatura en Trabajo Social',
			'Licenciatura en Comunicación Social',
			'Licenciatura en Educación Secundaria',
			'Licenciatura en Educación Inicial',
		],
	},
];

// Mapeo de carreras a archivos JSON existentes
const carreraAJson = {
	// DCAYT
	'Ingeniería en Electrónica': 'INEL.json',
	'Licenciatura en Gestión Ambiental': 'LGA.json',
	'Arquitectura': 'ARQ.json',
	'Licenciatura en Biotecnología': 'BIO.json',
	'Diseño Industrial': 'DIN.json',
	'Diseño de Indumentaria': 'DDI.json',
	'Diseño Multimedial': 'DMU.json',
	'Diseño en Comunicación Visual': 'DCV.json',
	// DCEYJ
	'Licenciatura en Relaciones del Trabajo': 'LRT.json',
	'Licenciatura en Administración': 'LADM.json',
	'Licenciatura en Economía': 'LECON.json',
	'Contador Público Nacional': 'CPN.json',
	'Abogacía': 'ABG.json',
	'Ciclo Comun': 'CICLO_COMUN.json', // clave igual a la que se usaría en carreras
	// DHYCS
	'Licenciatura en Trabajo Social': 'LTS.json',
	'Licenciatura en Comunicación Social': 'LCS.json',
	'Licenciatura en Educación Secundaria': 'LES.json',
	'Licenciatura en Educación Inicial': 'LEI.json',
};

// Cambiar fetch a /public/json/... para entorno Vite
// Al cargar todas las asignaturas, si la materia viene de CICLO COMUN.json y la carrera es una de las 4 de DCEYJ, duplica la materia para cada carrera con _carrera = 'Ciclo Comun'
const getAllAsignaturas = async () => {
	const all = [];
	for (const dep of departamentos) {
		for (const carrera of dep.carreras) {
			const jsonFile = carreraAJson[carrera];
			if (!jsonFile) {
				console.warn('No hay archivo JSON para', carrera);
				continue;
			}
			try {
				// Forzar nombre de archivo a minúsculas y guiones bajos para CICLO_COMUN
				let url = `/json/${dep.carpeta}/${jsonFile}`;
				if (
					jsonFile === 'CICLO_COMUN.json' ||
					jsonFile === 'CICLO COMUN.json' ||
					jsonFile === 'Ciclo Comun.json'
				) {
					url = '/json/DCEYJ/CICLO_COMUN.json';
				}
				const res = await fetch(url);
				if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
					const data = await res.json();
					if (
						(jsonFile === 'CICLO_COMUN.json' || jsonFile === 'CICLO COMUN.json') &&
						dep.carpeta === 'DCEYJ'
					) {
						data.forEach(a =>
							all.push({ ...a, _departamento: dep.nombre, _carrera: 'Ciclo Comun', _carpeta: dep.carpeta })
						);
					} else {
						data.forEach(a => all.push({ ...a, _departamento: dep.nombre, _carrera: carrera, _carpeta: dep.carpeta }));
					}
				} else {
					console.warn('Respuesta no JSON o no OK para', url);
				}
			} catch (e) {
				console.error('Error al obtener', dep.carpeta, carrera, e);
			}
		}
	}
	return all;
};

// Función para normalizar texto y quitar tildes/acentos
function normalizar(str) {
	return (str || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

function App() {
	const [departamento, setDepartamento] = useState(null);
	const [carrera, setCarrera] = useState(null);
	const [comisiones, setComisiones] = useState([]);
	const [busqueda, setBusqueda] = useState('');
	const [codigo, setCodigo] = useState('');
	const [asignaturaSeleccionada, setAsignaturaSeleccionada] = useState(null);
	const [todasAsignaturas, setTodasAsignaturas] = useState([]);
	const [pagina, setPagina] = useState(1);
	const porPagina = 10;
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
	const isVerySmall = useMediaQuery('(max-width:400px)');
	const isWide = useMediaQuery('(min-width:908px)');
	const isWideComisiones = useMediaQuery('(min-width:1106px)');
	const [edificioFocus, setEdificioFocus] = useState(null);
	const [modalEdificioOpen, setModalEdificioOpen] = useState(false);
	const [edificioModal, setEdificioModal] = useState(null);

	// Cargar todas las asignaturas al inicio
	useEffect(() => {
		getAllAsignaturas().then(asigs => {
			setTodasAsignaturas(asigs);
			// LOG global para ver si hay materias de Ciclo Comun en memoria
			const cicloComun = asigs.filter(a => a._carrera === 'Ciclo Comun');
		});
	}, []);

	// Buscar por código y comisión
	useEffect(() => {
		if (codigo && todasAsignaturas.length > 0) {
			const match = codigo.match(/^(\d+)[-–](\d+)$/);
			if (match) {
				const cod = match[1];
				const com = match[2];
				const found = todasAsignaturas.find(a => Array.isArray(a.Comisiones) && a.Comisiones.some(c => String(c['Comisión']) === `${cod}-${com}`));
				if (found && found.Comisiones) {
					const comision = found.Comisiones.find(c => String(c['Comisión']) === `${cod}-${com}`);
					if (comision) {
						setAsignaturaSeleccionada(found);
						setComisiones([comision]);
						return;
					}
				}
			} else {
				// Solo código: mostrar todas las comisiones
				const found = todasAsignaturas.find(a => String(a['Código']) === codigo);
				if (found) {
					setAsignaturaSeleccionada(found);
					setComisiones(found.Comisiones || []);
					return;
				}
			}
			// Si no encuentra nada, limpiar selección
			setAsignaturaSeleccionada(null);
			setComisiones([]);
		}
	}, [codigo, todasAsignaturas]);

	// Buscar por nombre
	// const asignaturasFiltradas = todasAsignaturas.filter(a =>
	//   a['Asignatura-Actividad']?.toLowerCase().includes(busqueda.toLowerCase()) ||
	//   String(a['Código']).includes(busqueda)
	// );

	// Buscar por código de comisión (input arriba)
	useEffect(() => {
		const buscarComision = async () => {
			if (codigo) {
				let pool = todasAsignaturas;
				if (departamento) pool = pool.filter(a => a._carpeta === departamento.carpeta);
				if (carrera) pool = pool.filter(a => a._carrera === carrera);
				let found = null;
				let foundAsignatura = null;
				for (const a of pool) {
					if (a.Comisiones) {
						for (const c of a.Comisiones) {
							if (String(c['Comisión']) === codigo) {
								found = c;
								foundAsignatura = a;
								break;
							}
						}
					}
					if (found) break;
				}
				if (found && foundAsignatura) {
					setAsignaturaSeleccionada(foundAsignatura);
					setComisiones(foundAsignatura.Comisiones || []);
				}
			}
		};
		buscarComision();
		// eslint-disable-next-line
	}, [codigo, departamento, carrera, todasAsignaturas]);

	// Filtrado global
	const filtroGlobal = a => {
		const texto = normalizar(busqueda);
		return (
			(!departamento || a._carpeta === departamento.carpeta) &&
			(!carrera || a._carrera === carrera) &&
			(!busqueda || normalizar(a['Asignatura-Actividad']).includes(texto) || String(a['Código']).includes(busqueda))
		);
	};
	// Esperar a que todasAsignaturas esté cargado antes de calcular la paginación
	const cargado = todasAsignaturas && todasAsignaturas.length > 0;
	// --- FILTRO AUTOMÁTICO GLOBAL (ORDEN CORRECTO Y SIN DUPLICADOS) ---
	const mostrarPorCodigoMateria = codigo.trim().length > 0;
	const mostrarPorBusqueda = busqueda.trim().length > 0;
	let asignaturasFiltradasPaginadas = [];
	let totalPaginas = 1;
	let asignaturasPagina = [];

	if (cargado) {
		let pool = todasAsignaturas;
		if (departamento) pool = pool.filter(a => a._carpeta === departamento.carpeta);
		if (carrera) {
			const carrerasCicloComun = [
				'Licenciatura en Relaciones del Trabajo',
				'Licenciatura en Administración',
				'Licenciatura en Economía',
				'Contador Público Nacional',
			];
			if (carrerasCicloComun.includes(carrera)) {
				pool = pool.filter(
					a => (a._carrera === carrera) || (a._carrera === 'Ciclo Comun' && a._carreraOriginal === carrera)
				);
			} else {
				pool = pool.filter(a => a._carrera === carrera);
			}
		} else if (departamento && departamento.carpeta === 'DCEYJ') {
			const carrerasCicloComun = [
				'Licenciatura en Relaciones del Trabajo',
				'Licenciatura en Administración',
				'Licenciatura en Economía',
				'Contador Público Nacional',
			];
			pool = pool.filter(a =>
				carrerasCicloComun.includes(a._carrera) || (a._carrera === 'Ciclo Comun' && carrerasCicloComun.includes(a._carreraOriginal))
			);
		}
		// FILTRO: solo mostrar asignaturas con al menos una comisión con aula distinta de '***'
		pool = pool.filter(a => Array.isArray(a.Comisiones) && a.Comisiones.some(c => String(c['Aula'] || c['Aula/s'] || '').trim() !== '***'));
		// LOG para depuración
		const cicloComun = pool.filter(a => a._carrera === 'Ciclo Comun');
		if (mostrarPorCodigoMateria) {
			// Si el input es del tipo CODIGO-COMISION (ej: 2011-02)
			const match = codigo.match(/^(\d+)[-–](\d*)$/); // Permite que la parte de comisión sea vacía
			if (match) {
				const cod = match[1];
				const com = match[2];
				pool = pool.filter(a => Array.isArray(a.Comisiones) && a.Comisiones.some(c => String(c['Comisión']).startsWith(`${cod}-${com}`)));
				asignaturasFiltradasPaginadas = pool.map(a => {
					const comisionesFiltradas = a.Comisiones.filter(c => String(c['Comisión']).startsWith(`${cod}-${com}`));
					// Selección automática solo si la comisión es completa y única
					if (comisionesFiltradas.length === 1 && com.length > 0 && (!asignaturaSeleccionada || asignaturaSeleccionada['Código'] !== a['Código'] || comisiones.length !== 1 || comisiones[0]['Comisión'] !== comisionesFiltradas[0]['Comisión'])) {
						setAsignaturaSeleccionada(a);
						setComisiones(comisionesFiltradas);
					}
					return { ...a, Comisiones: comisionesFiltradas };
				});
			} else {
				// Filtrado en tiempo real por código parcial
				pool = pool.filter(a => String(a['Código']).startsWith(codigo));
				asignaturasFiltradasPaginadas = pool;
				if (pool.length === 1 && (!asignaturaSeleccionada || asignaturaSeleccionada['Código'] !== pool[0]['Código'])) {
					setAsignaturaSeleccionada(pool[0]);
					setComisiones(pool[0].Comisiones || []);
				}
			}
		} else if (mostrarPorBusqueda) {
			const texto = normalizar(busqueda);
			asignaturasFiltradasPaginadas = pool.filter(a => normalizar(a['Asignatura-Actividad']).includes(texto) || String(a['Código']).includes(busqueda));
		} else {
			asignaturasFiltradasPaginadas = pool;
		}
		totalPaginas = Math.max(1, Math.ceil(asignaturasFiltradasPaginadas.length / porPagina));
		asignaturasPagina = asignaturasFiltradasPaginadas.slice((pagina - 1) * porPagina, pagina * porPagina);
	}

	// Función para obtener el edificio por aula
	function getEdificioByAula(aula) {
		if (!aula) return null;
		const edificio = edificios.find(e => e.aulas.includes(aula.trim()));
		return edificio ? edificio.nombre : null;
	}

	return (
		<Box
			sx={{
				bgcolor: '#fff',
				minHeight: '100vh',
				py: 2,
				width: '100vw',
				minWidth: 340,
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
			}}
		>
			<Box
  sx={{
    width: '100%',
    bgcolor: '#0a2447',
    display: 'flex',
    alignItems: 'center',
    py: isMobile ? 1.5 : 2.5,
    pl: isMobile ? 2 : 10,
    pr: isMobile ? 1 : 0,
    borderRadius: 0,
    mt: 0,
    mb: 0,
    boxSizing: 'border-box',
    maxWidth: '100%', // Cambia maxWidth a 100% para que nunca sobresalga
    margin: '0 auto',
  }}
>
  <img src={logo} alt="Logo UNM" style={{ height: isMobile ? 60 : 90, marginRight: isMobile ? 2 : 22, marginLeft: 0, flexShrink: 0 }} />
  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start' }}>
    <span style={{
      color: '#fff',
      fontWeight: 700,
      fontSize: isMobile ? 16 : 22,
      letterSpacing: .2,
      fontFamily: 'Montserrat, Arial Narrow, Arial, sans-serif',
      fontStretch: 'condensed',
      lineHeight: 1.05,
      textTransform: 'uppercase',
      textAlign: 'left',
      display: 'block',
    }}>
      UNIVERSIDAD
    </span>
    <span style={{
      color: '#fff',
      fontWeight: 700,
      fontSize: isMobile ? 16 : 22,
      letterSpacing: .2,
      fontFamily: 'Montserrat, Arial Narrow, Arial, sans-serif',
      fontStretch: 'condensed',
      lineHeight: 1.05,
      textTransform: 'uppercase',
      textAlign: 'left',
      display: 'block',
    }}>
      NACIONAL
    </span>
    <span style={{
      color: '#fff',
      fontWeight: 700,
      fontSize: isMobile ? 16 : 22,
      letterSpacing: .2,
      fontFamily: 'Montserrat, Arial Narrow, Arial, sans-serif',
      fontStretch: 'condensed',
      lineHeight: 1.05,
      textTransform: 'uppercase',
      textAlign: 'left',
      display: 'block',
    }}>
      DE MORENO
    </span>
  </div>
</Box>
			<Container
				maxWidth={false}
				disableGutters
				sx={{
					bgcolor: '#fff',
					minWidth: 340,
					width: isWide ? '100vw' : '90%',
					maxWidth: isWide ? '100vw' : 1000,
					px: isMobile ? 0.5 : 3,
					borderRadius: 2,
					boxShadow: 3,
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
				}}
			>
				<Typography variant="h4" align="center" sx={{ mb: 4, color: '#111', fontWeight: 700, pt: 5 }}>
					ASIGNACIÓN DE COMISIONES
				</Typography>
				<Typography variant="h6" align="center" sx={{ mb: 4, color: '#111' }}>
					Primer cuatrimestre 2025
				</Typography>
				<Typography variant="h6" sx={{ mb: 2, color: '#111' }}>Filtro de Materias</Typography>
				<Typography sx={{ mb: 4, color: '#111', fontSize: 16, px: 5 }}>
					Si sabés el nombre de la asignatura o el código de la materia podés ingresarlos directamente en los campos de búsqueda.
				</Typography>
				<Grid container spacing={2} alignItems="center" sx={{ mb: 4, placeContent:'center', px: 6 }}>
					<Grid item xs={12} sm={5}>
						<TextField
							fullWidth
							label="Buscar código"
							variant="outlined"
							size="small"
							value={codigo}
							onChange={e => {
								setCodigo(e.target.value);
								setBusqueda('');
								setDepartamento(null);
								setCarrera(null);
								setAsignaturaSeleccionada(null);
								setComisiones([]);
								setPagina(1);
							}}
							InputProps={{ style: { background: '#fff' } }}
						/>
					</Grid>
					<Grid item xs={12} sm={5}>
						<TextField
							fullWidth
							label="Buscar por nombre"
							variant="outlined"
							size="small"
							value={busqueda}
							onChange={e => {
								setBusqueda(e.target.value);
								setCodigo('');
								setDepartamento(null);
								setCarrera(null);
								setAsignaturaSeleccionada(null);
								setComisiones([]);
								setPagina(1);
							}}
							InputProps={{ style: { background: '#fff' } }}
						/>
					</Grid>
					<Grid item xs={12} sm={2}>
						<Button
							fullWidth
							variant="contained"
							color="secondary"
							onClick={() => {
								setDepartamento(null);
								setCarrera(null);
								setBusqueda('');
								setCodigo('');
								setAsignaturaSeleccionada(null);
								setComisiones([]);
								setPagina(1);
							}}
							sx={{ height: '40px', bgcolor: '#888', color: '#fff', '&:hover': { bgcolor: '#666' } }}
						>
							Limpiar filtros
						</Button>
					</Grid>
				</Grid>
				{/* SOLO mostrar botones de departamento/carrera si NO hay búsqueda por texto ni código */}
				{!mostrarPorCodigoMateria && !mostrarPorBusqueda && (
					<>
						<Typography variant="h6" align="center" sx={{ mb: 2, color: '#111' }}>Seleccioná tu departamento</Typography>
						<Grid container spacing={1} justifyContent="center" sx={{ mb: 4 }}>
							{departamentos.map(dep => (
								<Grid item key={dep.carpeta} xs={12} sm={8} md={4}>
									<Button
										fullWidth
										variant="contained"
										onClick={() => {
											setDepartamento(dep);
											setCarrera(null);
											setAsignaturaSeleccionada(null);
											setComisiones([]);
											setBusqueda('');
											setCodigo('');
											setPagina(1);
										}}
										sx={{
											bgcolor: dep.carpeta === 'DCAYT' ? '#3399cc' : dep.carpeta === 'DCEYJ' ? '#006400' : '#ff0000',
											color: '#fff',
											fontWeight: departamento?.carpeta === dep.carpeta ? 'bold' : 'normal',
											mb: 1,
											fontSize: isVerySmall ? 13 : 15,
											'&:hover': {
												bgcolor: dep.carpeta === 'DCAYT' ? '#2176a5' : dep.carpeta === 'DCEYJ' ? '#003d00' : '#b20000',
											},
										}}
									>
										{dep.nombre.replace('Departamento de ', '')}
									</Button>
								</Grid>
							))}
						</Grid>
						{departamento && (
							<>
								<Typography variant="h6" align="center" sx={{ mb: 2, color: '#111' }}>Seleccioná tu carrera</Typography>
								<Grid container spacing={1} justifyContent="center" sx={{ mb: 4 }}>
									{departamento.carreras.map(c => (
										<Grid item key={c} xs={12} sm={8} md={6}>
											<Button
												fullWidth
												variant="contained"
												onClick={() => {
													setCarrera(c);
													setAsignaturaSeleccionada(null);
													setComisiones([]);
													setBusqueda('');
													setCodigo('');
													setPagina(1);
												}}
												sx={{
													bgcolor: carrera === c
														? (departamento.carpeta === 'DCAYT'
																? '#3399cc'
																: departamento.carpeta === 'DCEYJ'
																	? '#006400'
																	: '#ff0000')
														: '#888',
													color: '#fff',
													fontWeight: carrera === c ? 'bold' : 'normal',
													mb: 1,
													fontSize: isVerySmall ? 13 : 15,
													'&:hover': {
														bgcolor: carrera === c
															? (departamento.carpeta === 'DCAYT'
																	? '#2176a5'
																	: departamento.carpeta === 'DCEYJ'
																		? '#003d00'
																		: '#b20000')
															: '#666',
													},
												}}
											>
												{c}
											</Button>
										</Grid>
									))}
								</Grid>
							</>
						)}
					</>
				)}
				{/* TABLA DE ASIGNATURAS: modo tabla en desktop, modo cards en mobile */}
				{!cargado ? (
					<div style={{ marginTop: 32, textAlign: 'center' }}>Cargando asignaturas...</div>
				) : (
					<div style={{ marginTop: 16, marginBottom: 32, width: '100%' }}>
						<h3 style={{color: '#111'}}>ASIGNATURAS</h3>
						<div style={{ marginBottom: 8, color: '#888', fontSize: 14 }}>
							Mostrando {asignaturasFiltradasPaginadas.length} resultados de {todasAsignaturas.length} asignaturas
						</div>
						{/* TITULOS DE COLUMNA SOLO EN MODO WIDE Y UNA SOLA VEZ */}
						{isWide && asignaturasPagina.length > 0 && (
							<div style={{
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'space-between',
								background: '#e0e0e0',
								color: '#333',
								fontWeight: 'bold',
								borderRadius: 6,
								padding: '8px 12px',
								fontSize: 15,
								marginBottom: 8,
								width: '100%',
								maxWidth: 900,
								margin: '8px auto',
								boxSizing: 'border-box',
							}}>
								<span style={{ flexBasis: 220, minWidth: 220, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'left' }}>Asignatura</span>
								<span style={{ flexBasis: 120, minWidth: 120, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center' }}>Código</span>
								<span style={{ flexBasis: 220, minWidth: 220, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center' }}>Carrera</span>
								<span style={{ flexBasis: 180, minWidth: 180, maxWidth: 180 }}></span>
							</div>
						)}
						{/* ASIGNATURAS: CARDS EN COLUMNA SIEMPRE, PERO EN >=780px CADA CARD ES UN ROW (FILA) */}
						<Grid container spacing={2} direction="column">
							{asignaturasPagina.length === 0 ? (
								<Grid item xs={12}>
									<Paper sx={{ p: 2, textAlign: 'center', color: '#888', bgcolor: '#fff' }}>
										No se encontraron asignaturas para los filtros seleccionados.
									</Paper>
								</Grid>
							) : (
								asignaturasPagina.map((a, idx) => (
									<Grid item xs={12} key={a['Código'] + '-' + a._carrera + '-' + idx} sx={{ width: '100%' }}>
										<Paper
											sx={{
												p: 1.5,
												bgcolor: asignaturaSeleccionada === a ? '#e0f7fa' : '#f5f5f5',
												color: asignaturaSeleccionada === a ? '#222' : '#111',
												borderRadius: 2,
												height: '100%',
												display: 'flex',
												flexDirection: isWide ? 'row' : 'column',
												alignItems: isWide ? 'center' : 'stretch',
												justifyContent: isWide ? 'space-between' : 'flex-start',
												gap: isWide ? 0 : 0,
												width: '100%',
												maxWidth: isWide ? 900 : '100%',
												margin: isWide ? 'auto' : undefined,
												boxSizing: 'border-box',
											}}
										>
											<div style={{ fontWeight: 700, fontSize: 16, flexBasis: isWide ? 220 : undefined, flexShrink: 0, flexGrow: 0, minWidth: isWide ? 220 : undefined, maxWidth: isWide ? 220 : undefined, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', boxSizing: 'border-box', width: isWide ? undefined : '100%', textAlign: isWide ? 'left' : undefined }}>
                        {a['Asignatura-Actividad']}
                      </div>
                      <div style={{ fontSize: 14, marginBottom: isWide ? 0 : 4, flexBasis: isWide ? 120 : undefined, flexShrink: 0, flexGrow: 0, minWidth: isWide ? 120 : undefined, maxWidth: isWide ? 120 : undefined, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: isWide ? 'center' : undefined, boxSizing: 'border-box', width: isWide ? undefined : '100%' }}>
                        {isWide ? a['Código'] : `Código: ${a['Código']}`}
                      </div>
                      <div style={{ fontSize: 14, marginBottom: isWide ? 0 : 4, flexBasis: isWide ? 220 : undefined, flexShrink: 0, flexGrow: 0, minWidth: isWide ? 220 : undefined, maxWidth: isWide ? 220 : undefined, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: isWide ? 'center' : undefined, boxSizing: 'border-box', width: isWide ? undefined : '100%' }}>
                        {isWide ? (a._carrera === 'Ciclo Comun' ? 'Ciclo Comun' : a._carrera) : `Carrera: ${a._carrera === 'Ciclo Comun' ? 'Ciclo Comun' : a._carrera}`}
                      </div>
                      <div style={{ flexBasis: isWide ? 180 : undefined, flexShrink: 0, flexGrow: 0, minWidth: isWide ? 180 : undefined, maxWidth: isWide ? 180 : undefined, display: 'flex', justifyContent: isWide ? 'flex-end' : undefined, width: isWide ? '100%' : undefined, boxSizing: 'border-box' }}>
                        <Button
                          onClick={() => {
                            setAsignaturaSeleccionada(a);
                            setComisiones(a.Comisiones || []);
                          }}
                          sx={{ color: '#fff', textTransform: 'none', mt: isWide ? 0 : 1, bgcolor: '#1976d2', '&:hover': { bgcolor: '#115293' }, minWidth: isWide ? 140 : undefined }}
                          fullWidth={!isWide}
                        >
                          Ver comisiones
                        </Button>
                      </div>
										</Paper>
									</Grid>
								))
							)}
						</Grid>
						<div style={{ marginTop: 24, color: '#111' }}>
							Página {pagina} de {totalPaginas}
							<Button
								disabled={pagina === 1}
								onClick={() => setPagina(pagina - 1)}
								sx={{
									marginLeft: 1,
									color: '#fff',
									bgcolor: pagina === 1 ? '#ccc' : '#888',
									'&:hover': { bgcolor: pagina === 1 ? '#ccc' : '#666' },
									minWidth: 100,
									fontWeight: 'bold',
									borderRadius: 2,
									boxShadow: 0,
								}}
							>
								Anterior
							</Button>
							<Button
								disabled={pagina === totalPaginas}
								onClick={() => setPagina(pagina + 1)}
								sx={{
									marginLeft: 1,
									color: '#fff',
									bgcolor: pagina === totalPaginas ? '#ccc' : '#888',
									'&:hover': { bgcolor: pagina === totalPaginas ? '#ccc' : '#666' },
									minWidth: 100,
									fontWeight: 'bold',
									borderRadius: 2,
									boxShadow: 0,
								}}
							>
								Siguiente
							</Button>
						</div>
					</div>
				)}
				{/* COMISIONES: modo tabla en mobile, modo cards en desktop */}
				{asignaturaSeleccionada && (
					<div style={{ marginTop: 32, marginBottom: 32, width: '100%' }}>
						<Typography variant="h6" sx={{ mb: 4, color: '#111' }}>
							{asignaturaSeleccionada['Asignatura-Actividad']}
						</Typography>
						{/* Desktop/tablet: grid tipo fila, headers una sola vez */}
						{isWideComisiones && comisiones.filter(c => String(c['Aula'] || c['Aula/s'] || '').trim() !== '***').length > 0 ? (
							<>
								<div style={{
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'space-between',
									background: '#e0e0e0',
									color: '#333',
									fontWeight: 'bold',
									borderRadius: 6,
									padding: '8px 12px',
									fontSize: 15,
									marginBottom: 8,
									width: '100%',
									maxWidth: 1050,
									margin: '8px auto'
								}}>
									<span style={{ flexBasis: 80, minWidth: 80, maxWidth: 80 }}>Comisión</span>
									<span style={{ flexBasis: 180, minWidth: 180, maxWidth: 180, marginLeft: 12 }}>Docente/s</span>
									<span style={{ flexBasis: 180, minWidth: 180, maxWidth: 180, marginLeft: 12 }}>Día y horario</span>
									{/* <span style={{ flexBasis: 100, minWidth: 100, maxWidth: 100, marginLeft: 12 }}>Turno</span> */}
									<span style={{ flexBasis: 220, minWidth: 220, maxWidth: 400, marginLeft: 12 }}>Aula</span>
									<span style={{ flexBasis: 120, minWidth: 120, maxWidth: 120, marginLeft: 12 }}>Modalidad</span>
									<span style={{ flexBasis: 120, minWidth: 120, maxWidth: 120, marginLeft: 12 }}>Clase presencial</span>
								</div>
								{comisiones.filter(c => String(c['Aula'] || c['Aula/s'] || '').trim() !== '***').map((c, i) => (
									<Paper key={i} sx={{
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'space-between',
										bgcolor: '#fff',
										color: '#111',
										borderRadius: 2,
										p: 1.5,
										mb: 1,
										fontSize: 15,
										width: '100%',
										maxWidth: 1050,
										margin: '8px auto'
									}}>
										<span style={{ flexBasis: 80, minWidth: 80, maxWidth: 80, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c['Comisión']}</span>
										<span style={{ flexBasis: 180, minWidth: 180, maxWidth: 180, marginLeft: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c['Docente/s (1)']}</span>
										<span style={{ flexBasis: 180, minWidth: 180, maxWidth: 180, marginLeft: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c['Día/s y horario/s']}</span>
										{/* <span style={{ flexBasis: 100, minWidth: 100, maxWidth: 100, marginLeft: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c['Turno']}</span> */}
										<span style={{ flexBasis: 220, minWidth: 220, maxWidth: 400, marginLeft: 12, overflow: 'auto', textOverflow: 'initial', whiteSpace: 'normal', wordBreak: 'break-word', display: 'flex', alignItems: 'center' }}>
											{c['Aula'] || c['Aula/s']}
											{getEdificioByAula(c['Aula'] || c['Aula/s']) && (
												<IconButton
													size="small"
													sx={{ ml: 1 }}
													onClick={() => {
														setEdificioModal(getEdificioByAula(c['Aula'] || c['Aula/s']));
														setModalEdificioOpen(true);
													}}
													aria-label="Ver edificio en mapa"
												>
													<SearchIcon fontSize="small" />
												</IconButton>
											)}
										</span>
										<span style={{ flexBasis: 120, minWidth: 120, maxWidth: 120, marginLeft: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c['Modalidad'] || c['Modalidad Cursada']}</span>
										<span style={{ flexBasis: 120, minWidth: 120, maxWidth: 120, marginLeft: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c['Clase Presencial'] || c['Clase presencial']}</span>
									</Paper>
								))}
							</>
						) : (
							// Mobile: cards en columna
							<Grid container spacing={2} direction="column">
								{comisiones.filter(c => String(c['Aula'] || c['Aula/s'] || '').trim() !== '***').map((c, i) => (
									<Grid item xs={12} key={i}>
										<Paper sx={{ p: 1.5, bgcolor: '#fff', color: '#111', borderRadius: 2 }}>
											<div style={{ fontWeight: 700, fontSize: 15 }}>Comisión: {c['Comisión']}</div>
											<div style={{ fontSize: 14 }}>Docente/s: {c['Docente/s (1)']}</div>
											<div style={{ fontSize: 14 }}>Día y horario: {c['Día/s y horario/s']}</div>
											<div style={{ fontSize: 14 }}>Turno: {c['Turno']}</div>
											<div style={{ fontSize: 14 }}>Aula: {c['Aula'] || c['Aula/s']}</div>
											<div style={{ fontSize: 14 }}>Modalidad: {c['Modalidad'] || c['Modalidad Cursada']}</div>
											<div style={{ fontSize: 14 }}>Clase presencial: {c['Clase Presencial'] || c['Clase presencial']}</div>
										</Paper>
									</Grid>
								))}
							</Grid>
						)}
					</div>
				)}
				{/* FOOTER */}
				<Box sx={{ width: '100%', mt: 6, mb: 2 }}>
      <Paper sx={{ bgcolor: '#f5f5f5', color: '#111', p: 3, borderRadius: 2, textAlign: 'center', fontSize: 15, boxShadow: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>Departamento de Alumnos</div>
        <div>Universidad Nacional de Moreno</div>
        <div>Bmé. Mitre 1891 (1744) Moreno</div>
        <div>Buenos Aires, Argentina</div>
        <div>Teléfono provisorio 011 2078-9170 (líneas rotativas)</div>
		<div>alumnos@unm.edu.ar</div>
        <div><a href="https://www.unm.edu.ar" style={{ color: '#1976d2', textDecoration: 'none' }} target="_blank" rel="noopener noreferrer">www.unm.edu.ar</a></div>
      </Paper>
    </Box>
			</Container>
			<ModalEdificio open={modalEdificioOpen} onClose={() => setModalEdificioOpen(false)} edificio={edificioModal} edificiosData={edificios} />
		</Box>
	);
}

export default App;