import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db'; 
import sql from 'mssql';


export async function GET(request: Request){
    let pool: sql.ConnectionPool | null = null;
    
    try{
        pool = await connectToDatabase();
        const result = await pool.request().query(`SELECT * FROM TB_AssignedIP`);
        return NextResponse.json(result.recordset);
    } catch (error){
        console.error('Error fetching data: ', error);
        return NextResponse.json(
            { error: 'Failed to fetch data', details: error instanceof Error? error.message : String(error)},
            { status: 500 }
        );
    } finally {
        if (pool){
            await pool.close();
        }
    }
}



export async function POST(request: Request) {
    let pool: sql.ConnectionPool | null = null;
    try {
        const { sitename, ipaddress } = await request.json();
        pool = await connectToDatabase();

        const result = await pool.request()
            .input('sitename', sql.VarChar, sitename)
            .input('ipaddress', sql.VarChar, ipaddress)
            .query(`
                MERGE TB_AssignedIP AS target
                USING (VALUES (@sitename, @ipaddress)) AS source (sitename, ipaddress)
                ON target.ipaddress = source.ipaddress
                WHEN MATCHED THEN
                    UPDATE SET sitename = source.sitename
                WHEN NOT MATCHED THEN
                    INSERT (sitename, ipaddress)
                    VALUES (source.sitename, source.ipaddress);
            `);

        return NextResponse.json({ message: 'Data upserted successfully', affectedRows: result.rowsAffected[0] });
    } catch (error) {
        console.error('Server error:', error);
        return NextResponse.json(
            { error: 'Failed to upsert data', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    } finally {
        if (pool) {
            await pool.close();
        }
    }
}
    
export async function DELETE(request: Request) {
    let pool: sql.ConnectionPool | null = null;
    try {
        const { ipaddress } = await request.json();
        pool = await connectToDatabase();

        const result = await pool.request()
            .input('ipaddress', sql.VarChar, ipaddress)
            .query('DELETE FROM TB_AssignedIP WHERE ipaddress = @ipaddress');

        if (result.rowsAffected[0] > 0) {
            return NextResponse.json({ message: 'IP address deleted successfully' });
        } else {
            return NextResponse.json({ message: 'IP address not found' }, { status: 404 });
        }
    } catch (error) {
        console.error('Error deleting data:', error);
        return NextResponse.json(
            { error: 'Failed to delete data', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    } finally {
        if (pool) {
            await pool.close();
        }
    }
}