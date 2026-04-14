const express = require('express');
const cors = require('cors');
const { db, initDb } = require('./db');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from client directory
app.use(express.static(path.join(__dirname, '../client')));

// --- API Routes ---

// 0. System Status (Real-time Diagnostics)
app.get('/api/sys-status', (req, res) => {
    const dbPath = process.env.DB_PATH || path.resolve(__dirname, '../database.sqlite');
    let dbSize = "0.0 MB";
    if (fs.existsSync(dbPath)) {
        const stats = fs.statSync(dbPath);
        dbSize = (stats.size / (1024 * 1024)).toFixed(2) + " MB";
    }

    const query = "SELECT (SELECT COUNT(*) FROM records) + (SELECT COUNT(*) FROM squad_records) as total";
    db.get(query, (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({
            status: "online",
            totalRecords: row.total || 0,
            dbSize: dbSize,
            uptime: Math.floor(process.uptime()),
            version: "v2.6.4-PRIME",
            serverTime: new Date().toLocaleTimeString('zh-CN', { hour12: false })
        });
    });
});

// 1. Get categories
app.get('/api/categories', (req, res) => {
    db.all("SELECT * FROM categories", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// 2. Get squads
app.get('/api/squads', (req, res) => {
    db.all("SELECT * FROM squads", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// 3. Get available years
app.get('/api/years', (req, res) => {
    db.all("SELECT DISTINCT year FROM (SELECT year FROM records UNION SELECT year FROM squad_records) ORDER BY year DESC", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows.map(r => r.year));
    });
});

// 4. Get records for management (including aggregated squad data)
app.get('/api/records/:year/:month', (req, res) => {
    const { year, month } = req.params;
    
    // Logic: 1. Get general records. 2. For '市容市貌' and '违法建设', override with sum from squad_records.
    const query = `
        SELECT c.id as category_id, c.name, 
            CASE 
                WHEN c.name IN ('市容市貌', '违法建设') THEN (
                    SELECT SUM(workload) FROM squad_records 
                    WHERE category_id = c.id AND year = ? AND month = ?
                )
                ELSE (
                    SELECT workload FROM records 
                    WHERE category_id = c.id AND year = ? AND month = ?
                )
            END as workload
        FROM categories c
    `;
    db.all(query, [year, month, year, month], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows.map(r => ({ ...r, workload: r.workload || 0 })));
    });
});

// 5. Get squad records
app.get('/api/squad-records/:year/:month', (req, res) => {
    const { year, month } = req.params;
    const query = `
        SELECT s.id as squad_id, s.name as squad_name, c.id as category_id, c.name as category_name, sr.workload
        FROM squads s
        CROSS JOIN categories c
        LEFT JOIN squad_records sr ON s.id = sr.squad_id AND c.id = sr.category_id AND sr.year = ? AND sr.month = ?
        WHERE c.name IN ('市容市貌', '违法建设')
    `;
    db.all(query, [year, month], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// 6. Save records (both squad and general)
app.post('/api/records', (req, res) => {
    const { year, month, data, squadData } = req.body;
    
    db.serialize(() => {
        db.run("BEGIN TRANSACTION");

        // Save general records (exclude aggregated ones or just save them as is, but we'll use squadData for aggregation)
        const stmtRec = db.prepare("INSERT OR REPLACE INTO records (category_id, year, month, workload) VALUES (?, ?, ?, ?)");
        if (data) {
            data.forEach(item => {
                stmtRec.run(item.category_id, year, month, item.workload);
            });
        }
        stmtRec.finalize();

        // Save squad-specific records
        const stmtSquad = db.prepare("INSERT OR REPLACE INTO squad_records (squad_id, category_id, year, month, workload) VALUES (?, ?, ?, ?, ?)");
        if (squadData) {
            squadData.forEach(item => {
                stmtSquad.run(item.squad_id, item.category_id, year, month, item.workload);
            });
        }
        stmtSquad.finalize();

        db.run("COMMIT", (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
    });
});

// 7. Comparison API (Aggregated)
app.get('/api/comparison', (req, res) => {
    const { year1, year2, month } = req.query;
    const m = (month && month !== 'all') ? `AND month = ${month}` : '';

    const query = `
        SELECT 
            c.name as category,
            (
                SELECT SUM(val) FROM (
                    SELECT workload as val FROM records WHERE category_id = c.id AND year = ? ${m}
                    UNION ALL
                    SELECT SUM(workload) as val FROM squad_records WHERE category_id = c.id AND year = ? ${m} AND c.name IN ('市容市貌', '违法建设')
                )
                WHERE (c.name NOT IN ('市容市貌', '违法建设') AND EXISTS(SELECT 1 FROM records WHERE category_id = c.id AND year = ? ${m}))
                   OR (c.name IN ('市容市貌', '违法建设'))
            ) as year1_total,
            (
                SELECT SUM(val) FROM (
                    SELECT workload as val FROM records WHERE category_id = c.id AND year = ? ${m}
                    UNION ALL
                    SELECT SUM(workload) as val FROM squad_records WHERE category_id = c.id AND year = ? ${m} AND c.name IN ('市容市貌', '违法建设')
                )
                WHERE (c.name NOT IN ('市容市貌', '违法建设') AND EXISTS(SELECT 1 FROM records WHERE category_id = c.id AND year = ? ${m}))
                   OR (c.name IN ('市容市貌', '违法建设'))
            ) as year2_total
        FROM categories c
    `;
    // Simplified aggregation query
    const simpleQuery = `
        SELECT c.name as category,
            (SELECT COALESCE(SUM(workload), 0) FROM (
                SELECT workload FROM records WHERE category_id = c.id AND year = ? ${m} AND c.name NOT IN ('市容市貌', '违法建设')
                UNION ALL
                SELECT workload FROM squad_records WHERE category_id = c.id AND year = ? ${m} AND c.name IN ('市容市貌', '违法建设')
            )) as year1_total,
            (SELECT COALESCE(SUM(workload), 0) FROM (
                SELECT workload FROM records WHERE category_id = c.id AND year = ? ${m} AND c.name NOT IN ('市容市貌', '违法建设')
                UNION ALL
                SELECT workload FROM squad_records WHERE category_id = c.id AND year = ? ${m} AND c.name IN ('市容市貌', '违法建设')
            )) as year2_total
        FROM categories c
    `;

    db.all(simpleQuery, [year1, year1, year2, year2], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// 8. Stats/Trend - Update to handle aggregation
app.get('/api/stats/:year', (req, res) => {
    const { year } = req.params;
    const prevYear = year - 1;
    const query = `
        SELECT year, SUM(workload) as total FROM (
            SELECT year, workload FROM records WHERE year IN (?, ?) AND category_id NOT IN (SELECT id FROM categories WHERE name IN ('市容市貌', '违法建设'))
            UNION ALL
            SELECT year, workload FROM squad_records WHERE year IN (?, ?)
        ) GROUP BY year
    `;
    db.all(query, [year, prevYear, year, prevYear], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.get('/api/trend/:year', (req, res) => {
    const { year } = req.params;
    const query = `
        SELECT month, SUM(workload) as total FROM (
            SELECT month, workload FROM records WHERE year = ? AND category_id NOT IN (SELECT id FROM categories WHERE name IN ('市容市貌', '违法建设'))
            UNION ALL
            SELECT month, workload FROM squad_records WHERE year = ?
        ) GROUP BY month ORDER BY month
    `;
    db.all(query, [year, year], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// 9. Universal Subject Search (Squad or Category)
app.get('/api/subject-stats', (req, res) => {
    const { type, id, year } = req.query;
    let query = "";
    const params = [id];

    if (type === 'squad') {
        query = `
            SELECT year, month, '工单量' as category, workload
            FROM squad_records
            WHERE squad_id = ?
        `;
    } else {
        query = `
            SELECT year, month, '工单量' as category, workload
            FROM records
            WHERE category_id = ?
        `;
    }

    if (year && year !== 'all') {
        query += " AND year = ?";
        params.push(year);
    }
    query += " ORDER BY year DESC, month DESC";
    
    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// 10. Advanced Multi-dimensional Query
app.get('/api/advanced-query', (req, res) => {
    const { years, months, squadIds, categoryIds } = req.query;
    
    const yearList = years ? years.split(',') : [];
    const monthList = months ? months.split(',') : [];
    const squadList = squadIds ? squadIds.split(',') : [];
    const categoryList = categoryIds ? categoryIds.split(',') : [];

    let queries = [];
    let params = [];

    // Base filters
    const yearFilter = yearList.length > 0 ? `AND year IN (${yearList.map(() => '?').join(',')})` : '';
    const monthFilter = monthList.length > 0 ? `AND month IN (${monthList.map(() => '?').join(',')})` : '';
    const catFilter = categoryList.length > 0 ? `AND category_id IN (${categoryList.map(() => '?').join(',')})` : '';
    
    // 1. From records (General categories + Totals for Urban/Illegal)
    // If squadIds is specified, we skip Urban/Illegal from 'records' to avoid duplication with squad query
    const skipAggregated = squadList.length > 0 ? "AND category_id NOT IN (SELECT id FROM categories WHERE name IN ('市容市貌', '违法建设'))" : "";
    
    if (categoryList.length > 0 || squadList.length === 0) {
        let recQuery = `
            SELECT year, month, c.name as subject, workload, 'category' as type
            FROM records r
            JOIN categories c ON r.category_id = c.id
            WHERE 1=1 ${yearFilter} ${monthFilter} ${catFilter} ${skipAggregated}
        `;
        queries.push(recQuery);
        params.push(...yearList, ...monthList, ...categoryList);
    }

    // 2. From squad_records (Specific Squads)
    if (squadList.length > 0) {
        const squadFilter = `AND squad_id IN (${squadList.map(() => '?').join(',')})`;
        let squadQuery = `
            SELECT year, month, s.name as subject, workload, 'squad' as type
            FROM squad_records sr
            JOIN squads s ON sr.squad_id = s.id
            WHERE 1=1 ${yearFilter} ${monthFilter} ${squadFilter} ${catFilter}
        `;
        queries.push(squadQuery);
        params.push(...yearList, ...monthList, ...squadList, ...categoryList);
    }

    const finalQuery = queries.join(" UNION ALL ") + " ORDER BY subject ASC, type ASC, year DESC, month DESC";
    
    db.all(finalQuery, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Start server
const PORT = process.env.PORT || 3001;
initDb().then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}).catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
});
