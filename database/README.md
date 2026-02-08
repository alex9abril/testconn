# Scripts de Base de Datos - Supabase

## Instalación del Esquema

### Opción 1: Desde el Dashboard de Supabase

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Navega a **SQL Editor**
3. Crea una nueva consulta
4. Copia y pega el contenido de `supabase_schema.sql`
5. Ejecuta el script

### Opción 2: Desde la línea de comandos

```bash
# Instalar Supabase CLI si no lo tienes
npm install -g supabase

# Iniciar sesión
supabase login

# Vincular tu proyecto
supabase link --project-ref tu-project-ref

# Ejecutar el script
supabase db execute -f database/supabase_schema.sql
```

## Estructura del Esquema

El script crea:

### Esquema: `data_bridge`
Esquema principal para todas las tablas del sistema.

### Tablas Creadas

1. **`integrations`**
   - Almacena la configuración de todas las integraciones
   - Campos: id, integration_id, name, type, config (JSONB), etc.

2. **`integration_executions`**
   - Registra cada ejecución de una integración
   - Campos: id, integration_id, status, query_config, result_count, etc.

3. **`imported_data`**
   - Almacena los datos importados de las integraciones
   - Campo `data` es JSONB para flexibilidad

4. **`connection_logs`**
   - Registra intentos de conexión y errores
   - Útil para debugging y monitoreo

### Características

- ✅ **Row Level Security (RLS)** habilitado
- ✅ **Políticas de seguridad** configuradas
- ✅ **Índices** para optimizar consultas
- ✅ **Triggers** para actualización automática de timestamps
- ✅ **Validaciones** con CHECK constraints
- ✅ **Datos iniciales** (Grupo Alden como ejemplo)

## Verificación

Después de ejecutar el script, verifica que todo se creó correctamente:

```sql
-- Verificar que el esquema existe
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name = 'data_bridge';

-- Verificar las tablas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'data_bridge';

-- Verificar la integración de ejemplo
SELECT * FROM data_bridge.integrations;
```

## Uso desde la Aplicación

### Obtener integraciones

```javascript
const { data, error } = await supabase
  .from('integrations')
  .select('*')
  .eq('enabled', true);
```

### Registrar una ejecución

```javascript
const { data, error } = await supabase
  .from('integration_executions')
  .insert({
    integration_id: integrationUuid,
    status: 'success',
    result_count: 100,
    execution_time_ms: 1500
  });
```

### Guardar datos importados

```javascript
const { data, error } = await supabase
  .from('imported_data')
  .insert({
    execution_id: executionUuid,
    integration_id: integrationUuid,
    data: { /* tus datos aquí */ }
  });
```

## Personalización

### Modificar políticas RLS

Si necesitas ajustar los permisos, edita las políticas en el script o desde el dashboard:

```sql
-- Ejemplo: Permitir solo lectura a ciertos usuarios
DROP POLICY IF EXISTS "Integrations are viewable by authenticated users" ON data_bridge.integrations;

CREATE POLICY "Integrations are viewable by specific role"
    ON data_bridge.integrations
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );
```

### Agregar más tablas

Puedes agregar más tablas al esquema según tus necesidades:

```sql
CREATE TABLE IF NOT EXISTS data_bridge.nueva_tabla (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- tus campos aquí
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Notas Importantes

1. **Seguridad**: Las políticas RLS están configuradas de forma permisiva por defecto. Ajusta según tus necesidades de seguridad.

2. **JSONB**: Los campos `config` y `data` usan JSONB para flexibilidad. Puedes hacer consultas sobre ellos:

```sql
SELECT * FROM data_bridge.integrations
WHERE config->>'serverHost' = '13.77.103.149';
```

3. **UUIDs**: Todas las tablas usan UUIDs como claves primarias, que es la práctica recomendada en Supabase.

4. **Timestamps**: Todas las tablas tienen `created_at` y las que lo necesitan tienen `updated_at` con trigger automático.

## Troubleshooting

### Error: "permission denied for schema"
- Asegúrate de tener permisos de administrador en Supabase
- Verifica que el usuario tenga los roles correctos

### Error: "relation already exists"
- El script usa `IF NOT EXISTS`, pero si necesitas recrear:
```sql
DROP SCHEMA IF EXISTS data_bridge CASCADE;
-- Luego ejecuta el script nuevamente
```

### Error: "function does not exist"
- Asegúrate de ejecutar todo el script completo
- La función `update_updated_at_column()` debe crearse antes de los triggers

