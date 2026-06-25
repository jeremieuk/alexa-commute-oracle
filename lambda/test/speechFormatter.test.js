const { formatJourney } = require('../services/speechFormatter');
const normalJourney = require('./mocks/normal_journey.json');
const disruptedJourney = require('./mocks/disrupted_journey.json');

test('formats a clean journey into a spoken string', () => {
  const speech = formatJourney(normalJourney.journeys[0]);
  expect(speech).toMatch(/leave at/i);
  expect(speech).toMatch(/arrive at/i);
  expect(speech).toMatch(/minute/i);
  expect(speech).not.toMatch(/disruption/i);
});

test('includes disruption note when lines are disrupted', () => {
  const speech = formatJourney(
    disruptedJourney.journeys[1],
    ['Victoria'],
    false
  );
  expect(speech).toMatch(/Victoria/);
  expect(speech).toMatch(/disruption/i);
  expect(speech).toMatch(/alternative/i);
});

test('uses all-disrupted copy when no good option exists', () => {
  const speech = formatJourney(
    disruptedJourney.journeys[0],
    ['Victoria', 'Northern'],
    true
  );
  expect(speech).toMatch(/best option available/i);
});

test('does not throw for a journey missing optional fields', () => {
  const minimal = {
    startDateTime: '2024-09-10T08:00:00',
    arrivalDateTime: '2024-09-10T08:30:00',
    duration: 30,
    legs: [],
  };
  expect(() => formatJourney(minimal)).not.toThrow();
});
