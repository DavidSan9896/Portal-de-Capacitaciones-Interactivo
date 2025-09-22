// Configuracion de base de datos - postgresql
const { Pool } = require('pg');

// Configuracion de la conexion postgresql
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'training_portal',
    user: process.env.DB_USER || 'PortalDavid',
    password: process.env.DB_PASSWORD || 'Paswor$23',
    // Configuraciones adicionales para produccion
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20, // Maximo de conexiones
    idleTimeoutMillis: 30000, // Tiempo antes de cerrar conexion inactiva
    connectionTimeoutMillis: 2000, // Tiempo maximo para conectar
};

// Crear pool de conexiones
const pool = new Pool(dbConfig);

// Funcion para probar la conexion
const testConnection = async () => {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT NOW() as current_time, version() as db_version');
        console.log('Portal capacitaciones musicales');
        console.log('Conexion postgresql exitosa');
        console.log(`Hora del servidor: ${result.rows[0].current_time}`);
        console.log(`Version postgresql: ${result.rows[0].db_version.split(',')[0]}`);
        console.log(`Host: ${dbConfig.host}:${dbConfig.port}`);
        console.log(`Base de datos: ${dbConfig.database}`);
        client.release();
        return true;
    } catch (err) {
        console.error('Error de conexion postgresql:', err.message);
        console.error('Verifica que postgresql este corriendo y la configuracion sea correcta');
        return false;
    }
};

// Funcion helper para ejecutar  con manejo de errores
const query = async (text, params = []) => {
    const start = Date.now();
    try {
        const result = await pool.query(text, params);
        const duration = Date.now() - start;

        // Log en desarrollo para debugging
        if (process.env.NODE_ENV === 'development') {
            console.log(`Query ejecutada en ${duration}ms:`, text.substring(0, 50));
        }

        return result;
    } catch (err) {
        console.error('Error en query sql:', err.message);
        console.error('Query:', text);
        console.error('Parametros:', params);
        throw err;
    }
};

// Funcion para transacciones
const transaction = async (callback) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

// Funcion para cerrar todas las conexiones
const closePool = async () => {
    await pool.end();
    console.log('Pool de conexiones postgresql cerrado');
};

// Funcion para obtener estadisticas del pool
const getPoolStats = () => {
    return {
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount
    };
};

module.exports = {
    pool,
    query,
    transaction,
    testConnection,
    closePool,
    getPoolStats
};