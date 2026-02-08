/**
 * Componente reutilizable para formularios de conexión SQL Server
 * Puede ser usado para cualquier integración que use SQL Server
 */
export class SqlConnectionForm {
  constructor(defaultValues = {}) {
    this.defaultValues = defaultValues;
  }

  render(container) {
    container.innerHTML = `
      <div class="form-grid">
        <section class="panel">
          <h2>Consulta</h2>
          <label>
            Línea de comandos SQL
            <textarea
              name="queryText"
              rows="6"
              placeholder="SELECT * FROM tabla;"
            >${this.defaultValues.queryText || ''}</textarea>
          </label>
        </section>

        <section class="panel">
          <h2>Conexión</h2>
          <label>
            IP / Servidor
            <input 
              name="serverHost" 
              value="${this.defaultValues.serverHost || ''}" 
              placeholder="ej: 192.168.1.100"
            />
          </label>

          <label>
            Puerto
            <input 
              name="serverPort" 
              type="number"
              value="${this.defaultValues.serverPort || '1433'}" 
              placeholder="1433"
            />
          </label>

          <label>
            Usuario
            <input 
              name="user" 
              value="${this.defaultValues.user || ''}" 
              placeholder="usuario"
            />
          </label>

          <label>
            Base de datos
            <input 
              name="database" 
              value="${this.defaultValues.database || ''}" 
              placeholder="nombre_base_datos"
            />
          </label>

          <label>
            Contraseña
            <input 
              name="password" 
              type="password" 
              placeholder="Tu contraseña"
            />
          </label>
        </section>
      </div>
    `;
  }

  getFormData(formElement) {
    return Object.fromEntries(new FormData(formElement).entries());
  }
}

