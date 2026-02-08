import express from "express";
import path from "path";
import dotenv from "dotenv";
import { ConnectionFactory } from "./server/connections/ConnectionFactory.js";
import { getIntegrationConfig } from "./server/config/integrations.js";

dotenv.config();

const app = express();
const port = process.env.PORT ?? 3100;

app.use(express.json());
app.use(express.static(path.resolve(process.cwd(), "public")));

/**
 * Endpoint genérico para probar conexiones
 * Soporta diferentes tipos de conexión mediante el sistema de adapters
 */
app.post("/api/test-connection", async (req, res) => {
  const { integrationId, connectionType, config, queryConfig } = req.body;
  let adapter = null;

  try {
    // Si se proporciona un integrationId, usar su configuración
    if (integrationId) {
      const integration = getIntegrationConfig(integrationId);
      if (!integration) {
        return res.status(400).json({
          success: false,
          message: `Integración "${integrationId}" no encontrada`,
        });
      }

      // Obtener password de variables de entorno si existe
      const envPassword = process.env[`${integrationId.toUpperCase().replace('-', '_')}_PASSWORD`] 
        || process.env.DB_PASSWORD;
      
      const mergedConfig = {
        ...integration.defaultConfig,
        ...config,
        password: config?.password || envPassword,
      };

      adapter = ConnectionFactory.createFromIntegration(integration, mergedConfig);
      queryConfig.query = queryConfig.query || integration.defaultQuery;
    } 
    // Si se proporciona connectionType directamente
    else if (connectionType && config) {
      adapter = ConnectionFactory.createAdapter(connectionType, config);
    } 
    else {
      return res.status(400).json({
        success: false,
        message: "Se requiere 'integrationId' o 'connectionType' con 'config'",
      });
    }

    // Conectar
    await adapter.connect();

    // Ejecutar consulta
    const result = await adapter.execute(queryConfig);

    // Cerrar conexión
    await adapter.disconnect();

    // Formatear respuesta
    res.json({
      success: result.success,
      message: result.message,
      rows: result.count,
      rowsData: result.data,
      details: result.error || undefined,
    });
  } catch (error) {
    // Asegurar que la conexión se cierre en caso de error
    if (adapter) {
      try {
        await adapter.disconnect();
      } catch (e) {
        console.error("Error al cerrar conexión:", e);
      }
    }

    res.status(500).json({
      success: false,
      message: "Error en la conexión o en la consulta.",
      details: error.message,
    });
  }
});

/**
 * Endpoint para obtener la lista de integraciones disponibles
 */
app.get("/api/integrations", async (req, res) => {
  const { getEnabledIntegrations } = await import("./server/config/integrations.js");
  const integrations = getEnabledIntegrations();
  
  // No exponer información sensible
  const safeIntegrations = integrations.map(integration => ({
    id: integration.id,
    name: integration.name,
    type: integration.type,
    description: integration.description,
    defaultConfig: Object.keys(integration.defaultConfig).reduce((acc, key) => {
      // Ocultar valores sensibles
      if (key.toLowerCase().includes('password') || key.toLowerCase().includes('token') || key.toLowerCase().includes('key')) {
        acc[key] = '***';
      } else {
        acc[key] = integration.defaultConfig[key];
      }
      return acc;
    }, {}),
  }));

  res.json(safeIntegrations);
});

// Para SPA: todas las rutas que no sean API deben servir index.html
app.get("*", (req, res) => {
  // Solo servir index.html si no es una ruta de API
  if (!req.path.startsWith("/api")) {
    res.sendFile(path.resolve(process.cwd(), "public", "index.html"));
  } else {
    res.status(404).json({ error: "API endpoint not found" });
  }
});

app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
