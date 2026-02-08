import { Sidebar } from './Sidebar.js';
import { TopBar } from './TopBar.js';

export class Frame {
  constructor() {
    this.sidebar = null;
    this.topBar = null;
    this.currentPage = null;
    this.pages = new Map();
    this.defaultPage = 'home';
    this.init();
  }

  init() {
    this.sidebar = new Sidebar('sidebar-container');
    this.topBar = new TopBar('topbar-container');

    this.sidebar.onPageChange((page) => {
      this.navigateToPage(page, true);
    });

    this.topBar.onNotificationClick(() => {
      console.log('Notifications clicked');
    });

    this.topBar.onSearchClick(() => {
      console.log('Search clicked');
    });

    // Escuchar cambios en la URL (botón atrás/adelante del navegador)
    window.addEventListener('popstate', (event) => {
      const page = this.getPageFromUrl();
      if (page) {
        this.navigateToPage(page, false);
      }
    });
  }

  start() {
    // Navegar a la página inicial basada en la URL
    // Este método debe llamarse después de registrar todas las páginas
    const initialPage = this.getPageFromUrl() || this.defaultPage;
    this.navigateToPage(initialPage, true);
  }

  getPageFromUrl() {
    const path = window.location.pathname;
    const page = path.replace(/^\//, '').replace(/\/$/, '') || this.defaultPage;
    return page;
  }

  updateUrl(pageName, pushState = true) {
    const url = `/${pageName}`;
    if (pushState) {
      window.history.pushState({ page: pageName }, '', url);
    } else {
      window.history.replaceState({ page: pageName }, '', url);
    }
  }

  registerPage(name, pageComponent) {
    this.pages.set(name, pageComponent);
  }

  navigateToPage(pageName, updateUrl = true) {
    const pageComponent = this.pages.get(pageName);
    if (!pageComponent) {
      console.warn(`Page "${pageName}" not found`);
      // Redirigir a la página por defecto si no existe
      if (pageName !== this.defaultPage) {
        this.navigateToPage(this.defaultPage, updateUrl);
      }
      return;
    }

    const contentContainer = document.getElementById('main-content');
    if (!contentContainer) return;

    if (this.currentPage && this.currentPage.onUnmount) {
      this.currentPage.onUnmount();
    }

    this.currentPage = pageComponent;
    contentContainer.innerHTML = '';
    
    if (pageComponent.render) {
      pageComponent.render(contentContainer);
    }

    if (pageComponent.onMount) {
      pageComponent.onMount();
    }

    if (pageComponent.title) {
      this.topBar.setTitle(pageComponent.title, pageComponent.subtitle || '');
    }

    // Actualizar la URL
    if (updateUrl) {
      this.updateUrl(pageName);
    }

    // Actualizar el estado activo en el sidebar
    this.sidebar.setActiveByPage(pageName);
  }

  getSidebar() {
    return this.sidebar;
  }

  getTopBar() {
    return this.topBar;
  }
}

