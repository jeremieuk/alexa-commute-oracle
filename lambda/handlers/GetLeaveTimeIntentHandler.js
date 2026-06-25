const { resolveOrigin } = require('../services/locationService');
const { planJourney } = require('../services/tflService');
const { filterJourneys } = require('../services/disruptionFilter');
const { formatJourney } = require('../services/speechFormatter');

// Handles: "when do I need to leave to arrive at King's Cross by 9?"
// Requires destination to have been captured in session from a prior GetTravelTimeIntent,
// or asks for it via a multi-turn dialog.

const GetLeaveTimeIntentHandler = {
  canHandle(handlerInput) {
    const { request } = handlerInput.requestEnvelope;
    return request.type === 'IntentRequest' && request.intent.name === 'GetLeaveTimeIntent';
  },
  async handle(handlerInput) {
    const { request } = handlerInput.requestEnvelope;
    const slots = request.intent.slots || {};

    const destination = slots.Destination && slots.Destination.value;
    const arrivalTimeRaw = slots.ArrivalTime && slots.ArrivalTime.value; // e.g. "09:00"

    if (!destination) {
      return handlerInput.responseBuilder
        .speak("Where are you heading?")
        .reprompt("What's your destination?")
        .getResponse();
    }
    if (!arrivalTimeRaw) {
      return handlerInput.responseBuilder
        .speak(`What time do you need to arrive at ${destination}?`)
        .reprompt("What time do you need to be there?")
        .getResponse();
    }

    const originResult = await resolveOrigin(handlerInput);
    if (originResult.status === 'needsPermission') {
      return handlerInput.responseBuilder
        .speak(
          "I need permission to read your device address. Check the Alexa app, " +
          "or say 'set my home to' followed by your postcode."
        )
        .withAskForPermissionsConsentCard(['read::alexa:device:all:address:country_and_postal_code'])
        .getResponse();
    }
    if (originResult.status !== 'ok') {
      return handlerInput.responseBuilder
        .speak("First, tell me your home by saying 'set my home to' followed by your postcode.")
        .getResponse();
    }

    const journey = await planJourney({
      from: originResult.origin,
      to: destination,
      arriveBy: arrivalTimeRaw,
    });

    if (journey.status === 'ambiguous') {
      return handlerInput.responseBuilder
        .speak(`I found a few places called ${destination}. Can you be more specific, like including the street or area?`)
        .reprompt("Which location did you mean?")
        .getResponse();
    }
    if (journey.status === 'no_results') {
      return handlerInput.responseBuilder
        .speak(`Sorry, I couldn't find a TfL route to ${destination}. Is that in London?`)
        .getResponse();
    }
    if (journey.status !== 'ok') {
      return handlerInput.responseBuilder
        .speak("Sorry, TfL isn't responding right now. Please try again.")
        .getResponse();
    }

    const { journey: best, disruptedLineNames, allDisrupted } = filterJourneys(journey.journeys);
    const speech = formatJourney(best, disruptedLineNames, allDisrupted);
    return handlerInput.responseBuilder.speak(speech).getResponse();
  },
};

module.exports = GetLeaveTimeIntentHandler;
