import { SqlConnectionForm } from '../components/forms/SqlConnectionForm.js';

export class ConnectionPage {
  constructor() {
    this.title = 'Grupo Alden';
    this.subtitle = 'Integración directa a base de datos SQL Server';
    this.integrationId = 'grupo-alden';
    this.integrationConfig = null;
    this.formComponent = null;
    this.currentData = null; // Almacenar los datos actuales para exportar
  }

  render(container) {
    container.innerHTML = `
      <div class="page-content">
        <form id="connection-form">
          <div id="form-content">
            <div class="panel">
              <p>Cargando configuración...</p>
            </div>
          </div>
          <button type="submit">Probar conexión</button>
        </form>

        <section id="result" class="panel response-panel">
          <h2>Respuesta</h2>
          <p>En espera de tu consulta.</p>
        </section>
      </div>
    `;

    // Cargar configuración y renderizar formulario de forma asíncrona
    this.loadAndRenderForm();
  }

  async loadAndRenderForm() {
    await this.loadIntegrationConfig();
    this.renderForm();
  }

  async loadIntegrationConfig() {
    try {
      const response = await fetch('/api/integrations');
      const integrations = await response.json();
      this.integrationConfig = integrations.find(i => i.id === this.integrationId);
    } catch (error) {
      console.error('Error al cargar configuración:', error);
      // Usar valores por defecto si falla
      this.integrationConfig = {
        defaultConfig: {
          serverHost: '13.77.103.149',
          serverPort: 1441,
          database: 'AL_TOSatelite_rep',
          user: 'saiya',
        }
      };
    }
  }

  renderForm() {
    const formContent = document.getElementById('form-content');
    if (!formContent) return;

    // Obtener valores por defecto de la configuración
    const defaultValues = {
      ...this.integrationConfig?.defaultConfig,
      queryText: this.integrationConfig?.defaultQuery || '',
    };

    // Crear y renderizar el formulario reutilizable
    this.formComponent = new SqlConnectionForm(defaultValues);
    this.formComponent.render(formContent);
  }

