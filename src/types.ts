export interface SSHConfig {
  host: string;
  port: number;
  username: string;
  password?: string;
  privateKey?: string;
  authMethod: 'password' | 'privateKey';
}

export interface PgConfig {
  user: string;
  password?: string;
  database: string;
  host?: string;
  port?: number;
}

export interface ColumnInfo {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
  character_maximum_length: number | null;
  references?: string | null;
}

export type Theme = 'slate' | 'cyber';
