DROP TABLE IF EXISTS squad_records;
DROP TABLE IF EXISTS records;
DROP TABLE IF EXISTS squads;
DROP TABLE IF EXISTS categories;

-- 1. Categories table (Department Summary)
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL
);

-- 2. Squads table (Sub-units)
CREATE TABLE IF NOT EXISTS squads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL
);

-- 3. Squad Records (Details for Urban/Illegal construction)
CREATE TABLE IF NOT EXISTS squad_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    squad_id INTEGER,
    category_id INTEGER,
    year INTEGER,
    month INTEGER,
    workload INTEGER DEFAULT 0,
    FOREIGN KEY (squad_id) REFERENCES squads(id),
    FOREIGN KEY (category_id) REFERENCES categories(id),
    UNIQUE(squad_id, category_id, year, month)
);

-- 4. General Records (Summary and other departments)
CREATE TABLE IF NOT EXISTS records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER,
    year INTEGER,
    month INTEGER,
    workload INTEGER DEFAULT 0,
    FOREIGN KEY (category_id) REFERENCES categories(id),
    UNIQUE(category_id, year, month)
);

-- Seed Initial Data
INSERT OR IGNORE INTO squads (name) VALUES 
('向阳大队'), ('兴安大队'), ('全宁大队'), ('振兴大队'), 
('松州大队'), ('玉龙大队'), ('铁东大队'), ('松城大队');

INSERT OR IGNORE INTO categories (name) VALUES 
('市容市貌'), ('违法建设'), ('市政设施'), ('环境卫生'), 
('三大队（施工噪音扬尘渣土）'), ('二大队'), ('园林绿化'), ('人事财务股'), ('审批中心');

