const axios = require('axios');
const MockAdapter = require('axios-mock-adapter');
const { planJourney } = require('../services/tflService');
const normalJourney = require('./mocks/normal_journey.json');
const disruptedJourney = require('./mocks/disrupted_journey.json');
const ambiguous300 = require('./mocks/ambiguous_300.json');
const noJourney = require('./mocks/no_journey.json');

// Mock the shared axios instance
const httpClient = require('../util/httpClient');
const mock = new MockAdapter(httpClient);

const FROM = 'SW9 8JH';
const TO = "King's Cross";
const URL_RE = /\/Journey\/JourneyResults\/.+\/to\/.+/;

afterEach(() => mock.reset());

test('returns ok with journeys on 200', async () => {
  mock.onGet(URL_RE).reply(200, normalJourney);
  const result = await planJourney({ from: FROM, to: TO });
  expect(result.status).toBe('ok');
  expect(result.journeys).toHaveLength(1);
});

test('returns ambiguous on HTTP 300 with toLocationDisambiguation', async () => {
  mock.onGet(URL_RE).reply(300, ambiguous300);
  const result = await planJourney({ from: FROM, to: 'Dishoom' });
  expect(result.status).toBe('ambiguous');
  expect(result.side).toBe('to');
  expect(result.toOptions).toHaveLength(3);
});

test('returns no_results when journeys array is empty', async () => {
  mock.onGet(URL_RE).reply(200, noJourney);
  const result = await planJourney({ from: FROM, to: TO });
  expect(result.status).toBe('no_results');
});

test('returns no_results on 404', async () => {
  mock.onGet(URL_RE).reply(404);
  const result = await planJourney({ from: FROM, to: TO });
  expect(result.status).toBe('no_results');
});

test('returns rate_limited on 429', async () => {
  mock.onGet(URL_RE).reply(429);
  const result = await planJourney({ from: FROM, to: TO });
  expect(result.status).toBe('error');
  expect(result.message).toBe('rate_limited');
});

test('passes timeIs=Arriving when arriveBy is set', async () => {
  mock.onGet(URL_RE).reply(config => {
    expect(config.url).toContain('timeIs=Arriving');
    expect(config.url).toContain('time=0900');
    return [200, normalJourney];
  });
  const result = await planJourney({ from: FROM, to: TO, arriveBy: '09:00' });
  expect(result.status).toBe('ok');
});

test('URI-encodes from and to path segments', async () => {
  mock.onGet(URL_RE).reply(config => {
    expect(config.url).not.toContain("King's Cross");
    return [200, normalJourney];
  });
  await planJourney({ from: FROM, to: "King's Cross" });
});

test('returns error on network failure', async () => {
  mock.onGet(URL_RE).networkError();
  const result = await planJourney({ from: FROM, to: TO });
  expect(result.status).toBe('error');
});
