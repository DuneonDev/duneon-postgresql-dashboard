import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { fetchSshPostgresUsers, runQuery, withPgClient } from './server/ssh-pg.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json({ limit: '10mb' }));

  // API Routes / Health Check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // 1. Fetch Postgres Users
  app.post('/api/postgres/users', async (req, res) => {
    try {
      const { ssh } = req.body;
      if (!ssh || !ssh.host) {
        return res.status(400).json({ success: false, error: 'Missing SSH configurations' });
      }
      const users = await fetchSshPostgresUsers(ssh);
      res.json({ success: true, users });
    } catch (err: any) {
      console.error('Error fetching Postgres users:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 2. Fetch Databases
  app.post('/api/postgres/databases', async (req, res) => {
    try {
      const { ssh, pg } = req.body;
      const result = await runQuery(
        ssh,
        pg,
        "SELECT datname FROM pg_database WHERE datistemplate = false ORDER BY datname;"
      );
      const databases = result.rows.map((row: any) => row.datname);
      res.json({ success: true, databases });
    } catch (err: any) {
      console.error('Error fetching databases:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 3. Fetch Tables
  app.post('/api/postgres/tables', async (req, res) => {
    try {
      const { ssh, pg } = req.body;
      const result = await runQuery(
        ssh,
        pg,
        "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name;"
      );
      const tables = result.rows.map((row: any) => row.table_name);
      res.json({ success: true, tables });
    } catch (err: any) {
      console.error('Error fetching tables:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 4. Fetch Table Columns, Primary Keys and Rows
  app.post('/api/postgres/table-content', async (req, res) => {
    try {
      const { ssh, pg, tableName } = req.body;
      if (!tableName) {
        return res.status(400).json({ success: false, error: 'Table name is required' });
      }

      await withPgClient(ssh, pg, async (client) => {
        // Fetch columns info
        const columnsResult = await client.query(
          `SELECT column_name, data_type, is_nullable, column_default, character_maximum_length
           FROM information_schema.columns 
           WHERE table_schema = 'public' AND table_name = $1 
           ORDER BY ordinal_position;`,
          [tableName]
        );

        // Fetch primary key constraints
        const pksResult = await client.query(
          `SELECT kcu.column_name 
           FROM information_schema.table_constraints tc 
           JOIN information_schema.key_column_usage kcu 
             ON tc.constraint_name = kcu.constraint_name 
             AND tc.table_schema = kcu.table_schema 
           WHERE tc.constraint_type = 'PRIMARY KEY' 
             AND tc.table_name = $1;`,
          [tableName]
        );

        // Fetch rows (limit 150)
        // Clean double quotes around table name for safety
        const escapedTableName = `"${tableName.replace(/"/g, '""')}"`;
        const rowsResult = await client.query(`SELECT * FROM ${escapedTableName} LIMIT 150;`);

        res.json({
          success: true,
          columns: columnsResult.rows,
          primaryKeys: pksResult.rows.map((r: any) => r.column_name),
          rows: rowsResult.rows,
        });
      });
    } catch (err: any) {
      console.error('Error fetching table content:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 5. Create Database
  app.post('/api/postgres/database/create', async (req, res) => {
    try {
      const { ssh, pg, dbName } = req.body;
      if (!dbName) {
        return res.status(400).json({ success: false, error: 'Database name is required' });
      }
      const escapedDbName = `"${dbName.replace(/"/g, '""')}"`;
      await runQuery(ssh, pg, `CREATE DATABASE ${escapedDbName};`);
      res.json({ success: true });
    } catch (err: any) {
      console.error('Error creating database:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 6. Delete Database
  app.post('/api/postgres/database/delete', async (req, res) => {
    try {
      const { ssh, pg, dbName } = req.body;
      if (!dbName) {
        return res.status(400).json({ success: false, error: 'Database name is required' });
      }

      // Copy configurations and set target connection DB to postgres (or template1)
      const pgCopy = { ...pg };
      if (pgCopy.database === dbName || !pgCopy.database) {
        pgCopy.database = dbName === 'postgres' ? 'template1' : 'postgres';
      }

      const escapedDbName = `"${dbName.replace(/"/g, '""')}"`;

      // Terminate any active connections to the target database so it isn't locked
      try {
        await runQuery(ssh, pgCopy, `
          SELECT pg_terminate_backend(pg_stat_activity.pid)
          FROM pg_stat_activity
          WHERE pg_stat_activity.datname = $1
            AND pid <> pg_backend_pid();
        `, [dbName]);
      } catch (terminateErr: any) {
        console.warn('[Server] Could not terminate other connections (this is normal if not superuser):', terminateErr.message);
      }

      await runQuery(ssh, pgCopy, `DROP DATABASE ${escapedDbName};`);
      res.json({ success: true });
    } catch (err: any) {
      console.error('Error deleting database:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 7. Create Postgres User
  app.post('/api/postgres/user/create', async (req, res) => {
    try {
      const { ssh, pg, newUsername, newPassword, isSuperuser } = req.body;
      if (!newUsername || !newPassword) {
        return res.status(400).json({ success: false, error: 'Username and password are required' });
      }
      const escapedUser = `"${newUsername.replace(/"/g, '""')}"`;
      const escapedPass = `'${newPassword.replace(/'/g, "''")}'`;
      const superuserClause = isSuperuser ? ' SUPERUSER' : '';
      await runQuery(ssh, pg, `CREATE USER ${escapedUser} WITH PASSWORD ${escapedPass}${superuserClause};`);
      res.json({ success: true });
    } catch (err: any) {
      console.error('Error creating user:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 8. Delete Postgres User
  app.post('/api/postgres/user/delete', async (req, res) => {
    try {
      const { ssh, pg, targetUsername } = req.body;
      if (!targetUsername) {
        return res.status(400).json({ success: false, error: 'Username is required' });
      }
      const escapedUser = `"${targetUsername.replace(/"/g, '""')}"`;
      await runQuery(ssh, pg, `DROP USER ${escapedUser};`);
      res.json({ success: true });
    } catch (err: any) {
      console.error('Error deleting user:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 9. Create Table
  app.post('/api/postgres/table/create', async (req, res) => {
    try {
      const { ssh, pg, tableName, columns } = req.body;
      if (!tableName || !columns || !columns.length) {
        return res.status(400).json({ success: false, error: 'Table name and columns are required' });
      }

      const colsSql = columns.map((col: any) => {
        let sql = `"${col.name.replace(/"/g, '""')}" ${col.type}`;
        if (col.isPrimaryKey) {
          sql += ' PRIMARY KEY';
        } else {
          if (!col.isNullable) sql += ' NOT NULL';
          if (col.isUnique) sql += ' UNIQUE';
        }
        if (col.defaultValue !== undefined && col.defaultValue !== '') {
          sql += ` DEFAULT ${col.defaultValue}`;
        }
        return sql;
      }).join(', ');

      const escapedTable = `"${tableName.replace(/"/g, '""')}"`;
      const createTableSql = `CREATE TABLE ${escapedTable} (${colsSql});`;

      await runQuery(ssh, pg, createTableSql);
      res.json({ success: true });
    } catch (err: any) {
      console.error('Error creating table:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 10. Delete Table
  app.post('/api/postgres/table/delete', async (req, res) => {
    try {
      const { ssh, pg, tableName } = req.body;
      if (!tableName) {
        return res.status(400).json({ success: false, error: 'Table name is required' });
      }
      const escapedTable = `"${tableName.replace(/"/g, '""')}"`;
      await runQuery(ssh, pg, `DROP TABLE ${escapedTable} CASCADE;`);
      res.json({ success: true });
    } catch (err: any) {
      console.error('Error deleting table:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 10.5. Alter Table (Modify structure/schema)
  app.post('/api/postgres/table/alter', async (req, res) => {
    try {
      const { ssh, pg, tableName, newTableName, operations } = req.body;
      if (!tableName) {
        return res.status(400).json({ success: false, error: 'Table name is required' });
      }

      await withPgClient(ssh, pg, async (client) => {
        // Run as a transaction so that if any part fails, nothing is altered
        await client.query('BEGIN');

        try {
          const escapedTable = `"${tableName.replace(/"/g, '""')}"`;

          // Apply operations
          if (operations && operations.length > 0) {
            for (const op of operations) {
              if (op.type === 'add') {
                const escapedCol = `"${op.columnName.replace(/"/g, '""')}"`;
                let sql = `ALTER TABLE ${escapedTable} ADD COLUMN ${escapedCol} ${op.columnType}`;
                if (op.defaultValue !== undefined && op.defaultValue !== '') {
                  sql += ` DEFAULT ${op.defaultValue}`;
                }
                if (!op.isNullable) {
                  sql += ` NOT NULL`;
                }
                await client.query(sql);
              } 
              else if (op.type === 'drop') {
                const escapedCol = `"${op.columnName.replace(/"/g, '""')}"`;
                const sql = `ALTER TABLE ${escapedTable} DROP COLUMN ${escapedCol} CASCADE`;
                await client.query(sql);
              } 
              else if (op.type === 'modify') {
                const escapedColOld = `"${op.oldColumnName.replace(/"/g, '""')}"`;
                const colNameForNextAlters = op.newColumnName && op.newColumnName !== op.oldColumnName ? op.newColumnName : op.oldColumnName;
                const escapedColTarget = `"${colNameForNextAlters.replace(/"/g, '""')}"`;

                // 1. Rename column if name changed
                if (op.newColumnName && op.newColumnName !== op.oldColumnName) {
                  const escapedNewCol = `"${op.newColumnName.replace(/"/g, '""')}"`;
                  const sqlRename = `ALTER TABLE ${escapedTable} RENAME COLUMN ${escapedColOld} TO ${escapedNewCol}`;
                  await client.query(sqlRename);
                }

                // 2. Change data type
                if (op.typeChanged) {
                  // Let's build a USING cast. Since some types are complex (e.g., VARCHAR(255)), we should try cast to base or matching type
                  const baseType = op.newType.split('(')[0];
                  const sqlDataType = `ALTER TABLE ${escapedTable} ALTER COLUMN ${escapedColTarget} TYPE ${op.newType} USING ${escapedColTarget}::${baseType}`;
                  await client.query(sqlDataType);
                }

                // 3. Change Nullability
                if (op.nullableChanged) {
                  if (op.newIsNullable) {
                    await client.query(`ALTER TABLE ${escapedTable} ALTER COLUMN ${escapedColTarget} DROP NOT NULL`);
                  } else {
                    await client.query(`ALTER TABLE ${escapedTable} ALTER COLUMN ${escapedColTarget} SET NOT NULL`);
                  }
                }

                // 4. Change Default Value
                if (op.defaultChanged) {
                  if (op.newDefaultValue !== undefined && op.newDefaultValue !== '') {
                    await client.query(`ALTER TABLE ${escapedTable} ALTER COLUMN ${escapedColTarget} SET DEFAULT ${op.newDefaultValue}`);
                  } else {
                    await client.query(`ALTER TABLE ${escapedTable} ALTER COLUMN ${escapedColTarget} DROP DEFAULT`);
                  }
                }
              }
            }
          }

          // Apply table rename if requested
          if (newTableName && newTableName !== tableName) {
            const escapedNewTable = `"${newTableName.replace(/"/g, '""')}"`;
            const sqlRenameTable = `ALTER TABLE ${escapedTable} RENAME TO ${escapedNewTable}`;
            await client.query(sqlRenameTable);
          }

          await client.query('COMMIT');
          res.json({ success: true });
        } catch (txnErr: any) {
          await client.query('ROLLBACK');
          throw txnErr;
        }
      });
    } catch (err: any) {
      console.error('Error altering table:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 11. Insert Row
  app.post('/api/postgres/row/create', async (req, res) => {
    try {
      const { ssh, pg, tableName, rowData } = req.body;
      if (!tableName || !rowData) {
        return res.status(400).json({ success: false, error: 'Table name and row data are required' });
      }

      const keys = Object.keys(rowData);
      if (keys.length === 0) {
        // Insert a completely default row
        const escapedTable = `"${tableName.replace(/"/g, '""')}"`;
        await runQuery(ssh, pg, `INSERT INTO ${escapedTable} DEFAULT VALUES;`);
        return res.json({ success: true });
      }

      const cols = keys.map(k => `"${k.replace(/"/g, '""')}"`).join(', ');
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
      const escapedTable = `"${tableName.replace(/"/g, '""')}"`;
      const sql = `INSERT INTO ${escapedTable} (${cols}) VALUES (${placeholders}) RETURNING *;`;
      const params = keys.map(k => rowData[k]);

      const result = await runQuery(ssh, pg, sql, params);
      res.json({ success: true, row: result.rows[0] });
    } catch (err: any) {
      console.error('Error inserting row:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 12. Update Row
  app.post('/api/postgres/row/update', async (req, res) => {
    try {
      const { ssh, pg, tableName, primaryKeyName, primaryKeyValue, rowData } = req.body;
      if (!tableName || !primaryKeyName || primaryKeyValue === undefined || !rowData) {
        return res.status(400).json({ success: false, error: 'Missing update arguments' });
      }

      const keys = Object.keys(rowData);
      if (keys.length === 0) {
        return res.json({ success: true, message: 'No fields to update' });
      }

      const setClause = keys.map((k, i) => `"${k.replace(/"/g, '""')}" = $${i + 1}`).join(', ');
      const escapedTable = `"${tableName.replace(/"/g, '""')}"`;
      const escapedPk = `"${primaryKeyName.replace(/"/g, '""')}"`;
      const sql = `UPDATE ${escapedTable} SET ${setClause} WHERE ${escapedPk} = $${keys.length + 1} RETURNING *;`;
      const params = [...keys.map(k => rowData[k]), primaryKeyValue];

      const result = await runQuery(ssh, pg, sql, params);
      res.json({ success: true, row: result.rows[0] });
    } catch (err: any) {
      console.error('Error updating row:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 13. Delete Row
  app.post('/api/postgres/row/delete', async (req, res) => {
    try {
      const { ssh, pg, tableName, primaryKeyName, primaryKeyValue } = req.body;
      if (!tableName || !primaryKeyName || primaryKeyValue === undefined) {
        return res.status(400).json({ success: false, error: 'Missing delete arguments' });
      }

      const escapedTable = `"${tableName.replace(/"/g, '""')}"`;
      const escapedPk = `"${primaryKeyName.replace(/"/g, '""')}"`;
      const sql = `DELETE FROM ${escapedTable} WHERE ${escapedPk} = $1;`;

      await runQuery(ssh, pg, sql, [primaryKeyValue]);
      res.json({ success: true });
    } catch (err: any) {
      console.error('Error deleting row:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 14. Execute Custom Query
  app.post('/api/postgres/query', async (req, res) => {
    try {
      const { ssh, pg, sql, params } = req.body;
      if (!sql) {
        return res.status(400).json({ success: false, error: 'SQL query is required' });
      }
      const result = await runQuery(ssh, pg, sql, params || []);
      res.json({
        success: true,
        rows: result.rows,
        rowCount: result.rowCount,
        fields: result.fields,
      });
    } catch (err: any) {
      console.error('Error executing query:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Vite middleware setup for Development mode
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production build delivery
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Bind to hardcoded Port 3000 on all interfaces
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Express full-stack backend running on port ${PORT}`);
  });
}

startServer();
