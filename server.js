import express from "express";
import path from "path";
import mssql from "mssql";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = process.env.PORT ?? 3100;

app.use(express.json());
app.use(express.static(path.resolve(process.cwd(), "public")));

const DEFAULT_CONFIG = {
  serverHost: "13.77.103.149",
  serverPort: 1441,
  database: "AL_TOSatelite_rep",
  user: "saiya",
  queryText: "SELECT TOP (10) * FROM [saiya].[refacciones];",
};

app.post("/api/test-connection", async (req, res) => {
  const {
    serverHost,
    serverPort,
    database,
    user,
    password = process.env.DB_PASSWORD,
    queryText,
  } = { ...DEFAULT_CONFIG, ...req.body };

  if (!password) {
    return res.status(400).json({
      success: false,
      message: "Se requiere una contraseña. Configúrala en el formulario o mediante DB_PASSWORD.",
    });
  }

  const config = {
    server: serverHost,
    port: Number(serverPort),
    user,
    password,
    database,
    options: {
      trustServerCertificate: true,
    },
    pool: {
      min: 0,
      max: 10,
    },
  };

  try {
    const pool = await mssql.connect(config);
    const request = pool.request();
    const query = queryText.trim();
    if (!query) {
      throw new Error("La consulta SQL no puede estar vacía.");
    }
    const result = await request.query(query);
    await pool.close();

    res.json({
      success: true,
      message: "Conexión exitosa y resultados obtenidos.",
      rows: result.recordset.length,
      rowsData: result.recordset,
    });
  } catch (error) {
    mssql.close();
    res.status(500).json({
      success: false,
      message: "Error en la conexión o en la consulta.",
      details: error.message,
    });
  }
});

app.use((req, res) => {
  res.status(404).sendFile(path.resolve(process.cwd(), "public", "index.html"));
});

app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
