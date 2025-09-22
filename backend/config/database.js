// Configuracion de la base de datos para PostgreSQL
require('dotenv').config();
const {Pool} = require('pg');

const useSSL = process.env.NODE_ENV === 'production' ? {rejectUnauthorized: false} : false;

// Soporta DATABASE_URL o las variables DB_* que inyecta docker-compose
const connectionString = process.env.DATABASE_URL;
const dbConfig = connectionString ? {connectionString, ssl: useSSL} : {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME || 'training_portal',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    ssl: useSSL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
};

const pool = new Pool(dbConfig);

const testConnection = async () => {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT NOW() as current_time, version() as db_version');
        if (process.env.NODE_ENV !== 'test') {
            console.log('Conexión PostgreSQL OK');
            console.log(`Hora: ${result.rows[0].current_time}`);
            console.log(`Versión: ${result.rows[0].db_version.split(',')[0]}`);
            console.log(`Host: ${dbConfig.host || 'via connectionString'}:${dbConfig.port || ''}`);
            console.log(`DB: ${dbConfig.database || '(en connectionString)'}`);
        }
        client.release();
        return true;
    } catch (err) {
        console.error('Error de conexión PostgreSQL:', err.message);
        return false;
    }
};

const query = async (text, params = []) => {
    const start = Date.now();
    try {
        const result = await pool.query(text, params);
        const duration = Date.now() - start;
        if (process.env.NODE_ENV === 'development') {
            console.log(`Query (${duration}ms):`, text.substring(0, 80));
        }
        return result;
    } catch (err) {
        console.error('Error en query SQL:', err.message);
        console.error('Query:', text);
        console.error('Parámetros:', params);
        throw err;
    }
};

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

const closePool = async () => {
    await pool.end();
    console.log('Pool PostgreSQL cerrado');
};

const getPoolStats = () => ({
    totalCount: pool.totalCount, idleCount: pool.idleCount, waitingCount: pool.waitingCount,
});

module.exports = {
    pool, query, transaction, testConnection, closePool, getPoolStats,
};