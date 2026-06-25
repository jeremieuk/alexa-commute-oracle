/**
 * All voice copy lives here so it can be tuned without touching business logic.
 */

/**
 * Format a TfL journey into a natural spoken SSML string.
 *
 * @param {object} journey      - single TfL journey object (from journeys[])
 * @param {string[]} disruptedLines - line names with severe disruptions (may be empty)
 * @param {boolean} allDisrupted - true if every option is disrupted
 */
function formatJourney(journey, disruptedLines = [], allDisrupted = false) {
  const leaveAt = formatTime(journey.startDateTime);
  const arriveAt = formatTime(journey.arrivalDateTime);
  const durationMins = journey.duration;

  const legDescriptions = buildLegDescriptions(journey.legs || []);

  let disruptionPrefix = '';
  if (disruptedLines.length > 0) {
    const lineList = naturalList(disruptedLines);
    if (allDisrupted) {
      disruptionPrefix = `There are disruptions on ${lineList}, but here's the best option available. `;
    } else {
      disruptionPrefix = `There are disruptions on ${lineList}, so I've found you an alternative. `;
    }
  }

  return (
    `${disruptionPrefix}` +
    `You need to leave at ${leaveAt}. ` +
    `${legDescriptions} ` +
    `You'll arrive at ${arriveAt}, in about ${durationMins} minute${durationMins === 1 ? '' : 's'}.`
  );
}

function buildLegDescriptions(legs) {
  const parts = [];
  for (const leg of legs) {
    const mode = (leg.mode && leg.mode.name) || 'transport';
    const instruction = leg.instruction && leg.instruction.summary;

    if (instruction) {
      parts.push(instruction);
      continue;
    }

    const lineName = leg.routeOptions && leg.routeOptions[0] && leg.routeOptions[0].name;
    const from = leg.departurePoint && leg.departurePoint.commonName;
    const to = leg.arrivalPoint && leg.arrivalPoint.commonName;

    if (mode === 'walking') {
      parts.push(`Walk${from ? ` from ${from}` : ''}${to ? ` to ${to}` : ''}`);
    } else if (lineName) {
      parts.push(`Take the ${lineName}${from ? ` from ${from}` : ''}${to ? ` to ${to}` : ''}`);
    } else {
      parts.push(`Take ${mode}${from ? ` from ${from}` : ''}${to ? ` to ${to}` : ''}`);
    }
  }
  return parts.join(', then ') + '.';
}

function formatTime(isoString) {
  if (!isoString) return 'unknown time';
  const d = new Date(isoString);
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  const period = h < 12 ? 'A M' : 'P M';
  const h12 = h % 12 || 12;
  return `${h12}:${m} ${period}`;
}

function naturalList(items) {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  return items.slice(0, -1).join(', ') + ' and ' + items[items.length - 1];
}

module.exports = { formatJourney };
