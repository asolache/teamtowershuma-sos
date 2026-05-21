// ============================================================
//  netlify/edge-functions/openai-proxy.js
//  TeamTowers SOS V11 — Edge Function proxy OpenAI (v160.2)
//  Mateix patró que anthropic-proxy.js · CORS-safe browser→API
// ============================================================

export default async (request, context) => {
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: {
                'Access-Control-Allow-Origin':  '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            }
        });
    }
    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
    }

    let body;
    try { body = await request.json(); }
    catch {
        return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
    }

    const { apiKey, ...openaiPayload } = body;
    if (!apiKey || apiKey.length < 10) {
        return new Response(JSON.stringify({ error: 'Missing or invalid API key' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
    }

    try {
        const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
            method:  'POST',
            headers: {
                'Content-Type':  'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify(openaiPayload),
        });
        return new Response(upstream.body, {
            status: upstream.status,
            headers: {
                'Content-Type':                upstream.headers.get('content-type') || 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: `Proxy error: ${err.message}` }), {
            status: 502,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
    }
};

export const config = { path: '/api/openai-proxy' };
