import { Client as SSHClient } from 'ssh2';
import { Client as PgClient } from 'pg';

export interface SSHConfig {
  host: string;
  port: number;
  username: string;
  password?: string;
  privateKey?: string;
}

export interface PgConfig {
  user: string;
  password?: string;
  database: string;
  host?: string;
  port?: number;
}

function connectSSH(config: SSHConfig): Promise<SSHClient> {
  return new Promise((resolve, reject) => {
    const client = new SSHClient();
    let resolved = false;

    client.on('ready', () => {
      resolved = true;
      resolve(client);
    });

    client.on('error', (err) => {
      if (!resolved) {
        console.log('[SSH] Connection status detail:', err.message);
        reject(err);
      }
    });

    (client as any).on('close', (hadFailure: boolean) => {
      // Quiet clean session close
    });

    (client as any).on('end', () => {
      // Quiet clean session end
    });
    
    const connectOpts: any = {
      host: config.host,
      port: config.port || 22,
      username: config.username || 'root',
      readyTimeout: 15000,
      keepaliveInterval: 10000,
      keepaliveCountMax: 3
    };
    if (config.privateKey) {
      connectOpts.privateKey = config.privateKey;
    } else if (config.password) {
      connectOpts.password = config.password;
    }
    
    client.connect(connectOpts);
  });
}

function execCommand(ssh: SSHClient, cmd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    ssh.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let stdout = '';
      let stderr = '';
      stream.on('close', (code) => {
        if (code !== 0) {
          return reject(new Error(`Command failed with code ${code}. Stderr: ${stderr}`));
        }
        resolve(stdout.trim());
      });
      stream.on('data', (data) => {
        stdout += data.toString();
      });
      stream.stderr.on('data', (data) => {
        stderr += data.toString();
      });
    });
  });
}

function execCommandWithStdin(ssh: SSHClient, cmd: string, stdinData: string): Promise<string> {
  return new Promise((resolve, reject) => {
    ssh.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let stdout = '';
      let stderr = '';
      
      stream.on('close', (code) => {
        if (code !== 0) {
          return reject(new Error(`Command failed with code ${code}. Stderr: ${stderr}`));
        }
        resolve(stdout.trim());
      });
      stream.on('data', (data) => {
        stdout += data.toString();
      });
      stream.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      // Write the query standard input and terminate the handle nicely
      stream.write(stdinData);
      stream.end();
    });
  });
}

export async function fetchSshPostgresUsers(sshConfig: SSHConfig): Promise<string[]> {
  const ssh = await connectSSH(sshConfig);
  try {
    // Try peer auth using postgres superuser
    const output = await execCommand(ssh, 'sudo -u postgres psql -At -c "SELECT rolname FROM pg_roles WHERE rolcanlogin = true;"');
    const users = output.split('\n').map(u => u.trim()).filter(Boolean);
    if (users.length > 0) return users;
    throw new Error('Empty users list');
  } catch (err: any) {
    try {
      // Try listing without sudo
      const output = await execCommand(ssh, 'psql -At -c "SELECT rolname FROM pg_roles WHERE rolcanlogin = true;"');
      const users = output.split('\n').map(u => u.trim()).filter(Boolean);
      if (users.length > 0) return users;
      throw new Error('Empty users list');
    } catch (err2: any) {
      // Fallback: common postgres users list
      return ['postgres'];
    }
  } finally {
    ssh.end();
  }
}

