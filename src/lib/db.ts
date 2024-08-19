import sql from 'mssql';

function assertEnv(varName: string): string {
  const value = process.env[varName];
  if (!value) {
    throw new Error(`Environment variable ${varName} is not set`);
  }
  return value;
}

const config: sql.config = {
  user: assertEnv('DB_USER'),
  password: assertEnv('DB_PASSWORD'),
  server: assertEnv('DB_SERVER'),
  database: assertEnv('DB_NAME'),
  options: {
    trustServerCertificate: true,
  },
};

export async function connectToDatabase(): Promise<sql.ConnectionPool> {
  console.log('Connecting to database with config:', JSON.stringify(config, null, 2));
  try {
    const pool = new sql.ConnectionPool(config);
    await pool.connect();
    console.log('Database connection successful');
    return pool;
  } catch (err: unknown) {
    console.error('Database connection failed:', err);
    let errorMessage = 'Failed to connect to database';
    if (err instanceof Error) {
      errorMessage = err.message;
    }
    throw new Error(errorMessage);
  }
}