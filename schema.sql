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

-- Records
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2471, 156, 2025, 1, 14);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2472, 158, 2025, 1, 32);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2473, 159, 2025, 1, 8);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2474, 157, 2025, 1, 0);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2475, 160, 2025, 1, 7);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2476, 161, 2025, 1, 8);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2477, 162, 2025, 1, 1);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2478, 163, 2025, 1, 0);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2479, 164, 2025, 1, 0);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2480, 156, 2025, 2, 12);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2481, 158, 2025, 2, 31);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2482, 159, 2025, 2, 26);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2483, 157, 2025, 2, 0);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2484, 160, 2025, 2, 2);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2485, 161, 2025, 2, 3);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2486, 162, 2025, 2, 1);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2487, 163, 2025, 2, 0);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2488, 164, 2025, 2, 0);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2489, 156, 2025, 3, 29);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2490, 158, 2025, 3, 38);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2491, 159, 2025, 3, 23);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2492, 157, 2025, 3, 0);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2493, 160, 2025, 3, 23);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2494, 161, 2025, 3, 4);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2495, 162, 2025, 3, 9);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2496, 163, 2025, 3, 0);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2497, 164, 2025, 3, 0);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2498, 156, 2025, 4, 554);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2499, 158, 2025, 4, 42);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2500, 159, 2025, 4, 19);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2501, 157, 2025, 4, 23);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2502, 160, 2025, 4, 51);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2503, 161, 2025, 4, 19);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2504, 162, 2025, 4, 16);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2505, 163, 2025, 4, 3);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2506, 164, 2025, 4, 0);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2507, 156, 2025, 5, 519);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2508, 158, 2025, 5, 45);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2509, 159, 2025, 5, 22);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2510, 157, 2025, 5, 38);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2511, 160, 2025, 5, 67);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2512, 161, 2025, 5, 32);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2513, 162, 2025, 5, 29);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2514, 163, 2025, 5, 0);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2515, 164, 2025, 5, 0);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2516, 156, 2025, 6, 672);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2517, 158, 2025, 6, 70);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2518, 159, 2025, 6, 13);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2519, 157, 2025, 6, 48);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2520, 160, 2025, 6, 127);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2521, 161, 2025, 6, 23);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2522, 162, 2025, 6, 33);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2523, 163, 2025, 6, 0);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2524, 164, 2025, 6, 3);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2525, 156, 2025, 7, 946);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2526, 158, 2025, 7, 82);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2527, 159, 2025, 7, 37);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2528, 157, 2025, 7, 42);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2529, 160, 2025, 7, 180);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2530, 161, 2025, 7, 43);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2531, 162, 2025, 7, 21);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2532, 163, 2025, 7, 0);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2533, 164, 2025, 7, 3);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2534, 156, 2025, 8, 538);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2535, 158, 2025, 8, 86);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2536, 159, 2025, 8, 32);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2537, 157, 2025, 8, 52);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2538, 160, 2025, 8, 214);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2539, 161, 2025, 8, 33);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2540, 162, 2025, 8, 24);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2541, 163, 2025, 8, 0);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2542, 164, 2025, 8, 2);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2543, 156, 2025, 9, 508);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2544, 158, 2025, 9, 80);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2545, 159, 2025, 9, 37);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2546, 157, 2025, 9, 44);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2547, 160, 2025, 9, 132);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2548, 161, 2025, 9, 10);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2549, 162, 2025, 9, 16);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2550, 163, 2025, 9, 0);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2551, 164, 2025, 9, 1);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2552, 156, 2025, 10, 477);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2553, 158, 2025, 10, 42);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2554, 159, 2025, 10, 16);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2555, 157, 2025, 10, 35);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2556, 160, 2025, 10, 23);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2557, 161, 2025, 10, 10);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2558, 162, 2025, 10, 19);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2559, 163, 2025, 10, 0);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2560, 164, 2025, 10, 1);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2561, 156, 2025, 11, 289);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2562, 158, 2025, 11, 28);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2563, 159, 2025, 11, 13);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2564, 157, 2025, 11, 30);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2565, 160, 2025, 11, 22);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2566, 161, 2025, 11, 15);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2567, 162, 2025, 11, 8);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2568, 163, 2025, 11, 0);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2569, 164, 2025, 11, 1);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2570, 156, 2025, 12, 221);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2571, 158, 2025, 12, 37);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2572, 159, 2025, 12, 11);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2573, 157, 2025, 12, 30);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2574, 160, 2025, 12, 10);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2575, 161, 2025, 12, 6);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2576, 162, 2025, 12, 5);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2577, 163, 2025, 12, 0);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2578, 164, 2025, 12, 0);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2579, 156, 2026, 1, 168);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2580, 158, 2026, 1, 44);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2581, 159, 2026, 1, 25);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2582, 157, 2026, 1, 27);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2583, 160, 2026, 1, 19);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2584, 161, 2026, 1, 7);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2585, 162, 2026, 1, 1);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2586, 163, 2026, 1, 1);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2587, 164, 2026, 1, 1);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2588, 156, 2026, 2, 143);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2589, 158, 2026, 2, 17);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2590, 159, 2026, 2, 20);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2591, 157, 2026, 2, 10);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2592, 160, 2026, 2, 1);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2593, 161, 2026, 2, 9);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2594, 162, 2026, 2, 5);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2595, 163, 2026, 2, 0);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2596, 164, 2026, 2, 1);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2597, 156, 2026, 3, 0);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2598, 158, 2026, 3, 0);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2599, 159, 2026, 3, 0);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2600, 157, 2026, 3, 0);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2601, 160, 2026, 3, 0);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2602, 161, 2026, 3, 0);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2603, 162, 2026, 3, 0);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2604, 163, 2026, 3, 0);
INSERT OR REPLACE INTO records (id, category_id, year, month, workload) VALUES (2605, 164, 2026, 3, 0);

