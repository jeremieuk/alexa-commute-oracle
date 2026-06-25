// TfL key: sourced from env locally (.env); in Alexa-hosted CodeCommit, set
// process.env.TFL_APP_KEY in the repo or commit the key here directly.
// If sensitivity rises, read from S3 at cold start instead — see README.
const TFL_APP_KEY = process.env.TFL_APP_KEY || '';

if (!TFL_APP_KEY) {
  console.warn('[config] TFL_APP_KEY is not set — TfL calls will fail');
}

module.exports = {
  TFL_APP_KEY,
  TFL_BASE_URL: 'https://api.tfl.gov.uk',
  TFL_TIMEOUT_MS: 4000,
};
