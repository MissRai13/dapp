import { NextResponse } from 'next/server';

const LOCAL_HARDHAT_RPC_URL = 'http://127.0.0.1:8545';
const RPC_PROXY_HEADERS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'POST, GET, OPTIONS',
  'access-control-allow-headers': 'content-type',
};

const getRpcUrl = () => {
  const configuredUrl = process.env.NEXT_SERVER_RPC_URL || process.env.NEXT_PUBLIC_RPC_URL;

  if (!configuredUrl || configuredUrl.startsWith('/')) {
    return LOCAL_HARDHAT_RPC_URL;
  }

  return configuredUrl;
};

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const response = await fetch(getRpcUrl(), {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body,
      cache: 'no-store',
    });

    const text = await response.text();

    return new NextResponse(text, {
      status: response.status,
      headers: {
        ...RPC_PROXY_HEADERS,
        'content-type': response.headers.get('content-type') || 'application/json',
        'cache-control': 'no-store',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'RPC proxy failed';

    return NextResponse.json(
      {
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32000,
          message,
        },
      },
      {
        status: 502,
        headers: RPC_PROXY_HEADERS,
      }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      message: 'Crowdfunding DApp RPC proxy is running. Send JSON-RPC requests with POST.',
    },
    {
      headers: RPC_PROXY_HEADERS,
    }
  );
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: RPC_PROXY_HEADERS,
  });
}
