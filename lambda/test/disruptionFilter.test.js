const { filterJourneys } = require('../services/disruptionFilter');
const normalJourney = require('./mocks/normal_journey.json');
const disruptedJourney = require('./mocks/disrupted_journey.json');

test('returns first journey when no disruptions', () => {
  const { journey, disruptedLineNames, allDisrupted } = filterJourneys(normalJourney.journeys);
  expect(journey).toBe(normalJourney.journeys[0]);
  expect(disruptedLineNames).toHaveLength(0);
  expect(allDisrupted).toBe(false);
});

test('skips disrupted journey and returns next viable option', () => {
  const { journey, disruptedLineNames, allDisrupted } = filterJourneys(disruptedJourney.journeys);
  // First journey has Victoria line with severity 3 — should be skipped
  expect(journey).toBe(disruptedJourney.journeys[1]);
  expect(disruptedLineNames).toContain('Victoria');
  expect(allDisrupted).toBe(false);
});

test('flags allDisrupted when every journey is disrupted', () => {
  const allBad = disruptedJourney.journeys.map(j => ({
    ...j,
    legs: j.legs.map(l => ({
      ...l,
      routeOptions: (l.routeOptions || []).map(r => ({
        ...r,
        lineStatuses: (r.lineStatuses || []).map(s => ({ ...s, statusSeverity: 3 })),
      })),
    })),
  }));
  const { allDisrupted } = filterJourneys(allBad);
  expect(allDisrupted).toBe(true);
});

test('handles empty journeys array without throwing', () => {
  const { journey } = filterJourneys([]);
  expect(journey).toBeNull();
});
