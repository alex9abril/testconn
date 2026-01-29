const form = document.querySelector("#connection-form");
const resultSection = document.querySelector("#result");

const renderResult = ({ success, message, rows, sample, details }) => {
  const statusClass = success ? "success" : "error";
  resultSection.innerHTML = `
    <p class="${statusClass}">${message}</p>
    ${success && rows !== undefined ? `<p>${rows} fila(s) disponibles.</p>` : ""}
    ${sample && sample.length
      ? `<pre class="data-sample">${JSON.stringify(sample, null, 2)}</pre>`
      : ""}
    ${details ? `<p class="error">${details}</p>` : ""}
  `;
};

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = form.querySelector("button");
  button.disabled = true;
  button.textContent = "Validando...";

  resultSection.innerHTML = `<p>Intentando conectar...</p>`;

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
