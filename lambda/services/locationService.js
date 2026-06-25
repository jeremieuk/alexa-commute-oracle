const { planJourney, resolveStopPoint } = require('./tflService');

const HOME_ATTRIBUTE = 'homePostcode'; // stores a postcode or a "lat,lon" coordinate
const HOME_NAME_ATTRIBUTE = 'homeName'; // human-friendly display name for confirmations

// A stable, unambiguous point used only to probe whether a free-text location
// geocodes to a plannable journey (full postcodes resolve directly).
const CENTRAL_LONDON = '51.5074,-0.1278';

/**
 * Resolve the user's origin for a journey.
 *
 * Voice set-home is the PRIMARY onboarding path. We do NOT request the Device
 * Address API / emit a permissions consent card here, because the device-address
 * permission is not declared in the skill manifest (it is enabled separately via
 * the console Permissions tab). Emitting a consent card for an undeclared
 * permission makes Alexa reject the whole response as invalid.
 *
 * Resolution order:
 *   1. Persisted home postcode (DynamoDB via persistent attributes)
 *   2. None → { status: 'needsOnboarding' } so the flow runs a spoken set-home dialog
 *
 * @returns {Promise<
 *   | { status: 'ok', origin: string }
 *   | { status: 'needsOnboarding' }
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
    // persistence unavailable — treat as no home set, fall through to onboarding
  }

  // 2. No persisted home → voice onboarding (primary path).
  return { status: 'needsOnboarding' };
}

/**
 * Resolve a spoken home location to something TfL can plan from, then persist it.
 *
 * Resolution:
 *   1. StopPoint search — named stations/places resolve to a canonical stop; we
 *      store its coordinate (which always plans cleanly) and display name.
 *   2. Direct geocode probe — full postcodes plan straight to a journey; store
 *      the raw postcode.
 *   3. Neither → invalid (rejects garbage, which matches no stop and no journey).
 *
 * @returns {Promise<
 *   | { status: 'ok', name: string }
 *   | { status: 'invalid' }
 *   | { status: 'error', message: string }
 * >}
 */
async function setHome(handlerInput, location) {
  let homeValue = null;
  let homeName = location;

  // 1. Named station / place → canonical stop coordinate
  const stop = await resolveStopPoint(location);
  if (stop) {
    homeValue = stop.coordinate;
    homeName = stop.name;
  } else {
    // 2. Fall back to a direct geocode probe (full postcodes resolve here)
    const probe = await planJourney({ from: location, to: CENTRAL_LONDON });
    if (probe.status === 'error') return probe;
    if (probe.status === 'ok') {
      homeValue = location;
      homeName = location;
    }
  }

  // 3. Unrecognised
  if (!homeValue) return { status: 'invalid' };

  try {
    const attrs = await handlerInput.attributesManager.getPersistentAttributes();
    attrs[HOME_ATTRIBUTE] = homeValue;
    attrs[HOME_NAME_ATTRIBUTE] = homeName;
    handlerInput.attributesManager.setPersistentAttributes(attrs);
    await handlerInput.attributesManager.savePersistentAttributes();
  } catch (err) {
    return { status: 'error', message: 'persistence_failed' };
  }
  return { status: 'ok', name: homeName };
}

/**
 * Delete the persisted home address (GDPR / SkillDisabled purge path).
 */
async function deleteHome(handlerInput) {
  try {
    const attrs = await handlerInput.attributesManager.getPersistentAttributes();
    delete attrs[HOME_ATTRIBUTE];
    delete attrs[HOME_NAME_ATTRIBUTE];
    handlerInput.attributesManager.setPersistentAttributes(attrs);
    await handlerInput.attributesManager.savePersistentAttributes();
  } catch (_) {}
}

module.exports = { resolveOrigin, setHome, deleteHome, HOME_ATTRIBUTE, HOME_NAME_ATTRIBUTE };
