import { Frame } from './components/Frame.js';
import { ConnectionPage } from './pages/ConnectionPage.js';

const frame = new Frame();
const connectionPage = new ConnectionPage();

frame.registerPage('home', {
  title: 'Home',
  subtitle: 'Página principal',
  render: (container) => {
    container.innerHTML = '<div class="page-content"><div class="panel"><h2>Home</h2><p>Bienvenido a Data Bridge</p></div></div>';
  },
  onMount: () => {}
});

frame.registerPage('connection', connectionPage);

frame.registerPage('dashboard', {
  title: 'Dashboard',
  subtitle: 'Vista general del sistema',
  render: (container) => {
    container.innerHTML = '<div class="page-content"><div class="panel"><h2>Dashboard</h2><p>Contenido del dashboard próximamente.</p></div></div>';
  },
  onMount: () => {}
});

frame.registerPage('settings', {
  title: 'Configuración',
  subtitle: 'Ajustes del sistema',
  render: (container) => {
    container.innerHTML = '<div class="page-content"><div class="panel"><h2>Configuración</h2><p>Contenido de configuración próximamente.</p></div></div>';
  },
  onMount: () => {}
});

// Iniciar la navegación después de registrar todas las páginas
frame.start();
