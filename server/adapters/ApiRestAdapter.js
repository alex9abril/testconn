import { ConnectionAdapter } from './ConnectionAdapter.js';

/**
 * Adaptador para conexiones vía API REST
 * Reutilizable para cualquier integración que consuma endpoints HTTP
 */
export class ApiRestAdapter extends ConnectionAdapter {
  constructor(config) {
    super(config);
    this.baseUrl = null;
  }

  getType() {
    return 'api-rest';
  }

  validateConfig() {
    const errors = [];
    const { baseUrl, authType, credentials } = this.config;

    if (!baseUrl) errors.push('baseUrl es requerido');
    if (authType && !credentials) {
      errors.push('credentials es requerido cuando authType está definido');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  async connect() {
    const validation = this.validateConfig();
    if (!validation.valid) {
      throw new Error(`Configuración inválida: ${validation.errors.join(', ')}`);
    }

    this.baseUrl = this.config.baseUrl.replace(/\/$/, ''); // Remover trailing slash
    this.connection = { baseUrl: this.baseUrl, config: this.config };
    return true;
  }

  async execute(queryConfig) {
    if (!this.connection) {
      throw new Error('No hay conexión activa. Llama a connect() primero.');
    }

    const { endpoint, method = 'GET', body = null, headers = {} } = queryConfig;

    if (!endpoint) {
      throw new Error('endpoint es requerido');
    }

    try {
      const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
      const requestHeaders = this.buildHeaders(headers);
      const requestOptions = {
        method: method.toUpperCase(),
        headers: requestHeaders,
      };

      if (body && (method.toUpperCase() === 'POST' || method.toUpperCase() === 'PUT' || method.toUpperCase() === 'PATCH')) {
        requestOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
      }

      const response = await fetch(url, requestOptions);
      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          data: [],
          count: 0,
          message: `Error HTTP ${response.status}: ${response.statusText}`,
          error: data
        };
      }

      return this.formatResponse(data);
    } catch (error) {
      return {
        success: false,
        data: [],
        count: 0,
        message: `Error al ejecutar request: ${error.message}`,
        error: error.message
      };
    }
  }

  buildHeaders(customHeaders = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...customHeaders
    };

    // Agregar autenticación según el tipo
    const { authType, credentials } = this.config;
    
    if (authType === 'bearer' && credentials?.token) {
      headers['Authorization'] = `Bearer ${credentials.token}`;
    } else if (authType === 'basic' && credentials?.username && credentials?.password) {
      const basicAuth = Buffer.from(`${credentials.username}:${credentials.password}`).toString('base64');
      headers['Authorization'] = `Basic ${basicAuth}`;
    } else if (authType === 'api-key' && credentials?.apiKey) {
      headers[credentials.headerName || 'X-API-Key'] = credentials.apiKey;
    }

    return headers;
  }

  async disconnect() {
    this.connection = null;
    this.baseUrl = null;
  }

  formatResponse(data) {
    // Intentar detectar si es un array o un objeto con datos
    let formattedData = data;
    let count = 0;

    if (Array.isArray(data)) {
      formattedData = data;
      count = data.length;
    } else if (data && typeof data === 'object') {
      // Buscar arrays comunes en respuestas de API
      if (data.data && Array.isArray(data.data)) {
        formattedData = data.data;
        count = data.data.length;
      } else if (data.results && Array.isArray(data.results)) {
        formattedData = data.results;
        count = data.results.length;
      } else if (data.items && Array.isArray(data.items)) {
        formattedData = data.items;
        count = data.items.length;
      } else {
        formattedData = [data];
        count = 1;
      }
    }

    return {
      success: true,
      data: formattedData,
      count,
      message: 'Request ejecutado exitosamente',
      raw: data
    };
  }
}

