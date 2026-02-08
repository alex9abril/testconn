import mssql from 'mssql';
import { ConnectionAdapter } from './ConnectionAdapter.js';

/**
 * Adaptador para conexiones directas a SQL Server
 * Reutilizable para cualquier integración que use SQL Server (Grupo Alden, etc.)
 */
export class SqlServerAdapter extends ConnectionAdapter {
  constructor(config) {
    super(config);
    this.pool = null;
  }

  getType() {
    return 'sql-server';
  }

  validateConfig() {
    const errors = [];
    const { serverHost, serverPort, database, user, password } = this.config;

    if (!serverHost) errors.push('serverHost es requerido');
    if (!serverPort) errors.push('serverPort es requerido');
    if (!database) errors.push('database es requerido');
    if (!user) errors.push('user es requerido');
    if (!password) errors.push('password es requerido');

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

    const { serverHost, serverPort, database, user, password } = this.config;

    const sqlConfig = {
      server: serverHost,
      port: Number(serverPort),
      user,
      password,
      database,
      options: {
        trustServerCertificate: true,
        encrypt: false,
      },
      pool: {
        min: 0,
        max: 10,
        idleTimeoutMillis: 30000,
      },
    };

    try {
      this.pool = await mssql.connect(sqlConfig);
      this.connection = this.pool;
      return true;
    } catch (error) {
      throw new Error(`Error al conectar a SQL Server: ${error.message}`);
    }
  }

  async execute(queryConfig) {
    if (!this.pool) {
      throw new Error('No hay conexión activa. Llama a connect() primero.');
    }

    const { query, params = {} } = queryConfig;

    if (!query || !query.trim()) {
      throw new Error('La consulta SQL no puede estar vacía');
    }

    try {
      const request = this.pool.request();

      // Agregar parámetros si existen
      Object.entries(params).forEach(([key, value]) => {
        request.input(key, value);
      });

      const result = await request.query(query.trim());
      
      return this.formatResponse(result.recordset);
    } catch (error) {
      return {
        success: false,
        data: [],
        count: 0,
        message: `Error al ejecutar consulta: ${error.message}`,
        error: error.message
      };
    }
  }

  async disconnect() {
    if (this.pool) {
      try {
        await this.pool.close();
        this.pool = null;
        this.connection = null;
      } catch (error) {
        console.error('Error al cerrar conexión:', error);
      }
    }
  }

  formatResponse(recordset) {
    return {
      success: true,
      data: recordset || [],
      count: Array.isArray(recordset) ? recordset.length : 0,
      message: 'Consulta ejecutada exitosamente',
      raw: recordset
    };
  }
}

