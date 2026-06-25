const axios = require('axios');
const { TFL_BASE_URL, TFL_TIMEOUT_MS } = require('../config');

// Accepts 300 (TfL disambiguation) as a valid status rather than throwing.
const httpClient = axios.create({
  baseURL: TFL_BASE_URL,
  timeout: TFL_TIMEOUT_MS,
  validateStatus: s => (s >= 200 && s < 300) || s === 300,
});

module.exports = httpClient;
