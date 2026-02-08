/**
 * Clase base abstracta para todos los adaptadores de conexión
 * Define la interfaz estándar que deben implementar todos los tipos de conexión
 */
export class ConnectionAdapter {
  constructor(config) {
    this.config = config;
    this.connection = null;
  }

  /**
   * Conecta al sistema externo
   * @returns {Promise<boolean>} true si la conexión fue exitosa
   */
  async connect() {
    throw new Error('connect() debe ser implementado por la clase hija');
  }

  /**
   * Ejecuta una consulta/request al sistema externo
   * @param {Object} queryConfig - Configuración de la consulta específica del tipo de conexión
   * @returns {Promise<Object>} Resultado de la consulta
   */
  async execute(queryConfig) {
    throw new Error('execute() debe ser implementado por la clase hija');
  }

  /**
   * Cierra la conexión
   * @returns {Promise<void>}
   */
  async disconnect() {
    throw new Error('disconnect() debe ser implementado por la clase hija');
  }

  /**
   * Valida la configuración antes de conectar
   * @returns {Object} { valid: boolean, errors: string[] }
   */
  validateConfig() {
    throw new Error('validateConfig() debe ser implementado por la clase hija');
  }

  /**
   * Obtiene el tipo de conexión
   * @returns {string}
   */
  getType() {
    throw new Error('getType() debe ser implementado por la clase hija');
  }

  /**
   * Formatea los datos de respuesta en un formato estándar
   * @param {*} rawData - Datos crudos del sistema externo
   * @returns {Object} { success: boolean, data: Array, count: number, message: string }
   */
  formatResponse(rawData) {
    return {
      success: true,
      data: rawData || [],
      count: Array.isArray(rawData) ? rawData.length : 0,
      message: 'Operación exitosa'
    };
  }
}

