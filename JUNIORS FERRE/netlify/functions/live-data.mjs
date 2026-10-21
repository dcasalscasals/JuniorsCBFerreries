const MATCHES_URL = 'https://esb.optimalwayconsulting.com/fbib/1/jR4rgA5K6Chhh5vyfrxo9wTScdg2NT7K/Match/getByTeamAllSeason/10454';
const REFERENCE_SITE = process.env.REFERENCE_SITE || 'https://juniorascferre.netlify.app';
const TEAM_ID = 10454;

function decodeMatches(payload) {
  if (payload && typeof payload === 'object') return payload;
  const text = String(payload || '').trim();
  try { return JSON.parse(text); } catch {}
  try { return JSON.parse(Buffer.from(text, 'base64').toString('utf8')); } catch {}
  throw new Error('La respuesta de FBIB no contiene JSON reconocible');
}

function num(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function mapMatch(match) {
  const home = Number(match.idLocalTeam) === TEAM_ID;
  const played = match.idMatchResult !== null && match.idMatchResult !== undefined && match.idMatchResult !== '';
  const localScore = num(match.localScore);
  const visitorScore = num(match.visitorScore);
  const opponent = home ? match.nameVisitorTeam : match.nameLocalTeam;
  return {
    id: match.universallyid || match.idMatch,
    date: match.matchDay || match.date || '',
    round: match.numMatchDay || '',
    opponent: opponent || 'Rival por confirmar',
    home,
    teamScore: played ? (home ? localScore : visitorScore) : null,
    opponentScore: played ? (home ? visitorScore : localScore) : null,
    status: played ? 'jugado' : 'pendiente',
    played,
    venue: match.nameField || '',
    competitionId: match.idCompetition,
    groupId: match.idGroup,
    matchUrl: match.idMatch ? `https://www.fbib.es/partido/${match.idMatch}` : ''
  };
}

function mapPlayer(player) {
  return {
    name: player.name || player.namePlayer || 'Jugador', dorsal: player.dorsal ?? '',
    games: Number(player.matchesPlayed || 0), minutes: Number(player.timePlayed || 0),
    points: Number(player.totalScore || 0),
    twoMade: Number(player.sumShotsOfTwoSuccessful || 0), twoAttempted: Number(player.sumShotsOfTwoAttempted || 0),
    threeMade: Number(player.sumShotsOfThreeSuccessful || 0), threeAttempted: Number(player.sumShotsOfThreeAttempted || 0),
    ftMade: Number(player.sumShotsOfOneSuccessful || 0), ftAttempted: Number(player.sumShotsOfOneAttempted || 0),
    rebounds: Number(player.sumRebounds || 0), assists: Number(player.sumAssists || 0),
    turnovers: Number(player.sumLost || 0), fouls: Number(player.sumFouls || 0),
    efficiency: Number(player.sumValoration || 0),
    pointsPerGame: Number(player.totalScoreAvgByMatch || 0)
  };
}

async function json(url) {
  const response = await fetch(url, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`Fuente externa respondió ${response.status}`);
  return response.json();
}

export default async () => {
  try {
    const [matchesResponse, playersResponse] = await Promise.all([
      fetch(MATCHES_URL, { headers: { accept: 'application/json, text/plain, */*' }, signal: AbortSignal.timeout(15000) }).then(async response => {
        if (!response.ok) throw new Error(`FBIB respondió ${response.status}`);
        return decodeMatches(await response.text());
      }),
      json(`${REFERENCE_SITE}/api/ferreries-players`)
    ]);
    const rawMatches = Array.isArray(matchesResponse) ? matchesResponse : (matchesResponse.messageData || matchesResponse.data || matchesResponse.matches || []);
    const matches = rawMatches.filter(m => Number(m.idLocalTeam) === TEAM_ID || Number(m.idVisitorTeam) === TEAM_ID)
      .map(mapMatch).sort((a, b) => String(a.date).localeCompare(String(b.date)) || Number(a.round) - Number(b.round));
    const players = (playersResponse.players || playersResponse.data?.players || []).map(mapPlayer);
    return Response.json({ team: playersResponse.team || { name: 'CB Ferreries' }, matches, players, updatedAt: new Date().toISOString() }, {
      headers: { 'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=300' }
    });
  } catch (error) {
    return Response.json({ error: 'No se pudieron actualizar los datos federativos', detail: error.message }, { status: 502 });
  }
};