-- Squad Records
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1457, 1, 156, 2025, 1, 4);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1458, 1, 157, 2025, 1, 0);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1459, 2, 156, 2025, 1, 1);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1460, 2, 157, 2025, 1, 0);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1461, 3, 156, 2025, 1, 4);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1462, 3, 157, 2025, 1, 0);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1463, 4, 156, 2025, 1, 0);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1464, 4, 157, 2025, 1, 0);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1465, 5, 156, 2025, 1, 1);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1466, 5, 157, 2025, 1, 0);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1467, 6, 156, 2025, 1, 3);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1468, 6, 157, 2025, 1, 0);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1469, 7, 156, 2025, 1, 1);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1470, 7, 157, 2025, 1, 0);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1471, 8, 156, 2025, 1, 0);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1472, 8, 157, 2025, 1, 0);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1473, 4, 156, 2025, 2, 1);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1474, 4, 157, 2025, 2, 0);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1475, 1, 156, 2025, 2, 0);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1476, 1, 157, 2025, 2, 0);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1477, 3, 156, 2025, 2, 1);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1478, 3, 157, 2025, 2, 0);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1479, 6, 156, 2025, 2, 2);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1480, 6, 157, 2025, 2, 0);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1481, 2, 156, 2025, 2, 2);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1482, 2, 157, 2025, 2, 0);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1483, 7, 156, 2025, 2, 2);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1484, 7, 157, 2025, 2, 0);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1485, 5, 156, 2025, 2, 4);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1486, 5, 157, 2025, 2, 0);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1487, 8, 156, 2025, 2, 0);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1488, 8, 157, 2025, 2, 0);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1489, 4, 156, 2025, 3, 6);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1490, 4, 157, 2025, 3, 0);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1491, 1, 156, 2025, 3, 3);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1492, 1, 157, 2025, 3, 0);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1493, 3, 156, 2025, 3, 5);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1494, 3, 157, 2025, 3, 0);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1495, 6, 156, 2025, 3, 3);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1496, 6, 157, 2025, 3, 0);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1497, 2, 156, 2025, 3, 3);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1498, 2, 157, 2025, 3, 0);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1499, 7, 156, 2025, 3, 5);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1500, 7, 157, 2025, 3, 0);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1501, 5, 156, 2025, 3, 4);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1502, 5, 157, 2025, 3, 0);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1503, 8, 156, 2025, 3, 0);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1504, 8, 157, 2025, 3, 0);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1505, 4, 156, 2025, 4, 79);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1506, 4, 157, 2025, 4, 2);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1507, 1, 156, 2025, 4, 118);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1508, 1, 157, 2025, 4, 8);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1509, 3, 156, 2025, 4, 77);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1510, 3, 157, 2025, 4, 2);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1511, 6, 156, 2025, 4, 56);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1512, 6, 157, 2025, 4, 0);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1513, 2, 156, 2025, 4, 87);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1514, 2, 157, 2025, 4, 4);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1515, 7, 156, 2025, 4, 50);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1516, 7, 157, 2025, 4, 2);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1517, 5, 156, 2025, 4, 72);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1518, 5, 157, 2025, 4, 5);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1519, 8, 156, 2025, 4, 15);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1520, 8, 157, 2025, 4, 0);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1521, 4, 156, 2025, 5, 67);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1522, 4, 157, 2025, 5, 7);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1523, 1, 156, 2025, 5, 102);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1524, 1, 157, 2025, 5, 5);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1525, 3, 156, 2025, 5, 61);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1526, 3, 157, 2025, 5, 2);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1527, 6, 156, 2025, 5, 71);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1528, 6, 157, 2025, 5, 5);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1529, 2, 156, 2025, 5, 87);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1530, 2, 157, 2025, 5, 3);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1531, 7, 156, 2025, 5, 52);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1532, 7, 157, 2025, 5, 8);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1533, 5, 156, 2025, 5, 72);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1534, 5, 157, 2025, 5, 8);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1535, 8, 156, 2025, 5, 7);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1536, 8, 157, 2025, 5, 0);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1537, 4, 156, 2025, 6, 87);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1538, 4, 157, 2025, 6, 4);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1539, 1, 156, 2025, 6, 146);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1540, 1, 157, 2025, 6, 6);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1541, 3, 156, 2025, 6, 80);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1542, 3, 157, 2025, 6, 6);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1543, 6, 156, 2025, 6, 59);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1544, 6, 157, 2025, 6, 9);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1545, 2, 156, 2025, 6, 106);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1546, 2, 157, 2025, 6, 6);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1547, 7, 156, 2025, 6, 84);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1548, 7, 157, 2025, 6, 6);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1549, 5, 156, 2025, 6, 95);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1550, 5, 157, 2025, 6, 11);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1551, 8, 156, 2025, 6, 15);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1552, 8, 157, 2025, 6, 0);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1553, 4, 156, 2025, 7, 131);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1554, 4, 157, 2025, 7, 2);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1555, 1, 156, 2025, 7, 269);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1556, 1, 157, 2025, 7, 6);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1557, 3, 156, 2025, 7, 98);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1558, 3, 157, 2025, 7, 8);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1559, 6, 156, 2025, 7, 97);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1560, 6, 157, 2025, 7, 6);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1561, 2, 156, 2025, 7, 132);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1562, 2, 157, 2025, 7, 7);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1563, 7, 156, 2025, 7, 111);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1564, 7, 157, 2025, 7, 9);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1565, 5, 156, 2025, 7, 87);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1566, 5, 157, 2025, 7, 4);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1567, 8, 156, 2025, 7, 21);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1568, 8, 157, 2025, 7, 0);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1569, 4, 156, 2025, 8, 77);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1570, 4, 157, 2025, 8, 5);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1571, 1, 156, 2025, 8, 153);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1572, 1, 157, 2025, 8, 7);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1573, 3, 156, 2025, 8, 71);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1574, 3, 157, 2025, 8, 12);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1575, 6, 156, 2025, 8, 45);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1576, 6, 157, 2025, 8, 9);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1577, 2, 156, 2025, 8, 90);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1578, 2, 157, 2025, 8, 9);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1579, 7, 156, 2025, 8, 45);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1580, 7, 157, 2025, 8, 4);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1581, 5, 156, 2025, 8, 43);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1582, 5, 157, 2025, 8, 6);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1583, 8, 156, 2025, 8, 14);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1584, 8, 157, 2025, 8, 0);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1585, 4, 156, 2025, 9, 60);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1586, 4, 157, 2025, 9, 6);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1587, 1, 156, 2025, 9, 130);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1588, 1, 157, 2025, 9, 4);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1589, 3, 156, 2025, 9, 80);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1590, 3, 157, 2025, 9, 10);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1591, 6, 156, 2025, 9, 56);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1592, 6, 157, 2025, 9, 4);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1593, 2, 156, 2025, 9, 77);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1594, 2, 157, 2025, 9, 5);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1595, 7, 156, 2025, 9, 49);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1596, 7, 157, 2025, 9, 4);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1597, 5, 156, 2025, 9, 46);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1598, 5, 157, 2025, 9, 11);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1599, 8, 156, 2025, 9, 10);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1600, 8, 157, 2025, 9, 0);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1601, 4, 156, 2025, 10, 50);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1602, 4, 157, 2025, 10, 2);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1603, 1, 156, 2025, 10, 181);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1604, 1, 157, 2025, 10, 4);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1605, 3, 156, 2025, 10, 93);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1606, 3, 157, 2025, 10, 5);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1607, 6, 156, 2025, 10, 34);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1608, 6, 157, 2025, 10, 7);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1609, 2, 156, 2025, 10, 53);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1610, 2, 157, 2025, 10, 3);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1611, 7, 156, 2025, 10, 33);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1612, 7, 157, 2025, 10, 7);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1613, 5, 156, 2025, 10, 30);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1614, 5, 157, 2025, 10, 7);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1615, 8, 156, 2025, 10, 3);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1616, 8, 157, 2025, 10, 0);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1617, 4, 156, 2025, 11, 29);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1618, 4, 157, 2025, 11, 3);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1619, 1, 156, 2025, 11, 62);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1620, 1, 157, 2025, 11, 7);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1621, 3, 156, 2025, 11, 36);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1622, 3, 157, 2025, 11, 2);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1623, 6, 156, 2025, 11, 15);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1624, 6, 157, 2025, 11, 4);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1625, 2, 156, 2025, 11, 79);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1626, 2, 157, 2025, 11, 3);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1627, 7, 156, 2025, 11, 34);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1628, 7, 157, 2025, 11, 6);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1629, 5, 156, 2025, 11, 32);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1630, 5, 157, 2025, 11, 5);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1631, 8, 156, 2025, 11, 2);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1632, 8, 157, 2025, 11, 0);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1633, 4, 156, 2025, 12, 38);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1634, 4, 157, 2025, 12, 2);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1635, 1, 156, 2025, 12, 44);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1636, 1, 157, 2025, 12, 4);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1637, 3, 156, 2025, 12, 29);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1638, 3, 157, 2025, 12, 4);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1639, 6, 156, 2025, 12, 13);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1640, 6, 157, 2025, 12, 3);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1641, 2, 156, 2025, 12, 41);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1642, 2, 157, 2025, 12, 3);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1643, 7, 156, 2025, 12, 25);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1644, 7, 157, 2025, 12, 6);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1645, 5, 156, 2025, 12, 26);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1646, 5, 157, 2025, 12, 8);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1647, 8, 156, 2025, 12, 5);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1648, 8, 157, 2025, 12, 0);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1649, 4, 156, 2026, 1, 43);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1650, 4, 157, 2026, 1, 1);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1651, 1, 156, 2026, 1, 31);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1652, 1, 157, 2026, 1, 4);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1653, 3, 156, 2026, 1, 18);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1654, 3, 157, 2026, 1, 8);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1655, 6, 156, 2026, 1, 20);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1656, 6, 157, 2026, 1, 4);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1657, 2, 156, 2026, 1, 17);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1658, 2, 157, 2026, 1, 0);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1659, 7, 156, 2026, 1, 13);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1660, 7, 157, 2026, 1, 4);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1661, 5, 156, 2026, 1, 11);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1662, 5, 157, 2026, 1, 5);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1663, 8, 156, 2026, 1, 15);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1664, 8, 157, 2026, 1, 1);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1665, 4, 156, 2026, 2, 31);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1666, 4, 157, 2026, 2, 1);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1667, 1, 156, 2026, 2, 46);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1668, 1, 157, 2026, 2, 1);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1669, 3, 156, 2026, 2, 11);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1670, 3, 157, 2026, 2, 2);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1671, 6, 156, 2026, 2, 8);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1672, 6, 157, 2026, 2, 1);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1673, 2, 156, 2026, 2, 21);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1674, 2, 157, 2026, 2, 0);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1675, 7, 156, 2026, 2, 4);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1676, 7, 157, 2026, 2, 3);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1677, 5, 156, 2026, 2, 12);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1678, 5, 157, 2026, 2, 0);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1679, 8, 156, 2026, 2, 10);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1680, 8, 157, 2026, 2, 2);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1681, 4, 156, 2026, 3, 0);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1682, 4, 157, 2026, 3, 0);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1683, 1, 156, 2026, 3, 0);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1684, 1, 157, 2026, 3, 0);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1685, 3, 156, 2026, 3, 0);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1686, 3, 157, 2026, 3, 0);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1687, 6, 156, 2026, 3, 0);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1688, 6, 157, 2026, 3, 0);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1689, 2, 156, 2026, 3, 0);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1690, 2, 157, 2026, 3, 0);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1691, 7, 156, 2026, 3, 0);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1692, 7, 157, 2026, 3, 0);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1693, 5, 156, 2026, 3, 0);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1694, 5, 157, 2026, 3, 0);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1695, 8, 156, 2026, 3, 0);
INSERT OR REPLACE INTO squad_records (id, squad_id, category_id, year, month, workload) VALUES (1696, 8, 157, 2026, 3, 0);
