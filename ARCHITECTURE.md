# Arquitectura de Integraciones - Data Bridge

## Visión General

Este proyecto implementa una arquitectura modular y reutilizable para manejar diferentes tipos de integraciones con sistemas externos (DMS, APIs, bases de datos, etc.).

## Estructura de Carpetas

```
server/
├── adapters/           # Adaptadores de conexión (reutilizables)
│   ├── ConnectionAdapter.js    # Clase base abstracta
│   ├── SqlServerAdapter.js     # Para conexiones SQL Server
│   └── ApiRestAdapter.js       # Para conexiones API REST
├── connections/        # Factory y lógica de conexión
│   └── ConnectionFactory.js    # Crea instancias de adapters
└── config/            # Configuraciones centralizadas
    └── integrations.js   # Configuración de todas las integraciones

public/
└── components/
    └── forms/         # Componentes UI reutilizables
        ├── SqlConnectionForm.js
        └── ApiConnectionForm.js
```

## Conceptos Clave

### 1. ConnectionAdapter (Clase Base)

Todas las conexiones implementan esta interfaz estándar:

```javascript
class ConnectionAdapter {
  async connect()           // Conecta al sistema externo
  async execute(queryConfig) // Ejecuta consulta/request
  async disconnect()        // Cierra la conexión
  validateConfig()          // Valida configuración
  getType()                 // Retorna tipo de conexión
  formatResponse(data)       // Formatea respuesta estándar
}
```

### 2. Tipos de Conexión Soportados

#### SQL Server (`sql-server`)
- Conexión directa a bases de datos SQL Server
- Reutilizable para: Grupo Alden, y cualquier otra integración SQL

**Ejemplo de uso:**
```javascript
const adapter = ConnectionFactory.createAdapter('sql-server', {
  serverHost: '192.168.1.100',
  serverPort: 1433,
  database: 'mi_base_datos',
  user: 'usuario',
  password: 'contraseña'
});

await adapter.connect();
const result = await adapter.execute({
  query: 'SELECT * FROM tabla WHERE id = @id',
  params: { id: 123 }
});
```

#### API REST (`api-rest`)
- Consumo de endpoints HTTP/HTTPS
- Soporta autenticación: Bearer, Basic, API Key

**Ejemplo de uso:**
```javascript
const adapter = ConnectionFactory.createAdapter('api-rest', {
  baseUrl: 'https://api.ejemplo.com',
  authType: 'bearer',
  credentials: { token: 'mi_token' }
});

await adapter.connect();
const result = await adapter.execute({
  endpoint: '/v1/data',
  method: 'GET'
});
```

### 3. Sistema de Configuración

Las integraciones se definen en `server/config/integrations.js`:

```javascript
export const INTEGRATIONS = {
  'grupo-alden': {
    id: 'grupo-alden',
    name: 'Grupo Alden',
    type: 'sql-server',
    defaultConfig: {
      serverHost: '13.77.103.149',
      serverPort: 1441,
      database: 'AL_TOSatelite_rep',
      user: 'saiya',
    },
    defaultQuery: 'SELECT TOP (10) * FROM [saiya].[refacciones];',
    enabled: true,
  },
};
```

## Cómo Agregar una Nueva Integración

### Paso 1: Definir la Integración

Agrega la configuración en `server/config/integrations.js`:

```javascript
'nueva-integracion': {
  id: 'nueva-integracion',
  name: 'Nueva Integración',
  type: 'sql-server', // o 'api-rest'
  defaultConfig: {
    // Configuración por defecto
  },
  enabled: true,
}
```

### Paso 2: Usar en el Frontend

Si es SQL Server, usa `SqlConnectionForm`:

```javascript
import { SqlConnectionForm } from './components/forms/SqlConnectionForm.js';

const form = new SqlConnectionForm({
  serverHost: '192.168.1.100',
  serverPort: 1433,
  database: 'mi_db',
  user: 'usuario'
});
form.render(container);
```

Si es API REST, usa `ApiConnectionForm`:

```javascript
import { ApiConnectionForm } from './components/forms/ApiConnectionForm.js';

const form = new ApiConnectionForm({
  baseUrl: 'https://api.ejemplo.com',
  authType: 'bearer'
});
form.render(container);
```

### Paso 3: Llamar al Backend

```javascript
const response = await fetch('/api/test-connection', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    integrationId: 'nueva-integracion',
    config: {
      // Valores del formulario
    },
    queryConfig: {
      query: 'SELECT * FROM tabla'
    }
  })
});
```

## Crear un Nuevo Tipo de Conexión

Si necesitas un tipo de conexión que no existe (ej: FTP, SOAP, etc.):

### 1. Crear el Adapter

Crea `server/adapters/NuevoTipoAdapter.js`:

```javascript
import { ConnectionAdapter } from './ConnectionAdapter.js';

export class NuevoTipoAdapter extends ConnectionAdapter {
  getType() {
    return 'nuevo-tipo';
  }

  validateConfig() {
    // Validar configuración
  }

  async connect() {
    // Lógica de conexión
  }

  async execute(queryConfig) {
    // Lógica de ejecución
  }

  async disconnect() {
    // Lógica de desconexión
  }
}
```

### 2. Registrar en el Factory

Actualiza `server/connections/ConnectionFactory.js`:

```javascript
import { NuevoTipoAdapter } from '../adapters/NuevoTipoAdapter.js';

static createAdapter(type, config) {
  switch (type) {
    // ... casos existentes
    case 'nuevo-tipo':
      return new NuevoTipoAdapter(config);
  }
}
```

## Ventajas de esta Arquitectura

1. **Reutilización**: Un adapter SQL puede usarse para múltiples integraciones SQL
2. **Estandarización**: Todas las conexiones siguen la misma interfaz
3. **Extensibilidad**: Fácil agregar nuevos tipos de conexión
4. **Mantenibilidad**: Cambios en un tipo de conexión se reflejan en todas las integraciones
5. **Testabilidad**: Cada adapter puede probarse independientemente
6. **Configuración Centralizada**: Todas las integraciones en un solo lugar

## Ejemplo Completo: Grupo Alden

```javascript
// 1. Configuración ya existe en integrations.js

// 2. En el frontend
const form = new SqlConnectionForm({
  serverHost: '13.77.103.149',
  serverPort: 1441,
  database: 'AL_TOSatelite_rep',
  user: 'saiya',
  queryText: 'SELECT TOP (10) * FROM [saiya].[refacciones];'
});

// 3. Enviar al backend
const response = await fetch('/api/test-connection', {
  method: 'POST',
  body: JSON.stringify({
    integrationId: 'grupo-alden',
    config: form.getFormData(),
    queryConfig: {
      query: formData.queryText
    }
  })
});
```

## Variables de Entorno

Las contraseñas y tokens sensibles se pueden configurar en `.env`:

```env
DB_PASSWORD=contraseña_default
GRUPO_ALDEN_PASSWORD=contraseña_específica
EJEMPLO_API_TOKEN=token_api
```

El backend buscará automáticamente variables de entorno con el formato:
`{INTEGRATION_ID}_PASSWORD` o `{INTEGRATION_ID}_TOKEN`

