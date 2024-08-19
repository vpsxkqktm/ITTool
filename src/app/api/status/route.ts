import { NextResponse } from 'next/server';
import ping from 'ping';

interface IPStatus {
  ip: string;
  alive: boolean;
  time?: number | "unknown";
  min?: string;
  max?: string;
  avg?: string | undefined;
  packetLoss?: string | undefined;
}

async function pingIP(ip: string): Promise<IPStatus> {
  try {
    const result = await ping.promise.probe(ip);
    return {
      ip: result.host,
      alive: result.alive,
      time: result.time === "unknown" ? "unknown" : Number(result.time),
      min: result.min,
      max: result.max,
      avg: result.avg === undefined ? "-" : Math.round(parseFloat(result.avg)).toString(),
      packetLoss: result.packetLoss === undefined ? "-" : Math.round(parseFloat(result.packetLoss)).toString(),
    };
  } catch (error) {
    console.error('Ping error:', error);
    return { ip, alive: false };
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ipRange = searchParams.get('ipRange');

  if (ipRange?.includes("num")) {
    const ip = [ipRange.substring(3,)]
    try {
      const results = await Promise.all(ip.map(pingIP));
      console.log(results)
      return NextResponse.json(results);
    } catch (error) {
      console.error('Failed to check IPs:', error);
      return NextResponse.json({ error: 'Failed to check IPs' }, { status: 500 });
    }
  } else {
    const ips = Array.from({ length: 254 }, (_, i) => `${ipRange}.${i + 1}`);

    try {
      const results = await Promise.all(ips.map(pingIP));
      return NextResponse.json(results);
    } catch (error) {
      console.error('Failed to check IPs:', error);
      return NextResponse.json({ error: 'Failed to check IPs' }, { status: 500 });
    }
  }
}