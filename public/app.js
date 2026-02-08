const form = document.querySelector("#connection-form");
const resultSection = document.querySelector("#result");
let currentData = null; // Almacenar los datos actuales para exportar

const renderResult = ({ success, message, rows, rowsData, details }) => {
  const statusClass = success ? "success" : "error";
  const hasData = success && rowsData && rowsData.length > 0;
  
  // Guardar los datos para poder exportarlos
  currentData = rowsData || null;
  
  resultSection.innerHTML = `
    <div class="result-header">
      <h2>Respuesta</h2>
      ${hasData ? `<button id="export-btn" class="export-button">Exportar SQL</button>` : ''}
    </div>
    <div class="response-body ${statusClass}">
      <p>${message}</p>
      ${success && rows !== undefined ? `<p>${rows} fila(s) disponibles.</p>` : ""}
      ${details ? `<p>${details}</p>` : ""}
      ${hasData ? buildTable(rowsData) : "<p>No hay filas para mostrar.</p>"}
    </div>
  `;

  // Agregar evento al botón de exportar si existe
  if (hasData) {
    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', exportToSQL);
    }
  }
};

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

  const payload = Object.fromEntries(new FormData(form).entries());

  try {
    const response = await fetch("/api/test-connection", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    renderResult(data);
  } catch (error) {
    renderResult({
      success: false,
      message: "No se pudo contactar al servidor.",
      details: error.message,
    });
  } finally {
    button.disabled = false;
    button.textContent = "Probar conexión";
  }
});

const escapeHtml = (value) => {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
};

const buildTable = (rows) => {
  const headers = Object.keys(rows[0] ?? {});
  if (!headers.length) {
    return "<p>No hay columnas para mostrar.</p>";
  }

  const headerRow = headers.map((header) => `<th>${header}</th>`).join("");
  const bodyRows = rows
    .map(
      (row) =>
        `<tr>${headers
          .map((header) => `<td>${escapeHtml(row[header])}</td>`)
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
};

// Función para escapar valores SQL
const escapeSql = (value) => {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  
  // Escapar comillas simples y barras invertidas
  const escaped = String(value)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "''");
  
  return `'${escaped}'`;
};

// Función para mapear nombres de columnas del DMS a la tabla de destino
const mapColumnName = (columnName) => {
  const columnMap = {
    'Localizacion': 'localizacion',
    'localizacion': 'localizacion',
    'product': 'product',
    'Product': 'product',
    'Descripcion': 'descripcion',
    'descripcion': 'descripcion',
    'price': 'price',
    'Price': 'price',
    'sale_price': 'sale_price',
    'Sale_Price': 'sale_price',
    'Sale Price': 'sale_price',
    'inventario': 'inventario',
    'Inventario': 'inventario',
    'dias': 'dias',
    'Dias': 'dias',
    'install_cost': 'install_cost',
    'Install_Cost': 'install_cost',
    'Install Cost': 'install_cost',
    'sat_id': 'sat_id',
    'Sat_ID': 'sat_id',
    'Sat ID': 'sat_id'
  };
  
  // Buscar en el mapa primero
  if (columnMap[columnName]) {
    return columnMap[columnName];
  }
  
  // Si no está en el mapa, normalizar el nombre
  return columnName.toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/-/g, '_');
};

// Función para obtener el valor de una columna (maneja diferentes formatos)
const getColumnValue = (row, columnName) => {
  // Intentar diferentes variaciones del nombre
  const variations = [
    columnName,
    columnName.toLowerCase(),
    columnName.toUpperCase(),
    columnName.charAt(0).toUpperCase() + columnName.slice(1).toLowerCase()
  ];
  
  for (const variation of variations) {
    if (row.hasOwnProperty(variation)) {
      return row[variation];
    }
  }
  
  return null;
};

// Función para generar los INSERT INTO statements
const generateInsertStatements = (data) => {
  if (!data || data.length === 0) {
    return '-- No hay datos para exportar\n';
  }

  const tableName = 'data_bridge.integration_alden_satelite';
  let sql = `-- Script SQL generado automáticamente\n`;
  sql += `-- Fecha: ${new Date().toISOString()}\n`;
  sql += `-- Total de registros: ${data.length}\n\n`;
  sql += `-- INSERT INTO ${tableName}\n`;
  sql += `-- (localizacion, product, descripcion, price, sale_price, inventario, dias, install_cost, sat_id, fecha_importacion)\n`;
  sql += `-- VALUES\n\n`;

  const statements = data.map((row) => {
    const values = [
      escapeSql(getColumnValue(row, 'Localizacion')),
      escapeSql(getColumnValue(row, 'product')),
      escapeSql(getColumnValue(row, 'Descripcion')),
      escapeSql(getColumnValue(row, 'price')),
      escapeSql(getColumnValue(row, 'sale_price')),
      escapeSql(getColumnValue(row, 'inventario') || 0),
      escapeSql(getColumnValue(row, 'dias') || 0),
      escapeSql(getColumnValue(row, 'install_cost') || ''),
      escapeSql(getColumnValue(row, 'sat_id'))
    ];

    return `INSERT INTO ${tableName} (localizacion, product, descripcion, price, sale_price, inventario, dias, install_cost, sat_id, fecha_importacion)\nVALUES (${values.join(', ')}, NOW());`;
  });

  return sql + statements.join('\n\n') + '\n';
};

// Función para exportar a SQL
const exportToSQL = () => {
  if (!currentData || currentData.length === 0) {
    alert('No hay datos para exportar');
    return;
  }

  const sqlContent = generateInsertStatements(currentData);
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
};
