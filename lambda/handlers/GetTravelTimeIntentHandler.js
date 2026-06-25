const { resolveOrigin } = require('../services/locationService');
const { planJourney } = require('../services/tflService');
const { filterJourneys } = require('../services/disruptionFilter');
const { formatJourney } = require('../services/speechFormatter');

const MAX_DISAMBIG_OPTIONS = 3;

const GetTravelTimeIntentHandler = {
  canHandle(handlerInput) {
    const { request } = handlerInput.requestEnvelope;
    return request.type === 'IntentRequest' && request.intent.name === 'GetTravelTimeIntent';
  },
  async handle(handlerInput) {
    const { request, attributesManager } = handlerInput.requestEnvelope;
    const destination =
      request.intent.slots && request.intent.slots.Destination
        ? request.intent.slots.Destination.value
        : null;

    if (!destination) {
      return handlerInput.responseBuilder
        .speak("Where would you like to go?")
        .reprompt("What's your destination?")
        .getResponse();
    }

    // Resolve origin
    const originResult = await resolveOrigin(handlerInput);
    if (originResult.status === 'needsPermission') {
      return handlerInput.responseBuilder
        .speak(
          "I need permission to read your device address. Check the Alexa app to grant access, " +
          "or say 'set my home to' followed by your postcode."
        )
        .withAskForPermissionsConsentCard(['read::alexa:device:all:address:country_and_postal_code'])
        .getResponse();
    }
    if (originResult.status === 'needsOnboarding') {
      return handlerInput.responseBuilder
        .speak("First I need to know where you're travelling from. What's your home postcode or nearest station?")
        .reprompt("What postcode or station should I use as your home?")
        .getResponse();
    }
    if (originResult.status === 'error') {
      return handlerInput.responseBuilder
        .speak("Sorry, I couldn't determine your location. Please try again.")
        .getResponse();
    }

    const from = originResult.origin;
    const journey = await planJourney({ from, to: destination });

    if (journey.status === 'ambiguous') {
      return handleAmbiguous(handlerInput, journey, from, destination);
    }
    if (journey.status === 'no_results') {
      return handlerInput.responseBuilder
        .speak(`Sorry, I couldn't find a TfL route to ${destination}. Is that in London?`)
        .reprompt("Would you like to try a different destination?")
        .getResponse();
    }
    if (journey.status === 'error') {
      return handlerInput.responseBuilder
        .speak("Sorry, TfL isn't responding right now. Please try again in a moment.")
        .getResponse();
    }

    const { journey: best, disruptedLineNames, allDisrupted } = filterJourneys(journey.journeys);
    const speech = formatJourney(best, disruptedLineNames, allDisrupted);
    return handlerInput.responseBuilder.speak(speech).getResponse();
  },
};

function handleAmbiguous(handlerInput, result, from, rawDestination) {
  // We only disambiguate the to-side for now (most common case)
  const options = result.toOptions || result.fromOptions || [];
  const trimmed = options.slice(0, MAX_DISAMBIG_OPTIONS);

  if (trimmed.length === 0) {
    return handlerInput.responseBuilder
      .speak(`I found multiple places called ${rawDestination} but couldn't list them. Try being more specific.`)
      .getResponse();
  }

  // Persist options + from in session for SelectChoiceIntentHandler
  const sessionAttrs = handlerInput.attributesManager.getSessionAttributes();
  sessionAttrs.disambigOptions = trimmed.map(o => ({
    name: o.matchedStop && o.matchedStop.commonName || o.place && o.place.commonName || o.icsCode,
    icsCode: o.matchedStop && o.matchedStop.icsCode || o.place && o.place.icsCode,
    lat: o.matchedStop && o.matchedStop.lat || o.place && o.place.lat,
    lon: o.matchedStop && o.matchedStop.lon || o.place && o.place.lon,
  }));
  sessionAttrs.disambigFrom = from;
  handlerInput.attributesManager.setSessionAttributes(sessionAttrs);

  const optionList = trimmed
    .map((o, i) => {
      const name = o.matchedStop && o.matchedStop.commonName || o.place && o.place.commonName || `option ${i + 1}`;
      return `${i + 1}: ${name}`;
    })
    .join(', ');

  return handlerInput.responseBuilder
    .speak(`I found a few places called ${rawDestination}. ${optionList}. Which one did you mean?`)
    .reprompt(`Which ${rawDestination} did you mean? Say the number or the full name.`)
    .getResponse();
}

module.exports = GetTravelTimeIntentHandler;
