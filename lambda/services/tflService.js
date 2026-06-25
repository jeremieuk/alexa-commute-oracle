const httpClient = require('../util/httpClient');
const { TFL_APP_KEY } = require('../config');

/**
 * Plan a journey via TfL.
 *
 * @param {object} opts
 * @param {string} opts.from - postcode, "lat,lng", or place name (will be URI-encoded)
 * @param {string} opts.to   - same formats as from
 * @param {string} [opts.arriveBy] - HH:MM (24h) if the user named an arrival time
 * @param {string} [opts.date]     - yyyyMMdd; defaults to today on TfL side
 *
 * @returns {Promise<
 *   | {status: 'ok',         journeys: object[]}
 *   | {status: 'ambiguous',  side: 'from'|'to'|'both', fromOptions?: object[], toOptions?: object[]}
 *   | {status: 'no_results'}
 *   | {status: 'error',      message: string}
 * >}
 */
async function planJourney({ from, to, arriveBy, date }) {
  const params = new URLSearchParams({ app_key: TFL_APP_KEY });

  if (arriveBy) {
    // Strip colon so "09:00" → "0900"
    params.set('timeIs', 'Arriving');
    params.set('time', arriveBy.replace(':', ''));
    if (date) params.set('date', date);
  }

  const url = `/Journey/JourneyResults/${encodeURIComponent(from)}/to/${encodeURIComponent(to)}?${params}`;

  let response;
  try {
    response = await httpClient.get(url);
  } catch (err) {
    const status = err.response ? err.response.status : 'network';
    if (status === 429) return { status: 'error', message: 'rate_limited' };
    if (status === 404) return { status: 'no_results' };
    return { status: 'error', message: err.message || 'unknown' };
  }

  if (response.status === 300) {
    return parseDisambiguation(response.data);
  }

  const journeys = response.data && response.data.journeys;
  if (!journeys || journeys.length === 0) return { status: 'no_results' };

  return { status: 'ok', journeys };
}

// Modes considered when resolving a spoken place name to a TfL stop.
const TFL_STOP_MODES = 'tube,dlr,overground,elizabeth-line,national-rail,tram';

/**
 * Resolve a free-text place/station name to a single TfL stop via StopPoint
 * search. Returns the stop's coordinate (which always plans journeys cleanly)
 * plus its canonical display name, or null if nothing matches.
 *
 * @param {string} query
 * @returns {Promise<{ coordinate: string, name: string } | null>}
 */
async function resolveStopPoint(query) {
  const params = new URLSearchParams({ app_key: TFL_APP_KEY, modes: TFL_STOP_MODES });
  const url = `/StopPoint/Search/${encodeURIComponent(query)}?${params}`;

  let response;
  try {
    response = await httpClient.get(url);
  } catch (err) {
    return null;
  }

  const matches = response.data && response.data.matches;
  if (!matches || matches.length === 0) return null;

  const top = matches[0];
  if (typeof top.lat !== 'number' || typeof top.lon !== 'number') return null;

  return { coordinate: `${top.lat},${top.lon}`, name: top.name };
}

function parseDisambiguation(data) {
  const fromOpts = data.fromLocationDisambiguation
    ? data.fromLocationDisambiguation.disambiguationOptions
    : null;
  const toOpts = data.toLocationDisambiguation
    ? data.toLocationDisambiguation.disambiguationOptions
    : null;

  const side = fromOpts && toOpts ? 'both' : fromOpts ? 'from' : 'to';
  return {
    status: 'ambiguous',
    side,
    fromOptions: fromOpts || undefined,
    toOptions: toOpts || undefined,
  };
}

module.exports = { planJourney, resolveStopPoint };