function interpolateSql(sql: string, params: any[]): string {
  if (!params || params.length === 0) return sql;
  let result = sql;
  for (let i = 0; i < params.length; i++) {
    const val = params[i];
    let escapedVal = 'NULL';
    if (val !== null && val !== undefined) {
      if (typeof val === 'string') {
        escapedVal = "'" + val.replace(/'/g, "''") + "'";
      } else if (typeof val === 'boolean') {
        escapedVal = val ? 'true' : 'false';
      } else if (typeof val === 'number') {
        escapedVal = val.toString();
      } else if (typeof val === 'object') {
        escapedVal = "'" + JSON.stringify(val).replace(/'/g, "''") + "'::jsonb";
      }
    }
    // Match $1, $2, etc. and replace them. Use negative lookahead to prevent replacing $1 in $10.
    const regex = new RegExp('\\$' + (i + 1) + '(?![0-9])', 'g');
    result = result.replace(regex, escapedVal);
  }
  return result;
}

class SshCommandLineClient {
  constructor(private ssh: SSHClient, private pgConfig: PgConfig) {}

  async query(sql: string, params: any[] = []): Promise<{ rows: any[], rowCount: number, fields: any[] }> {
    const interpolated = interpolateSql(sql, params).trim();
    const host = this.pgConfig.host || '127.0.0.1';
    const port = this.pgConfig.port || 5432;
    const user = this.pgConfig.user;
    const db = this.pgConfig.database;
    const password = this.pgConfig.password;

    const isSelect = /select\s|returning\s/i.test(interpolated);

    let queryToRun = interpolated;
    if (isSelect) {
      // Remove trailing semicolon if any
      const cleaned = interpolated.replace(/;+$/, '');
      queryToRun = `SELECT coalesce(json_agg(t), '[]'::json) FROM (${cleaned}) t;`;
    }

    const passEnv = password ? `PGPASSWORD='${password.replace(/'/g, "'\\''")}' ` : '';
    
    // Command base (direct)
    const escapedDb = db.replace(/"/g, '""');
    const escapedUser = user.replace(/"/g, '""');
    
    const psqlCommand = `${passEnv}psql -h ${host} -p ${port} -U "${escapedUser}" -d "${escapedDb}" -At`;
    
    console.log(`[SshCommandLineClient] Executing SQL via SSH Command STDIN: ${psqlCommand}`);
    
    let output = '';
    try {
      output = await execCommandWithStdin(this.ssh, psqlCommand, queryToRun);
    } catch (err: any) {
      console.warn(`[SshCommandLineClient] Direct psql command failed (${err.message}). Trying with sudo -u postgres fallback...`);
      // Try with sudo -u postgres
      try {
        const sudoPsqlCommand = `sudo -u postgres psql -h ${host} -p ${port} -d "${escapedDb}" -At`;
        output = await execCommandWithStdin(this.ssh, sudoPsqlCommand, queryToRun);
      } catch (sudoErr: any) {
        // If that fails too, try with sudo -u pg_user
        try {
          const userSudoPsql = `sudo -u "${escapedUser}" psql -h ${host} -p ${port} -d "${escapedDb}" -At`;
          output = await execCommandWithStdin(this.ssh, userSudoPsql, queryToRun);
        } catch (finalErr: any) {
          throw new Error(`Failed to execute query over SSH CLI. Primary error: ${err.message}. Sudo error: ${sudoErr.message}. Final error: ${finalErr.message}`);
        }
      }
    }

    if (isSelect) {
      try {
        const jsonStr = output.trim() || '[]';
        const rows = JSON.parse(jsonStr);
        return {
          rows,
          rowCount: rows.length,
          fields: Object.keys(rows[0] || {}).map(f => ({ name: f }))
        };
      } catch (e: any) {
        console.error(`[SshCommandLineClient] JSON parse failed on output: "${output}"`, e);
        throw new Error(`psql command succeeded but outputs invalid JSON data. Output: ${output}`);
      }
    } else {
      return {
        rows: [],
        rowCount: 0,
        fields: []
      };
    }
  }
}

export async function withPgClient<T>(
  sshConfig: SSHConfig,
  pgConfig: PgConfig,
  callback: (client: PgClient) => Promise<T>
): Promise<T> {
  console.log(`[withPgClient] Initiating SSH connection to ${sshConfig.host}:${sshConfig.port || 22} using user ${sshConfig.username}`);
  const ssh = await connectSSH(sshConfig);
  console.log(`[withPgClient] SSH connection established successfully!`);
  
  return new Promise<T>(async (resolve, reject) => {
    let finished = false;
    let pgClient: PgClient | null = null;
    let fallbackMode = false;
    let fallbackSshObj: SSHClient | null = null;
    
    // We give the native TCP port forwarding 3.5 seconds to establish and connect.
    // If it fails or takes more than 3.5 seconds, we fallback to SshCommandLineClient (CLI mode).
    const connectTimer = setTimeout(() => {
      if (!finished && !fallbackMode) {
        console.warn(`[withPgClient] Native TCP forwardOut is taking too long (>3.5s). Activating CLI fallback mode...`);
        triggerFallback();
      }
    }, 3500);

    // Ultimate 20-second safety timeout
    const safetyTimeout = setTimeout(() => {
      if (!finished) {
        finished = true;
        console.error(`[withPgClient] Safe timeout reached. Cleaning up...`);
        cleanPgAndConnections();
        reject(new Error('PostgreSQL operation timed out (20 second safety limit reached).'));
      }
    }, 20000);

    const cleanPgAndConnections = () => {
      if (pgClient) {
        try { pgClient.end(); } catch (e) {}
        pgClient = null;
      }
      try { ssh.end(); } catch (e) {}
      if (fallbackSshObj) {
        try { fallbackSshObj.end(); } catch (e) {}
        fallbackSshObj = null;
      }
    };

    const finalCleanup = () => {
      clearTimeout(connectTimer);
      clearTimeout(safetyTimeout);
      finished = true;
      cleanPgAndConnections();
    };

    const triggerFallback = async () => {
      if (finished) return;
      fallbackMode = true;
      if (pgClient) {
        try { pgClient.end(); } catch (e) {}
        pgClient = null;
      }
      // Proactively end the original SSH connection in case it is half-closed or blocked
      try { ssh.end(); } catch (e) {}

      console.log(`[withPgClient CLI Fallback] Connecting a fresh, dedicated SSH connection for CLI query execution...`);
      try {
        fallbackSshObj = await connectSSH(sshConfig);
        console.log(`[withPgClient CLI Fallback] Dedicated SSH connection established! Running database callback via SshCommandLineClient...`);
        
        const fakeClient = new SshCommandLineClient(fallbackSshObj, pgConfig);
        const result = await callback(fakeClient as any);
        finalCleanup();
        resolve(result);
      } catch (err: any) {
        console.error(`[withPgClient CLI Fallback] Fallback execution FAILED:`, err);
        finalCleanup();
        reject(err);
      }
    };

    const destHost = pgConfig.host || '127.0.0.1';
    const destPort = pgConfig.port || 5432;
    console.log(`[withPgClient] Requesting SSH forwardOut to remote destination ${destHost}:${destPort}`);

    ssh.forwardOut(
      '127.0.0.1',
      0,
      destHost,
      destPort,
      (err, stream) => {
        if (err) {
          console.warn(`[withPgClient] SSH forwardOut rejected/failed under TCP: ${err.message}. Direct fallback...`);
          if (!finished && !fallbackMode) {
            triggerFallback();
          }
          return;
        }
        
        if (finished || fallbackMode) {
          try { stream.end(); } catch (e) {}
          return;
        }

        console.log(`[withPgClient] SSH forwardOut stream created successfully!`);

        // Patch socket structures in case pg expects normal Socket features
        if (stream) {
          if (!(stream as any).setNoDelay) {
            (stream as any).setNoDelay = () => {};
          }
          if (!(stream as any).setKeepAlive) {
            (stream as any).setKeepAlive = () => {};
          }
          if ((stream as any).connecting === undefined) {
            (stream as any).connecting = false;
          }
          if (!(stream as any).connect) {
            (stream as any).connect = function(this: any, port: any, host: any, connectCallback?: any) {
              if (typeof connectCallback === 'function') {
                process.nextTick(connectCallback);
              }
              process.nextTick(() => {
                this.emit('connect');
              });
              return this;
            };
          }
        }
        
        pgClient = new PgClient({
          user: pgConfig.user,
          password: pgConfig.password || undefined,
          database: pgConfig.database,
          stream: (() => stream) as any,
          connectionTimeoutMillis: 5000
        });

        pgClient.on('error', (pgErr) => {
          console.warn(`[withPgClient] Postgres client state code: ${pgErr.message}. Triggering CLI fallback...`);
          if (!finished && !fallbackMode) {
            triggerFallback();
          }
        });

        stream.on('error', (streamErr) => {
          console.warn(`[withPgClient] SSH forwardOut stream state code: ${streamErr.message}. Triggering CLI fallback...`);
          if (!finished && !fallbackMode) {
            triggerFallback();
          }
        });

        console.log(`[withPgClient] Connecting node-postgres Client...`);
        pgClient.connect(async (connectErr) => {
          if (connectErr) {
            console.warn(`[withPgClient] Postgres client connect status code: ${connectErr.message}. Triggering CLI fallback...`);
            if (!finished && !fallbackMode) {
              triggerFallback();
            }
            return;
          }
          
          if (finished || fallbackMode) {
            if (pgClient) {
              try { pgClient.end(); } catch (e) {}
              pgClient = null;
            }
            return;
          }

          clearTimeout(connectTimer);
          console.log(`[withPgClient] Postgres client connected successfully! Executing callback...`);
          try {
            const result = await callback(pgClient!);
            console.log(`[withPgClient] Callback executed successfully. Cleaning up...`);
            finalCleanup();
            resolve(result);
          } catch (callbackErr: any) {
            console.error(`[withPgClient] Callback execution FAILED:`, callbackErr);
            finalCleanup();
            reject(callbackErr);
          }
        });
      }
    );
  });
}

export async function runQuery(
  sshConfig: SSHConfig,
  pgConfig: PgConfig,
  sql: string,
  params: any[] = []
): Promise<any> {
  return withPgClient(sshConfig, pgConfig, async (client) => {
    return await client.query(sql, params);
  });
}
