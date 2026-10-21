const REFERENCE_SITE = process.env.REFERENCE_SITE || 'https://juniorascferre.netlify.app';

export default async request => {
  const id = new URL(request.url).searchParams.get('id') || '';
  if (!/^[a-zA-Z0-9_-]{8,64}$/.test(id)) return Response.json({ error: 'Identificador de partido no válido' }, { status: 400 });
  try {
    const upstream = await fetch(`${REFERENCE_SITE}/api/ferreries-match/${encodeURIComponent(id)}?currentSeason=true`, {
      headers: { accept: 'application/json' }, signal: AbortSignal.timeout(15000)
    });
    if (!upstream.ok) throw new Error(`Fuente de actas respondió ${upstream.status}`);
    return new Response(await upstream.text(), { status: 200, headers: {
      'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=300'
    }});
  } catch (error) {
    return Response.json({ error: 'No se pudo obtener el acta del partido', detail: error.message }, { status: 502 });
  }
};
