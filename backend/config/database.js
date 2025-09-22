// Configuracion de la base de datos para PostgreSQL

const { Pool } = require('pg');

// Parametros de conexion a la base de datos
const dbConfig = {
    host: process.env.DB_HOST || 'localhost', // Host de la base de datos
    port: process.env.DB_PORT || 5432, // Puerto de la base de datos
    database: process.env.DB_NAME || 'training_portal', // Nombre de la base de datos
    user: process.env.DB_USER || 'PortalDavid', // Usuario de la base de datos
    password: process.env.DB_PASSWORD || 'Paswor$23', // Contrasena de la base de datos
    // Configuracion SSL solo en produccion
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20, // Numero maximo de conexiones en el pool
    idleTimeoutMillis: 30000, // Tiempo antes de cerrar una conexion inactiva
    connectionTimeoutMillis: 2000, // Tiempo maximo para conectar
};

// Crear el pool de conexiones
const pool = new Pool(dbConfig);

// Funcion para probar la conexion a la base de datos
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

// Funcion para ejecutar consultas SQL con manejo de errores
const query = async (text, params = []) => {
    const start = Date.now();
    try {
        const result = await pool.query(text, params);
        const duration = Date.now() - start;

        // Mostrar log solo en desarrollo
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

// Funcion para ejecutar transacciones
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

// Funcion para cerrar el pool de conexiones
const closePool = async () => {
    await pool.end();
    console.log('Pool de conexiones postgresql cerrado');
};

// Funcion para obtener estadisticas del pool
const getPoolStats = () => {
    return {
        totalCount: pool.totalCount, // Total de conexiones
        idleCount: pool.idleCount, // Conexiones inactivas
        waitingCount: pool.waitingCount // Conexiones en espera
    };
};

// Exportar las funciones y el pool
module.exports = {
    pool,
    query,
    transaction,
    testConnection,
    closePool,
    getPoolStats
};