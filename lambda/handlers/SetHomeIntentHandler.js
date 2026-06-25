const { setHome } = require('../services/locationService');

const SetHomeIntentHandler = {
  canHandle(handlerInput) {
    const { request } = handlerInput.requestEnvelope;
    return request.type === 'IntentRequest' && request.intent.name === 'SetHomeIntent';
  },
  async handle(handlerInput) {
    const { request } = handlerInput.requestEnvelope;
    const location =
      request.intent.slots && request.intent.slots.HomeLocation
        ? request.intent.slots.HomeLocation.value
        : null;

    if (!location) {
      return handlerInput.responseBuilder
        .speak("I didn't catch your home location. Try saying 'set my home to' followed by your postcode or station.")
        .reprompt("What's your home postcode or nearest station?")
        .getResponse();
    }

    const result = await setHome(handlerInput, location);

    if (result.status === 'ok') {
      return handlerInput.responseBuilder
        .speak(`Got it, I've saved ${result.name || location} as your home. You can now ask me when to leave for any destination.`)
        .getResponse();
    }

    if (result.status === 'invalid') {
      return handlerInput.responseBuilder
        .speak(`I couldn't find ${location} on the TfL network. Try a different postcode or station name.`)
        .reprompt("What's your home postcode or nearest station?")
        .getResponse();
    }

    return handlerInput.responseBuilder
      .speak("Sorry, I had trouble saving your home location. Please try again in a moment.")
      .getResponse();
  },
};

module.exports = SetHomeIntentHandler;
