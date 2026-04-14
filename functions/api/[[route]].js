import { Hono } from 'hono';
import { handle } from 'hono/cloudflare-pages';

const app = new Hono().basePath('/api');

// 0. System Status (Real-time Diagnostics)
app.get('/sys-status', async (c) => {
    try {
        const query = "SELECT (SELECT COUNT(*) FROM records) + (SELECT COUNT(*) FROM squad_records) as total";
        const { results } = await c.env.DB.prepare(query).all();
        
        return c.json({
            status: "online",
            totalRecords: results[0]?.total || 0,
            dbSize: "N/A (Cloudflare D1)",
            uptime: "N/A",
            version: "v2.6.4-PRIME-CF",
            serverTime: new Date().toLocaleTimeString('zh-CN', { hour12: false, timeZone: 'Asia/Shanghai' })
        });
    } catch (error) {
        return c.json({ error: error.message }, 500);
    }
});

// 1. Get categories
app.get('/categories', async (c) => {
    try {
        const { results } = await c.env.DB.prepare("SELECT * FROM categories").all();
        return c.json(results);
    } catch (error) {
        return c.json({ error: error.message }, 500);
    }
});

// 2. Get squads
app.get('/squads', async (c) => {
    try {
        const { results } = await c.env.DB.prepare("SELECT * FROM squads").all();
        return c.json(results);
    } catch (error) {
        return c.json({ error: error.message }, 500);
    }
});

// 3. Get available years
app.get('/years', async (c) => {
    try {
        const { results } = await c.env.DB.prepare("SELECT DISTINCT year FROM (SELECT year FROM records UNION SELECT year FROM squad_records) ORDER BY year DESC").all();
        return c.json(results.map(r => r.year));
    } catch (error) {
        return c.json({ error: error.message }, 500);
    }
});

// 4. Get records for management (including aggregated squad data)
app.get('/records/:year/:month', async (c) => {
    try {
        const year = c.req.param('year');
        const month = c.req.param('month');
        const query = `
            SELECT c.id as category_id, c.name, 
                CASE 
                    WHEN c.name IN ('市容市貌', '违法建设') THEN (
                        SELECT SUM(workload) FROM squad_records 
                        WHERE category_id = c.id AND year = ?1 AND month = ?2
                    )
                    ELSE (
                        SELECT workload FROM records 
                        WHERE category_id = c.id AND year = ?3 AND month = ?4
                    )
                END as workload
            FROM categories c
        `;
        const { results } = await c.env.DB.prepare(query).bind(year, month, year, month).all();
        return c.json(results.map(r => ({ ...r, workload: r.workload || 0 })));
    } catch (error) {
        return c.json({ error: error.message }, 500);
    }
});

// 5. Get squad records
app.get('/squad-records/:year/:month', async (c) => {
    try {
        const year = c.req.param('year');
        const month = c.req.param('month');
        const query = `
            SELECT s.id as squad_id, s.name as squad_name, c.id as category_id, c.name as category_name, sr.workload
            FROM squads s
            CROSS JOIN categories c
            LEFT JOIN squad_records sr ON s.id = sr.squad_id AND c.id = sr.category_id AND sr.year = ?1 AND sr.month = ?2
            WHERE c.name IN ('市容市貌', '违法建设')
        `;
        const { results } = await c.env.DB.prepare(query).bind(year, month).all();
        return c.json(results);
    } catch (error) {
        return c.json({ error: error.message }, 500);
    }
});

// 6. Save records (both squad and general)
app.post('/records', async (c) => {
    try {
        const body = await c.req.json();
        const { year, month, data, squadData } = body;
        
        let statements = [];
        
        // Save general records
        if (data) {
            const stmtRec = c.env.DB.prepare("INSERT OR REPLACE INTO records (category_id, year, month, workload) VALUES (?1, ?2, ?3, ?4)");
            data.forEach(item => {
                statements.push(stmtRec.bind(item.category_id, year, month, item.workload));
            });
        }
        
        // Save squad-specific records
        if (squadData) {
            const stmtSquad = c.env.DB.prepare("INSERT OR REPLACE INTO squad_records (squad_id, category_id, year, month, workload) VALUES (?1, ?2, ?3, ?4, ?5)");
            squadData.forEach(item => {
                statements.push(stmtSquad.bind(item.squad_id, item.category_id, year, month, item.workload));
            });
        }
        
        if (statements.length > 0) {
            await c.env.DB.batch(statements);
        }
        
        return c.json({ success: true });
    } catch (error) {
        return c.json({ error: error.message }, 500);
    }
});

// 7. Comparison API (Aggregated)
app.get('/comparison', async (c) => {
    try {
        const year1 = c.req.query('year1');
        const year2 = c.req.query('year2');
        const month = c.req.query('month');
        
        const m = (month && month !== 'all') ? `AND month = ${month}` : '';
        
        const query = `
            SELECT c.name as category,
                (SELECT COALESCE(SUM(workload), 0) FROM (
                    SELECT workload FROM records WHERE category_id = c.id AND year = ?1 ${m} AND c.name NOT IN ('市容市貌', '违法建设')
                    UNION ALL
                    SELECT workload FROM squad_records WHERE category_id = c.id AND year = ?1 ${m} AND c.name IN ('市容市貌', '违法建设')
                )) as year1_total,
                (SELECT COALESCE(SUM(workload), 0) FROM (
                    SELECT workload FROM records WHERE category_id = c.id AND year = ?2 ${m} AND c.name NOT IN ('市容市貌', '违法建设')
                    UNION ALL
                    SELECT workload FROM squad_records WHERE category_id = c.id AND year = ?2 ${m} AND c.name IN ('市容市貌', '违法建设')
                )) as year2_total
            FROM categories c
        `;
        const { results } = await c.env.DB.prepare(query).bind(year1, year2).all();
        return c.json(results);
    } catch (error) {
        return c.json({ error: error.message }, 500);
    }
});

