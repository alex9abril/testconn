const form = document.querySelector("#connection-form");
const resultSection = document.querySelector("#result");

const renderResult = ({ success, message, rows, rowsData, details }) => {
  const statusClass = success ? "success" : "error";
  resultSection.innerHTML = `
    <h2>Respuesta</h2>
    <div class="response-body ${statusClass}">
      <p>${message}</p>
      ${success && rows !== undefined ? `<p>${rows} fila(s) disponibles.</p>` : ""}
      ${details ? `<p>${details}</p>` : ""}
      ${rowsData && rowsData.length ? buildTable(rowsData) : "<p>No hay filas para mostrar.</p>"}
    </div>
  `;
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
