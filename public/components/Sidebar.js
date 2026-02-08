export class Sidebar {
  constructor(containerId) {
    this.containerId = containerId;
    this.isExpanded = true;
    this.init();
  }

  init() {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    // Ajustar el ancho del contenedor según el estado
    container.style.width = this.isExpanded 
      ? 'var(--sidebar-width-expanded)' 
      : 'var(--sidebar-width-collapsed)';

    container.innerHTML = `
      <div class="sidebar ${this.isExpanded ? 'expanded' : 'collapsed'}">
        <div class="sidebar-header">
          <div class="sidebar-logo">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
              <!-- Sombra sutil -->
              <ellipse cx="12" cy="21" rx="9" ry="1.5" fill="currentColor" opacity="0.15"/>
              <!-- Deck horizontal plano -->
              <rect x="2" y="11" width="20" height="2.5" fill="currentColor"/>
              <!-- Arco izquierdo -->
              <path d="M 4 11 Q 6 5 8 11 Z" fill="currentColor"/>
              <!-- Arco derecho -->
              <path d="M 16 11 Q 18 5 20 11 Z" fill="currentColor"/>
              <!-- Poste izquierdo exterior -->
              <rect x="2" y="9" width="1.5" height="4" fill="currentColor"/>
              <!-- Poste izquierdo interior -->
              <rect x="6.5" y="9" width="1.5" height="4" fill="currentColor"/>
              <!-- Poste derecho exterior -->
              <rect x="20.5" y="9" width="1.5" height="4" fill="currentColor"/>
              <!-- Poste derecho interior -->
              <rect x="16" y="9" width="1.5" height="4" fill="currentColor"/>
            </svg>
            ${this.isExpanded ? '<div class="logo-text-container"><span class="logo-text">DATA BRIDGE</span><span class="logo-subtext">by Agora Ecosystem</span></div>' : ''}
          </div>
          <button class="sidebar-toggle" aria-label="Toggle sidebar">
            ${this.isExpanded 
              ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                   <path d="M18 6L6 18M6 6l12 12"/>
                 </svg>`
              : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                   <line x1="3" y1="6" x2="21" y2="6"/>
                   <line x1="3" y1="12" x2="21" y2="12"/>
                   <line x1="3" y1="18" x2="21" y2="18"/>
                 </svg>`
            }
          </button>
        </div>
        <nav class="sidebar-nav">
          <!-- Grupo: General -->
          <div class="nav-group">
            ${this.isExpanded ? '<div class="nav-group-title">General</div>' : ''}
            <ul class="nav-list">
              <li class="nav-item active">
                <a href="#" data-page="home" class="nav-link">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                    <polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                  ${this.isExpanded ? '<span>Home</span>' : ''}
                </a>
              </li>
              <li class="nav-item">
                <a href="#" data-page="dashboard" class="nav-link">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="7" height="7"/>
                    <rect x="14" y="3" width="7" height="7"/>
                    <rect x="14" y="14" width="7" height="7"/>
                    <rect x="3" y="14" width="7" height="7"/>
                  </svg>
                  ${this.isExpanded ? '<span>Dashboard</span>' : ''}
                </a>
              </li>
            </ul>
          </div>

          <!-- Grupo: Integraciones -->
          <div class="nav-group">
            ${this.isExpanded ? '<div class="nav-group-title">Integraciones</div>' : ''}
            <ul class="nav-list">
              <li class="nav-item">
                <a href="#" data-page="connection" class="nav-link">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                    <line x1="12" y1="22.08" x2="12" y2="12"/>
                  </svg>
                  ${this.isExpanded ? '<span>Grupo Alden</span>' : ''}
                </a>
              </li>
            </ul>
          </div>

          <!-- Grupo: Configuración -->
          <div class="nav-group">
            ${this.isExpanded ? '<div class="nav-group-title">Sistema</div>' : ''}
            <ul class="nav-list">
              <li class="nav-item">
                <a href="#" data-page="settings" class="nav-link">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"/>
                  </svg>
                  ${this.isExpanded ? '<span>Configuración</span>' : ''}
                </a>
              </li>
            </ul>
          </div>
        </nav>
      </div>
    `;

    this.attachEvents();
  }

  attachEvents() {
    const toggleBtn = document.querySelector(`#${this.containerId} .sidebar-toggle`);
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => this.toggle());
    }

    const navLinks = document.querySelectorAll(`#${this.containerId} .nav-link`);
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = link.getAttribute('data-page');
        this.setActiveItem(link);
        this.onPageChange?.(page);
      });
    });
  }

  toggle() {
    this.isExpanded = !this.isExpanded;
    const sidebar = document.querySelector(`#${this.containerId} .sidebar`);
    const container = document.getElementById(this.containerId);
    if (sidebar && container) {
      sidebar.classList.toggle('expanded', this.isExpanded);
      sidebar.classList.toggle('collapsed', !this.isExpanded);
      // Ajustar el ancho del contenedor
      container.style.width = this.isExpanded 
        ? 'var(--sidebar-width-expanded)' 
        : 'var(--sidebar-width-collapsed)';
      this.init();
    }
  }

  setActiveItem(activeLink) {
    const navItems = document.querySelectorAll(`#${this.containerId} .nav-item`);
    navItems.forEach(item => item.classList.remove('active'));
    activeLink.closest('.nav-item')?.classList.add('active');
  }

  setActiveByPage(pageName) {
    const navItems = document.querySelectorAll(`#${this.containerId} .nav-item`);
    navItems.forEach(item => item.classList.remove('active'));
    
    const activeLink = document.querySelector(`#${this.containerId} .nav-link[data-page="${pageName}"]`);
    if (activeLink) {
      activeLink.closest('.nav-item')?.classList.add('active');
    }
  }

  onPageChange(callback) {
    this.onPageChange = callback;
  }
}

