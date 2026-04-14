const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// 打包模式下使用 DB_PATH 环境变量（由 electron/main.js 设置）
// 开发模式下使用项目根目录
const dbPath = process.env.DB_PATH || path.resolve(__dirname, '../database.sqlite');
const db = new sqlite3.Database(dbPath);

const initDb = () => {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // 1. Categories table (Department Summary)
            db.run(`CREATE TABLE IF NOT EXISTS categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL
            )`);

            // 2. Squads table (Sub-units)
            db.run(`CREATE TABLE IF NOT EXISTS squads (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL
            )`);

            // 3. Squad Records (Details for Urban/Illegal construction)
            db.run(`CREATE TABLE IF NOT EXISTS squad_records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                squad_id INTEGER,
                category_id INTEGER,
                year INTEGER,
                month INTEGER,
                workload INTEGER DEFAULT 0,
                FOREIGN KEY (squad_id) REFERENCES squads(id),
                FOREIGN KEY (category_id) REFERENCES categories(id),
                UNIQUE(squad_id, category_id, year, month)
            )`);

            // 4. General Records (Summary and other departments)
            db.run(`CREATE TABLE IF NOT EXISTS records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                category_id INTEGER,
                year INTEGER,
                month INTEGER,
                workload INTEGER DEFAULT 0,
                FOREIGN KEY (category_id) REFERENCES categories(id),
                UNIQUE(category_id, year, month)
            )`);

            // 5. Seed Initial Data
            const squads = ['向阳大队', '兴安大队', '全宁大队', '振兴大队', '松州大队', '玉龙大队', '铁东大队', '松城大队'];
            const stmtSquad = db.prepare("INSERT OR IGNORE INTO squads (name) VALUES (?)");
            squads.forEach(s => stmtSquad.run(s));
            stmtSquad.finalize();

            const initialDataPath = path.resolve(__dirname, '../initial_data.json');
            if (fs.existsSync(initialDataPath)) {
                console.log('Found initial_data.json, importing...');
                const data = JSON.parse(fs.readFileSync(initialDataPath, 'utf8'));
                
                // Seed categories
                const stmtCat = db.prepare("INSERT OR IGNORE INTO categories (name) VALUES (?)");
                data.categories.forEach(cat => stmtCat.run(cat));
                stmtCat.finalize();

                db.all("SELECT id, name FROM categories", (err, rows) => {
                    if (err) return reject(err);
                    const catMap = {};
                    rows.forEach(row => catMap[row.name] = row.id);

                    const stmtRec = db.prepare("INSERT OR REPLACE INTO records (category_id, year, month, workload) VALUES (?, ?, ?, ?)");
                    data.records.forEach(rec => {
                        const catId = catMap[rec.category];
                        if (catId) stmtRec.run(catId, rec.year, rec.month, rec.workload);
                    });
                    stmtRec.finalize(() => {
                        console.log('Database initialized.');
                        resolve();
                    });
                });
            } else {
                resolve();
            }
        });
    });
};

module.exports = { db, initDb };
