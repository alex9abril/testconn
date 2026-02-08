/**
 * Configuración centralizada de todas las integraciones
 * Cada integración define su tipo de conexión y parámetros específicos
 */
export const INTEGRATIONS = {
  'grupo-alden': {
    id: 'grupo-alden',
    name: 'Grupo Alden',
    type: 'sql-server',
    description: 'Integración directa a base de datos SQL Server de Grupo Alden',
    defaultConfig: {
      serverHost: '13.77.103.149',
      serverPort: 1441,
      database: 'AL_TOSatelite_rep',
      user: 'saiya',
      // password se obtiene de variables de entorno o formulario
    },
    defaultQuery: 'SELECT TOP (10) * FROM [saiya].[refacciones];',
    enabled: true,
  },
  
  // Ejemplo de integración API REST
  'ejemplo-api': {
    id: 'ejemplo-api',
    name: 'Ejemplo API REST',
    type: 'api-rest',
    description: 'Integración vía API REST',
    defaultConfig: {
      baseUrl: 'https://api.ejemplo.com',
      authType: 'bearer', // 'bearer', 'basic', 'api-key'
      credentials: {
        token: '', // Se obtiene de variables de entorno
      },
    },
    defaultQuery: {
      endpoint: '/v1/data',
      method: 'GET',
    },
    enabled: false, // Deshabilitada por defecto
  },
};

/**
 * Obtiene la configuración de una integración
 * @param {string} integrationId - ID de la integración
 * @returns {Object|null}
 */
export function getIntegrationConfig(integrationId) {
  return INTEGRATIONS[integrationId] || null;
}

/**
 * Obtiene todas las integraciones habilitadas
 * @returns {Array}
 */
export function getEnabledIntegrations() {
  return Object.values(INTEGRATIONS).filter(integration => integration.enabled);
}

/**
 * Obtiene todas las integraciones de un tipo específico
 * @param {string} type - Tipo de conexión ('sql-server', 'api-rest', etc.)
 * @returns {Array}
 */
export function getIntegrationsByType(type) {
  return Object.values(INTEGRATIONS).filter(integration => integration.type === type);
}

