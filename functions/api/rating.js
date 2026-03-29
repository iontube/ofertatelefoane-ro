export async function onRequestGet(context) {
  const { env } = context;
  const total = parseInt(await env.RATINGS.get('rating_total')) || 0;
  const count = parseInt(await env.RATINGS.get('rating_count')) || 0;
  const avg = count > 0 ? (total / count).toFixed(1) : '0';

  return new Response(JSON.stringify({ avg, count, total }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  });
}

export async function onRequestPost(context) {
  const { env, request } = context;

  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const voted = await env.RATINGS.get('vote_' + ip);
  if (voted) {
    return new Response(JSON.stringify({ error: 'already_voted' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'invalid_body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const value = parseInt(body.value);
  if (!value || value < 1 || value > 5) {
    return new Response(JSON.stringify({ error: 'invalid_value' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const total = parseInt(await env.RATINGS.get('rating_total')) || 0;
  const count = parseInt(await env.RATINGS.get('rating_count')) || 0;

  const newTotal = total + value;
  const newCount = count + 1;

  await env.RATINGS.put('rating_total', String(newTotal));
  await env.RATINGS.put('rating_count', String(newCount));
  await env.RATINGS.put('vote_' + ip, String(value), { expirationTtl: 365 * 24 * 60 * 60 });

  const avg = (newTotal / newCount).toFixed(1);

  return new Response(JSON.stringify({ avg, count: newCount, total: newTotal }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