  onMount() {
    const form = document.querySelector("#connection-form");
    const resultSection = document.querySelector("#result");

    if (!form || !resultSection) return;

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const button = form.querySelector("button");
      button.disabled = true;
      button.textContent = "Validando...";

      resultSection.innerHTML = `
        <h2>Respuesta</h2>
        <div class="response-body">
          <p>Intentando conectar...</p>
        </div>
      `;

      // Obtener datos del formulario usando el componente reutilizable
      const formData = this.formComponent.getFormData(form);
      const { queryText, ...config } = formData;

      // Preparar payload para el nuevo sistema de integraciones
      const payload = {
        integrationId: this.integrationId,
        config: config,
        queryConfig: {
          query: queryText,
        },
      };

      try {
        const response = await fetch("/api/test-connection", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const data = await response.json();
        // Guardar los datos para poder exportarlos
        this.currentData = data.rowsData || [];
        this.renderResult(data);
      } catch (error) {
        this.renderResult({
          success: false,
          message: "No se pudo contactar al servidor.",
          details: error.message,
        });
      } finally {
        button.disabled = false;
        button.textContent = "Probar conexión";
      }
    });
  }

  renderResult({ success, message, rows, rowsData, details }) {
    const resultSection = document.querySelector("#result");
    if (!resultSection) return;

    const statusClass = success ? "success" : "error";
    const hasData = success && rowsData && rowsData.length > 0;
    
    resultSection.innerHTML = `
      <div class="result-header">
        <h2>Respuesta</h2>
        ${hasData ? `<button id="export-btn" class="export-button">Exportar SQL</button>` : ''}
      </div>
      <div class="response-body ${statusClass}">
        <p>${message}</p>
        ${success && rows !== undefined ? `<p>${rows} fila(s) disponibles.</p>` : ""}
        ${details ? `<p>${details}</p>` : ""}
        ${hasData ? this.buildTable(rowsData) : "<p>No hay filas para mostrar.</p>"}
      </div>
    `;

    // Agregar evento al botón de exportar si existe
    if (hasData) {
      const exportBtn = document.getElementById('export-btn');
      if (exportBtn) {
        exportBtn.addEventListener('click', () => this.exportToSQL());
      }
    }
  }

  escapeHtml(value) {
    if (value === null || value === undefined) return "";
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  buildTable(rows) {
    const headers = Object.keys(rows[0] ?? {});
    if (!headers.length) {
      return "<p>No hay columnas para mostrar.</p>";
    }

    const headerRow = headers.map((header) => `<th>${header}</th>`).join("");
    const bodyRows = rows
      .map(
        (row) =>
          `<tr>${headers
            .map((header) => `<td>${this.escapeHtml(row[header])}</td>`)
            .join("")}</tr>`
      )
      .join("");

    return `
      <div class="table-wrapper">
        <table>
          <thead><tr>${headerRow}</tr></thead>
          <tbody>${bodyRows}</tbody>
        </table>
      </div>
    `;
  }

  escapeSql(value) {
    if (value === null || value === undefined) return 'NULL';
    if (typeof value === 'number') return value.toString();
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    
    // Escapar comillas simples y barras invertidas
    const escaped = String(value)
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "''");
    
    return `'${escaped}'`;
  }

  mapColumnName(columnName) {
    // Mapear nombres de columnas del DMS a nombres de la tabla de destino
    const columnMap = {
      'Localizacion': 'localizacion',
      'product': 'product',
      'Descripcion': 'descripcion',
      'price': 'price',
      'sale_price': 'sale_price',
      'inventario': 'inventario',
      'dias': 'dias',
      'install_cost': 'install_cost',
      'sat_id': 'sat_id'
    };
    
    // Convertir a minúsculas y reemplazar espacios/guiones
    const normalized = columnName.toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/-/g, '_');
    
    return columnMap[columnName] || normalized;
  }

  generateInsertStatements(data) {
    if (!data || data.length === 0) {
      return '-- No hay datos para exportar\n';
    }

    const tableName = 'data_bridge.integration_alden_satelite';
    let sql = `-- Script SQL generado automáticamente\n`;
    sql += `-- Fecha: ${new Date().toISOString()}\n`;
    sql += `-- Total de registros: ${data.length}\n\n`;
    sql += `-- INSERT INTO ${tableName}\n`;
    sql += `-- (localizacion, product, descripcion, price, sale_price, inventario, dias, install_cost, sat_id)\n`;
    sql += `-- VALUES\n\n`;

    const statements = data.map((row, index) => {
      const values = [
        this.escapeSql(row.Localizacion || row.localizacion),
        this.escapeSql(row.product || row.Product),
        this.escapeSql(row.Descripcion || row.descripcion),
        this.escapeSql(row.price || row.Price),
        this.escapeSql(row.sale_price || row.sale_price || row.Sale_Price),
        this.escapeSql(row.inventario || row.Inventario || 0),
        this.escapeSql(row.dias || row.Dias || 0),
        this.escapeSql(row.install_cost || row.Install_Cost || ''),
        this.escapeSql(row.sat_id || row.sat_id || row.Sat_ID)
      ];

      const isLast = index === data.length - 1;
      return `INSERT INTO ${tableName} (localizacion, product, descripcion, price, sale_price, inventario, dias, install_cost, sat_id, fecha_importacion)\nVALUES (${values.join(', ')}, NOW())${isLast ? ';' : ';'}`;
    });

    return sql + statements.join('\n\n') + '\n';
  }

  exportToSQL() {
    if (!this.currentData || this.currentData.length === 0) {
      alert('No hay datos para exportar');
      return;
    }

    const sqlContent = this.generateInsertStatements(this.currentData);
    const blob = new Blob([sqlContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    link.href = url;
    link.download = `integration_alden_satelite_${timestamp}.sql`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  onUnmount() {
    const form = document.querySelector("#connection-form");
    if (form) {
      form.replaceWith(form.cloneNode(true));
    }
    this.currentData = null;
  }
}

