import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import sql from 'mssql';

async function handleDatabaseOperation(operation: () => Promise<any>) {
  let pool: sql.ConnectionPool | null = null;
  try {
    pool = await connectToDatabase();
    return await operation();
  } catch (error) {
    console.error('Database operation error:', error);
    throw error;
  } finally {
    if (pool) await pool.close();
  }
}

export async function GET() {
  return handleDatabaseOperation(async () => {
    const pool = await connectToDatabase();
    const result = await pool.request().query('SELECT * FROM TB_Site');
    return NextResponse.json(result.recordset);
  }).catch(error => 
    NextResponse.json(
      { error: 'Failed to fetch data', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  );
}

export async function POST(request: NextRequest) {
  return handleDatabaseOperation(async () => {
    const { sitename, sitefullname } = await request.json(); 
    const pool = await connectToDatabase();

    const query = `
      MERGE TB_Site AS target
      USING (VALUES (@sitename, @sitefullname)) AS source (sitename, sitefullname)
      ON target.sitename = source.sitename
      WHEN MATCHED THEN
        UPDATE SET sitefullname = source.sitefullname
      WHEN NOT MATCHED THEN
        INSERT (sitename, sitefullname)
        VALUES (source.sitename, source.sitefullname);
    `;

    const result = await pool.request()
      .input('sitename', sql.VarChar, sitename)
      .input('sitefullname', sql.VarChar, sitefullname)  
      .query(query);
    
    return NextResponse.json({ message: 'Data upserted successfully', affectedRows: result.rowsAffected[0] });
  }).catch(error => 
    NextResponse.json(
      { error: 'Failed to upsert data', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  );
}

export async function DELETE(request: NextRequest) {
  return handleDatabaseOperation(async () => {
    const { sitename } = await request.json();
    const pool = await connectToDatabase();

    const query = `
      DELETE FROM TB_Site
      WHERE sitename = @sitename
    `;

    const result = await pool.request()
      .input('sitename', sql.VarChar, sitename)
      .query(query);
    
    if (result.rowsAffected[0] === 0) {
      return NextResponse.json({ message: 'Site not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Site deleted successfully', affectedRows: result.rowsAffected[0] });
  }).catch(error => 
    NextResponse.json(
      { error: 'Failed to delete site', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  );
}