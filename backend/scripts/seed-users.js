const fs = require('fs');
const path = require('path');
const rootEnv = path.resolve(__dirname, '../../.env');
if (!process.env.ADMIN_USERNAME && fs.existsSync(rootEnv)) {
    require('dotenv').config({path: rootEnv});
} else {
    require('dotenv').config();
}
const bcrypt = require('bcryptjs');
const {pool} = require('../config/database');

async function upsertAdmin() {
    const username = process.env.ADMIN_USERNAME || 'admin';
    const email = process.env.ADMIN_EMAIL || 'admin@example.com';
    const full_name = 'Administrador Academia';
    const rawPassword = process.env.ADMIN_PASSWORD || 'password';
    const password_hash = await bcrypt.hash(rawPassword, 10);

    await pool.query(
        `INSERT INTO users (username, email, password_hash, full_name)
         VALUES ($1, $2, $3, $4) ON CONFLICT (username) DO
        UPDATE
            SET email = EXCLUDED.email,
            password_hash = EXCLUDED.password_hash,
            full_name = EXCLUDED.full_name`,
        [username, email, password_hash, full_name]
    );
    return username;
}

async function updateNonAdminPasswords(adminUsername) {
    const raw = process.env.DEFAULT_USER_PASSWORD || 'password';
    const hash = await bcrypt.hash(raw, 10);
    const res = await pool.query(
        `UPDATE users
         SET password_hash = $1
         WHERE username <> $2`,
        [hash, adminUsername]
    );
    return res.rowCount;
}

(async function main() {
    try {
        await pool.query(`SELECT 1
                          FROM users LIMIT 1`);
        const adminUsername = await upsertAdmin();
        const updated = await updateNonAdminPasswords(adminUsername);
        console.log(`Seed OK. Admin: '${adminUsername}'. Usuarios no-admin actualizados: ${updated}.`);
    } catch (err) {
        console.error('Error en seed de usuarios:', err);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
})();