// 8. Stats/Trend
app.get('/stats/:year', async (c) => {
    try {
        const year = c.req.param('year');
        const prevYear = parseInt(year) - 1;
        const query = `
            SELECT year, SUM(workload) as total FROM (
                SELECT year, workload FROM records WHERE year IN (?1, ?2) AND category_id NOT IN (SELECT id FROM categories WHERE name IN ('市容市貌', '违法建设'))
                UNION ALL
                SELECT year, workload FROM squad_records WHERE year IN (?1, ?2)
            ) GROUP BY year
        `;
        const { results } = await c.env.DB.prepare(query).bind(year, prevYear).all();
        return c.json(results);
    } catch (error) {
        return c.json({ error: error.message }, 500);
    }
});

app.get('/trend/:year', async (c) => {
    try {
        const year = c.req.param('year');
        const query = `
            SELECT month, SUM(workload) as total FROM (
                SELECT month, workload FROM records WHERE year = ?1 AND category_id NOT IN (SELECT id FROM categories WHERE name IN ('市容市貌', '违法建设'))
                UNION ALL
                SELECT month, workload FROM squad_records WHERE year = ?1
            ) GROUP BY month ORDER BY month
        `;
        const { results } = await c.env.DB.prepare(query).bind(year).all();
        return c.json(results);
    } catch (error) {
        return c.json({ error: error.message }, 500);
    }
});

// 9. Universal Subject Search
app.get('/subject-stats', async (c) => {
    try {
        const type = c.req.query('type');
        const id = c.req.query('id');
        const year = c.req.query('year');
        
        let query = "";
        let params = [id];

        if (type === 'squad') {
            query = `
                SELECT year, month, '工单量' as category, workload
                FROM squad_records
                WHERE squad_id = ?1
            `;
        } else {
            query = `
                SELECT year, month, '工单量' as category, workload
                FROM records
                WHERE category_id = ?1
            `;
        }

        if (year && year !== 'all') {
            query += " AND year = ?2";
            params.push(year);
        }
        query += " ORDER BY year DESC, month DESC";
        
        const prepared = c.env.DB.prepare(query);
        const statement = params.length > 1 ? prepared.bind(params[0], params[1]) : prepared.bind(params[0]);
        const { results } = await statement.all();
        return c.json(results);
    } catch (error) {
        return c.json({ error: error.message }, 500);
    }
});

// 10. Advanced Multi-dimensional Query
app.get('/advanced-query', async (c) => {
    try {
        const years = c.req.query('years');
        const months = c.req.query('months');
        const squadIds = c.req.query('squadIds');
        const categoryIds = c.req.query('categoryIds');
        
        const yearList = years ? years.split(',') : [];
        const monthList = months ? months.split(',') : [];
        const squadList = squadIds ? squadIds.split(',') : [];
        const categoryList = categoryIds ? categoryIds.split(',') : [];

        let queries = [];
        // Important: D1's bind doesn't support an array of unknown length using spread (...params) cleanly like sqlite3,
        // D1 has a hard limit and using strings for IN clauses when parameters are from our own IDs/Years is generally safe (if we parseInt them or validate).
        // Let's validate to prevent SQL injection, then embed in the query string.
        
        const validateInts = (arr) => arr.map(i => parseInt(i, 10)).filter(i => !isNaN(i));
        const cleanYears = validateInts(yearList).join(',');
        const cleanMonths = validateInts(monthList).join(',');
        const cleanSquads = validateInts(squadList).join(',');
        const cleanCats = validateInts(categoryList).join(',');
        
        const yearFilter = cleanYears ? `AND year IN (${cleanYears})` : '';
        const monthFilter = cleanMonths ? `AND month IN (${cleanMonths})` : '';
        const catFilter = cleanCats ? `AND category_id IN (${cleanCats})` : '';
        
        const skipAggregated = cleanSquads ? "AND category_id NOT IN (SELECT id FROM categories WHERE name IN ('市容市貌', '违法建设'))" : "";
        
        if (cleanCats || !cleanSquads) {
            queries.push(`
                SELECT year, month, c.name as subject, workload, 'category' as type
                FROM records r
                JOIN categories c ON r.category_id = c.id
                WHERE 1=1 ${yearFilter} ${monthFilter} ${catFilter} ${skipAggregated}
            `);
        }

        if (cleanSquads) {
            queries.push(`
                SELECT year, month, s.name as subject, workload, 'squad' as type
                FROM squad_records sr
                JOIN squads s ON sr.squad_id = s.id
                WHERE 1=1 ${yearFilter} ${monthFilter} AND squad_id IN (${cleanSquads}) ${catFilter}
            `);
        }

        const finalQuery = queries.join(" UNION ALL ") + " ORDER BY subject ASC, type ASC, year DESC, month DESC";
        const { results } = await c.env.DB.prepare(finalQuery).all();
        return c.json(results);
        
    } catch (error) {
        return c.json({ error: error.message }, 500);
    }
});

// Export handler
export const onRequest = handle(app);
