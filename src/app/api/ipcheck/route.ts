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
    const result = await pool.request().query('SELECT * FROM TB_IPCheck');
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
    const { ip, sitename, macaddress, device, location, comment, modifieddate, modifiedby } = await request.json();
    console.log('Received data:', { ip, sitename, macaddress, device, location, comment, modifieddate, modifiedby });

    const pool = await connectToDatabase();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      const request = new sql.Request(transaction);
      request.input('ip', sql.VarChar, ip);
      request.input('sitename', sql.VarChar, sitename);
      request.input('macaddress', sql.VarChar, macaddress);
      request.input('device', sql.VarChar, device);
      request.input('location', sql.VarChar, location);
      request.input('comment', sql.VarChar, comment);
      request.input('modifieddate', sql.DateTime, modifieddate || new Date());
      request.input('modifiedby', sql.VarChar, modifiedby);

      // TB_AssignedIP 
      const assignedIpCheckResult = await request.query(`
        SELECT COUNT(*) as count FROM TB_AssignedIP WHERE ipaddress = @ip
      `);

      if (assignedIpCheckResult.recordset[0].count === 0) {
        // INSERT
        await request.query(`
          INSERT INTO TB_AssignedIP (ipaddress, sitename)
          VALUES (@ip, @sitename)
        `);
      } else {
        // UPDATE
        await request.query(`
          UPDATE TB_AssignedIP
          SET sitename = @sitename
          WHERE ipaddress = @ip
        `);
      }

      // TB_IPCheck 
      const ipCheckResult = await request.query(`
        SELECT COUNT(*) as count FROM TB_IPCheck WHERE ipaddress = @ip
      `);

      if (ipCheckResult.recordset[0].count === 0) {
        // INSERT
        await request.query(`
          INSERT INTO TB_IPCheck (ipaddress, macaddress, device, location, comment, modifieddate, modifiedby)
          VALUES (@ip, @macaddress, @device, @location, @comment, @modifieddate, @modifiedby)
        `);
      } else {
        // UPDATE
        await request.query(`
          UPDATE TB_IPCheck
          SET macaddress = @macaddress,
              device = @device,
              location = @location,
              comment = @comment,
              modifieddate = @modifieddate,
              modifiedby = @modifiedby
          WHERE ipaddress = @ip
        `);
      }

      await transaction.commit();

      return NextResponse.json({ message: 'Data upserted successfully' });
    } catch (error) {
      await transaction.rollback();
      console.error('Database operation error:', error);
      return NextResponse.json(
        { error: 'Failed to upsert data', details: error instanceof Error ? error.message : String(error) },
        { status: 500 }
      );
    }
  });
}

export async function DELETE(request: NextRequest) {
  return handleDatabaseOperation(async () => {
    const { searchParams } = new URL(request.url);
    const ip = searchParams.get('ip');

    if (!ip) {
      return NextResponse.json({ error: 'IP address is required' }, { status: 400 });
    }

    const pool = await connectToDatabase();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      const request = new sql.Request(transaction);
      request.input('ip', sql.VarChar, ip);

      // Delete from TB_IPCheck
      await request.query('DELETE FROM TB_IPCheck WHERE ipaddress = @ip');

      // Delete from TB_AssignedIP
      await request.query('DELETE FROM TB_AssignedIP WHERE ipaddress = @ip');

      await transaction.commit();

      return NextResponse.json({ message: 'IP deleted successfully' });
    } catch (error) {
      await transaction.rollback();
      console.error('Database operation error:', error);
      return NextResponse.json(
        { error: 'Failed to delete IP', details: error instanceof Error ? error.message : String(error) },
        { status: 500 }
      );
    }
  });
}