export class TopBar {
  constructor(containerId) {
    this.containerId = containerId;
    this.init();
  }

  init() {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    container.innerHTML = `
      <div class="topbar">
        <div class="topbar-left">
          <div class="topbar-title">
            <h1>Agora Data Bridge</h1>
            <p class="topbar-subtitle">Sistema de integración DMS</p>
          </div>
        </div>
        <div class="topbar-right">
          <div class="topbar-actions">
            <button class="topbar-btn" title="Notificaciones">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              <span class="badge">3</span>
            </button>
            <button class="topbar-btn" title="Búsqueda">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
            </button>
            <div class="topbar-user">
              <div class="user-avatar">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <div class="user-info">
                <span class="user-name">Usuario</span>
                <span class="user-role">Administrador</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.attachEvents();
  }

  attachEvents() {
    const notificationBtn = document.querySelector(`#${this.containerId} .topbar-btn`);
    if (notificationBtn) {
      notificationBtn.addEventListener('click', () => {
        this.onNotificationClick?.();
      });
    }

    const searchBtn = document.querySelectorAll(`#${this.containerId} .topbar-btn`)[1];
    if (searchBtn) {
      searchBtn.addEventListener('click', () => {
        this.onSearchClick?.();
      });
    }
  }

  onNotificationClick(callback) {
    this.onNotificationClick = callback;
  }

  onSearchClick(callback) {
    this.onSearchClick = callback;
  }

  setTitle(title, subtitle = '') {
    const titleEl = document.querySelector(`#${this.containerId} .topbar-title h1`);
    const subtitleEl = document.querySelector(`#${this.containerId} .topbar-subtitle`);
    if (titleEl) titleEl.textContent = title;
    if (subtitleEl) subtitleEl.textContent = subtitle;
  }
}

