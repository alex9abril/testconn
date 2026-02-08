/**
 * Componente reutilizable para formularios de conexión API REST
 * Puede ser usado para cualquier integración que consuma endpoints
 */
export class ApiConnectionForm {
  constructor(defaultValues = {}) {
    this.defaultValues = defaultValues;
  }

  render(container) {
    container.innerHTML = `
      <div class="form-grid">
        <section class="panel">
          <h2>Endpoint</h2>
          <label>
            URL Base
            <input 
              name="baseUrl" 
              value="${this.defaultValues.baseUrl || ''}" 
              placeholder="https://api.ejemplo.com"
            />
          </label>

          <label>
            Endpoint
            <input 
              name="endpoint" 
              value="${this.defaultValues.endpoint || '/v1/data'}" 
              placeholder="/v1/data"
            />
          </label>

          <label>
            Método HTTP
            <select name="method">
              <option value="GET" ${this.defaultValues.method === 'GET' ? 'selected' : ''}>GET</option>
              <option value="POST" ${this.defaultValues.method === 'POST' ? 'selected' : ''}>POST</option>
              <option value="PUT" ${this.defaultValues.method === 'PUT' ? 'selected' : ''}>PUT</option>
              <option value="PATCH" ${this.defaultValues.method === 'PATCH' ? 'selected' : ''}>PATCH</option>
            </select>
          </label>

          <label>
            Body (JSON) - Solo para POST/PUT/PATCH
            <textarea
              name="body"
              rows="4"
              placeholder='{"key": "value"}'
            >${this.defaultValues.body || ''}</textarea>
          </label>
        </section>

        <section class="panel">
          <h2>Autenticación</h2>
          <label>
            Tipo de autenticación
            <select name="authType" id="authType">
              <option value="none" ${this.defaultValues.authType === 'none' ? 'selected' : ''}>Ninguna</option>
              <option value="bearer" ${this.defaultValues.authType === 'bearer' ? 'selected' : ''}>Bearer Token</option>
              <option value="basic" ${this.defaultValues.authType === 'basic' ? 'selected' : ''}>Basic Auth</option>
              <option value="api-key" ${this.defaultValues.authType === 'api-key' ? 'selected' : ''}>API Key</option>
            </select>
          </label>

          <div id="authFields"></div>
        </section>
      </div>
    `;

    // Renderizar campos de autenticación según el tipo
    this.renderAuthFields();
    
    // Escuchar cambios en el tipo de autenticación
    const authTypeSelect = container.querySelector('#authType');
    if (authTypeSelect) {
      authTypeSelect.addEventListener('change', () => {
        this.renderAuthFields(container);
      });
    }
  }

  renderAuthFields(container) {
    const authFields = container ? container.querySelector('#authFields') : document.querySelector('#authFields');
    if (!authFields) return;

    const authType = container 
      ? container.querySelector('#authType')?.value 
      : document.querySelector('#authType')?.value || 'none';

    let html = '';

    if (authType === 'bearer') {
      html = `
        <label>
          Token
          <input 
            name="token" 
            type="password"
            value="${this.defaultValues.token || ''}" 
            placeholder="tu_token_aqui"
          />
        </label>
      `;
    } else if (authType === 'basic') {
      html = `
        <label>
          Usuario
          <input 
            name="username" 
            value="${this.defaultValues.username || ''}" 
            placeholder="usuario"
          />
        </label>
        <label>
          Contraseña
          <input 
            name="password" 
            type="password"
            value="${this.defaultValues.password || ''}" 
            placeholder="contraseña"
          />
        </label>
      `;
    } else if (authType === 'api-key') {
      html = `
        <label>
          API Key
          <input 
            name="apiKey" 
            type="password"
            value="${this.defaultValues.apiKey || ''}" 
            placeholder="tu_api_key"
          />
        </label>
        <label>
          Nombre del header (opcional)
          <input 
            name="headerName" 
            value="${this.defaultValues.headerName || 'X-API-Key'}" 
            placeholder="X-API-Key"
          />
        </label>
      `;
    }

    authFields.innerHTML = html;
  }

  getFormData(formElement) {
    const formData = Object.fromEntries(new FormData(formElement).entries());
    
    // Construir objeto de credenciales según el tipo de auth
    const authType = formData.authType;
    if (authType && authType !== 'none') {
      formData.credentials = {};
      
      if (authType === 'bearer') {
        formData.credentials.token = formData.token;
        delete formData.token;
      } else if (authType === 'basic') {
        formData.credentials.username = formData.username;
        formData.credentials.password = formData.password;
        delete formData.username;
        delete formData.password;
      } else if (authType === 'api-key') {
        formData.credentials.apiKey = formData.apiKey;
        formData.credentials.headerName = formData.headerName || 'X-API-Key';
        delete formData.apiKey;
        delete formData.headerName;
      }
    }

    // Parsear body si existe
    if (formData.body) {
      try {
        formData.body = JSON.parse(formData.body);
      } catch (e) {
        // Si no es JSON válido, dejarlo como string
      }
    }

    return formData;
  }
}

