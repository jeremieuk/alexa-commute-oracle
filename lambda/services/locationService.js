const { planJourney } = require('./tflService');

const HOME_ATTRIBUTE = 'homePostcode';

/**
 * Resolve the user's origin for a journey.
 *
 * Resolution order:
 *   1. Persisted home postcode (DynamoDB via persistent attributes)
 *   2. Device Address API (country_and_postal_code scope)
 *   3. Neither → return { status: 'needsOnboarding' }
 *
 * @returns {Promise<
 *   | { status: 'ok', origin: string }
 *   | { status: 'needsPermission' }
 *   | { status: 'needsOnboarding' }
 *   | { status: 'error', message: string }
 * >}
 */
async function resolveOrigin(handlerInput) {
  // 1. Check persisted home
  try {
    const attrs = await handlerInput.attributesManager.getPersistentAttributes();
    if (attrs && attrs[HOME_ATTRIBUTE]) {
      return { status: 'ok', origin: attrs[HOME_ATTRIBUTE] };
    }
  } catch (_) {
    // persistence unavailable locally — continue
  }

  // 2. Device Address API
  const { requestEnvelope, serviceClientFactory } = handlerInput;
  if (!serviceClientFactory) {
    return { status: 'needsOnboarding' };
  }

  try {
    const deviceId = requestEnvelope.context.System.device.deviceId;
    const client = serviceClientFactory.getDeviceAddressServiceClient();
    const address = await client.getCountryAndPostalCode(deviceId);

    if (address && address.postalCode) {
      return { status: 'ok', origin: address.postalCode };
    }
    // Consent granted but no address registered
    return { status: 'needsOnboarding' };
  } catch (err) {
    const code = err.statusCode || (err.response && err.response.status);
    if (code === 403) return { status: 'needsPermission' };
    return { status: 'error', message: err.message || 'address_lookup_failed' };
  }
}

/**
 * Validate a postcode/place via TfL (by using it as a from- origin to itself)
 * and persist it if valid.
 *
 * @returns {Promise<{ status: 'ok' } | { status: 'invalid' } | { status: 'error', message: string }>}
 */
async function setHome(handlerInput, location) {
  const result = await planJourney({ from: location, to: location });
  // TfL returns no_results or ambiguous if from is unrecognised
  if (result.status === 'error') return result;
  if (result.status === 'no_results') return { status: 'invalid' };

  try {
    const attrs = await handlerInput.attributesManager.getPersistentAttributes();
    attrs[HOME_ATTRIBUTE] = location;
    handlerInput.attributesManager.setPersistentAttributes(attrs);
    await handlerInput.attributesManager.savePersistentAttributes();
  } catch (err) {
    return { status: 'error', message: 'persistence_failed' };
  }
  return { status: 'ok' };
}

/**
 * Delete the persisted home address (GDPR / SkillDisabled purge path).
 */
async function deleteHome(handlerInput) {
  try {
    const attrs = await handlerInput.attributesManager.getPersistentAttributes();
    delete attrs[HOME_ATTRIBUTE];
    handlerInput.attributesManager.setPersistentAttributes(attrs);
    await handlerInput.attributesManager.savePersistentAttributes();
  } catch (_) {}
}

module.exports = { resolveOrigin, setHome, deleteHome, HOME_ATTRIBUTE };
