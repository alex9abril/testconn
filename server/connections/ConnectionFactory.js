import { SqlServerAdapter } from '../adapters/SqlServerAdapter.js';
import { ApiRestAdapter } from '../adapters/ApiRestAdapter.js';

/**
 * Factory para crear instancias de adaptadores de conexión
 * Centraliza la lógica de creación según el tipo de conexión
 */
export class ConnectionFactory {
  /**
   * Crea un adaptador según el tipo especificado
   * @param {string} type - Tipo de conexión ('sql-server', 'api-rest', etc.)
   * @param {Object} config - Configuración específica del adaptador
   * @returns {ConnectionAdapter}
   */
  static createAdapter(type, config) {
    switch (type) {
      case 'sql-server':
        return new SqlServerAdapter(config);
      
      case 'api-rest':
        return new ApiRestAdapter(config);
      
      default:
        throw new Error(`Tipo de conexión no soportado: ${type}`);
    }
  }

  /**
   * Crea un adaptador desde una configuración de integración
   * @param {Object} integrationConfig - Configuración de integración
   * @param {Object} overrideConfig - Configuración que sobrescribe los defaults
   * @returns {ConnectionAdapter}
   */
  static createFromIntegration(integrationConfig, overrideConfig = {}) {
    const mergedConfig = {
      ...integrationConfig.defaultConfig,
      ...overrideConfig,
    };

    return this.createAdapter(integrationConfig.type, mergedConfig);
  }
}

