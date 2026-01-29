const form = document.querySelector("#connection-form");
const resultSection = document.querySelector("#result");

const renderResult = ({ success, message, rows, sample, details }) => {
  const statusClass = success ? "success" : "error";
  resultSection.innerHTML = `
    <h2>Respuesta</h2>
    <div class="response-body ${statusClass}">
      <p>${message}</p>
      ${success && rows !== undefined ? `<p>${rows} fila(s) disponibles.</p>` : ""}
      ${details ? `<p>${details}</p>` : ""}
      ${
        sample && sample.length
          ? `<pre class="data-sample">${JSON.stringify(sample, null, 2)}</pre>`
          : ""
      }
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
