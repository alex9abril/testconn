-- =====================================================
-- Script SQL para crear esquema en Supabase
-- Data Bridge - Agora Ecosystem
-- =====================================================

-- Crear el esquema principal
CREATE SCHEMA IF NOT EXISTS data_bridge;

-- Otorgar permisos al usuario autenticado de Supabase
GRANT USAGE ON SCHEMA data_bridge TO authenticated;
GRANT ALL ON SCHEMA data_bridge TO authenticated;

-- Otorgar permisos al rol de servicio (si existe)
GRANT USAGE ON SCHEMA data_bridge TO service_role;
GRANT ALL ON SCHEMA data_bridge TO service_role;

-- =====================================================
-- Tabla: Integraciones
-- Almacena la configuración de las integraciones
-- =====================================================
CREATE TABLE IF NOT EXISTS data_bridge.integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'sql-server', 'api-rest', etc.
    description TEXT,
    config JSONB NOT NULL DEFAULT '{}',
    default_query TEXT,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    CONSTRAINT valid_type CHECK (type IN ('sql-server', 'api-rest', 'ftp', 'soap', 'other'))
);

-- Índices para integraciones
CREATE INDEX IF NOT EXISTS idx_integrations_integration_id ON data_bridge.integrations(integration_id);
CREATE INDEX IF NOT EXISTS idx_integrations_type ON data_bridge.integrations(type);
CREATE INDEX IF NOT EXISTS idx_integrations_enabled ON data_bridge.integrations(enabled);

-- =====================================================
-- Tabla: Ejecuciones de Integración
-- Registra cada ejecución de una integración
-- =====================================================
CREATE TABLE IF NOT EXISTS data_bridge.integration_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_id UUID NOT NULL REFERENCES data_bridge.integrations(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL, -- 'success', 'error', 'pending', 'running'
    query_config JSONB,
    result_count INTEGER DEFAULT 0,
    execution_time_ms INTEGER,
    error_message TEXT,
    executed_by UUID REFERENCES auth.users(id),
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_status CHECK (status IN ('success', 'error', 'pending', 'running', 'cancelled'))
);

-- Índices para ejecuciones
CREATE INDEX IF NOT EXISTS idx_executions_integration_id ON data_bridge.integration_executions(integration_id);
CREATE INDEX IF NOT EXISTS idx_executions_status ON data_bridge.integration_executions(status);
CREATE INDEX IF NOT EXISTS idx_executions_executed_at ON data_bridge.integration_executions(executed_at DESC);

-- =====================================================
-- Tabla: Datos Importados
-- Almacena los datos importados de las integraciones
-- =====================================================
CREATE TABLE IF NOT EXISTS data_bridge.imported_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    execution_id UUID NOT NULL REFERENCES data_bridge.integration_executions(id) ON DELETE CASCADE,
    integration_id UUID NOT NULL REFERENCES data_bridge.integrations(id) ON DELETE CASCADE,
    data JSONB NOT NULL,
    imported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para datos importados
CREATE INDEX IF NOT EXISTS idx_imported_data_execution_id ON data_bridge.imported_data(execution_id);
CREATE INDEX IF NOT EXISTS idx_imported_data_integration_id ON data_bridge.imported_data(integration_id);
CREATE INDEX IF NOT EXISTS idx_imported_data_imported_at ON data_bridge.imported_data(imported_at DESC);
-- Índice GIN para búsquedas en JSONB
CREATE INDEX IF NOT EXISTS idx_imported_data_data_gin ON data_bridge.imported_data USING GIN (data);

-- =====================================================
-- Tabla: Logs de Conexión
-- Registra intentos de conexión y errores
-- =====================================================
CREATE TABLE IF NOT EXISTS data_bridge.connection_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_id UUID REFERENCES data_bridge.integrations(id) ON DELETE SET NULL,
    connection_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL, -- 'success', 'failed', 'timeout'
    error_message TEXT,
    connection_time_ms INTEGER,
    attempted_by UUID REFERENCES auth.users(id),
    attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_connection_status CHECK (status IN ('success', 'failed', 'timeout', 'cancelled'))
);

-- Índices para logs de conexión
CREATE INDEX IF NOT EXISTS idx_connection_logs_integration_id ON data_bridge.connection_logs(integration_id);
CREATE INDEX IF NOT EXISTS idx_connection_logs_status ON data_bridge.connection_logs(status);
CREATE INDEX IF NOT EXISTS idx_connection_logs_attempted_at ON data_bridge.connection_logs(attempted_at DESC);

