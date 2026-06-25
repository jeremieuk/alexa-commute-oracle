// TfL statusSeverity 10 = "Good Service" (no disruption).
// Values < 10 indicate some level of disruption; ≤ 6 = Severe Delays or worse.
// We drop journeys that have any leg with a disrupted status on the primary line.
const SEVERE_THRESHOLD = 6;

/**
 * Given a TfL journeys array, return the best viable option.
 *
 * @returns {{ journey: object|null, disruptedLineNames: string[], allDisrupted: boolean }}
 */
function filterJourneys(journeys) {
  const disruptedLineNames = new Set();
  const viable = [];

  for (const journey of journeys) {
    let journeyDisrupted = false;

    for (const leg of journey.legs || []) {
      for (const disruption of leg.disruptions || []) {
        if (typeof disruption.severity === 'number' && disruption.severity <= SEVERE_THRESHOLD) {
          if (disruption.affectedRoutes) {
            for (const route of disruption.affectedRoutes) {
              if (route.name) disruptedLineNames.add(route.name);
            }
          }
          journeyDisrupted = true;
        }
      }
      // Also check lineModeGroups / lineStatuses on the leg's routeOptions
      for (const routeOpt of leg.routeOptions || []) {
        for (const lineStatus of routeOpt.lineStatuses || []) {
          if (
            typeof lineStatus.statusSeverity === 'number' &&
            lineStatus.statusSeverity <= SEVERE_THRESHOLD
          ) {
            if (routeOpt.name) disruptedLineNames.add(routeOpt.name);
            journeyDisrupted = true;
          }
        }
      }
    }

    if (!journeyDisrupted) viable.push(journey);
  }

  const allDisrupted = viable.length === 0;
  const journey = viable.length > 0 ? viable[0] : (journeys[0] || null);

  return {
    journey,
    disruptedLineNames: [...disruptedLineNames],
    allDisrupted,
  };
}

module.exports = { filterJourneys };