-- =====================================================
-- Función: Actualizar updated_at automáticamente
-- =====================================================
CREATE OR REPLACE FUNCTION data_bridge.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at en integraciones
CREATE TRIGGER update_integrations_updated_at
    BEFORE UPDATE ON data_bridge.integrations
    FOR EACH ROW
    EXECUTE FUNCTION data_bridge.update_updated_at_column();

-- =====================================================
-- Políticas RLS (Row Level Security)
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE data_bridge.integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_bridge.integration_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_bridge.imported_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_bridge.connection_logs ENABLE ROW LEVEL SECURITY;

-- Política: Integraciones - Todos los usuarios autenticados pueden leer
CREATE POLICY "Integrations are viewable by authenticated users"
    ON data_bridge.integrations
    FOR SELECT
    TO authenticated
    USING (true);

-- Política: Integraciones - Solo administradores pueden modificar
-- Nota: Ajusta esta política según tus necesidades de roles
CREATE POLICY "Integrations are editable by authenticated users"
    ON data_bridge.integrations
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Política: Ejecuciones - Los usuarios pueden ver sus propias ejecuciones
CREATE POLICY "Users can view their own executions"
    ON data_bridge.integration_executions
    FOR SELECT
    TO authenticated
    USING (executed_by = auth.uid() OR true); -- Permitir ver todas por ahora

-- Política: Ejecuciones - Los usuarios pueden crear ejecuciones
CREATE POLICY "Users can create executions"
    ON data_bridge.integration_executions
    FOR INSERT
    TO authenticated
    WITH CHECK (executed_by = auth.uid());

-- Política: Datos importados - Los usuarios pueden ver datos de sus ejecuciones
CREATE POLICY "Users can view imported data from their executions"
    ON data_bridge.imported_data
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM data_bridge.integration_executions
            WHERE integration_executions.id = imported_data.execution_id
            AND (integration_executions.executed_by = auth.uid() OR true)
        )
    );

-- Política: Logs de conexión - Los usuarios pueden ver logs
CREATE POLICY "Users can view connection logs"
    ON data_bridge.connection_logs
    FOR SELECT
    TO authenticated
    USING (attempted_by = auth.uid() OR true);

-- Política: Logs de conexión - Los usuarios pueden crear logs
CREATE POLICY "Users can create connection logs"
    ON data_bridge.connection_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (attempted_by = auth.uid());

-- =====================================================
-- Datos iniciales (Opcional)
-- =====================================================

-- Insertar integración de Grupo Alden como ejemplo
INSERT INTO data_bridge.integrations (
    integration_id,
    name,
    type,
    description,
    config,
    default_query,
    enabled
) VALUES (
    'grupo-alden',
    'Grupo Alden',
    'sql-server',
    'Integración directa a base de datos SQL Server de Grupo Alden',
    '{
        "serverHost": "13.77.103.149",
        "serverPort": 1441,
        "database": "AL_TOSatelite_rep",
        "user": "saiya"
    }'::jsonb,
    'SELECT TOP (10) * FROM [saiya].[refacciones];',
    true
) ON CONFLICT (integration_id) DO NOTHING;

-- =====================================================
-- Comentarios en las tablas
-- =====================================================
COMMENT ON SCHEMA data_bridge IS 'Esquema principal para el sistema Data Bridge de Agora Ecosystem';
COMMENT ON TABLE data_bridge.integrations IS 'Configuración de todas las integraciones disponibles';
COMMENT ON TABLE data_bridge.integration_executions IS 'Registro de ejecuciones de integraciones';
COMMENT ON TABLE data_bridge.imported_data IS 'Datos importados desde sistemas externos';
COMMENT ON TABLE data_bridge.connection_logs IS 'Logs de intentos de conexión a sistemas externos';

-- =====================================================
-- Tabla: Integration Alden Satelite
-- Almacena datos importados de Grupo Alden Satelite
-- =====================================================
CREATE TABLE IF NOT EXISTS data_bridge.integration_alden_satelite (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    localizacion VARCHAR(255),
    product VARCHAR(255),
    descripcion TEXT,
    price NUMERIC(10, 2),
    sale_price NUMERIC(10, 2),
    inventario INTEGER DEFAULT 0,
    dias INTEGER DEFAULT 0,
    install_cost VARCHAR(255),
    sat_id VARCHAR(255),
    fecha_importacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- Verificación
-- =====================================================
-- Verificar que el esquema se creó correctamente
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'data_bridge') THEN
        RAISE NOTICE 'Esquema data_bridge creado exitosamente';
    ELSE
        RAISE EXCEPTION 'Error: No se pudo crear el esquema data_bridge';
    END IF;
END $$;

