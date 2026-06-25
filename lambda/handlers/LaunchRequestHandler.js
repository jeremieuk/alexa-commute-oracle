const { resolveOrigin } = require('../services/locationService');

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
  },
  async handle(handlerInput) {
    const origin = await resolveOrigin(handlerInput);

    if (origin.status === 'needsOnboarding') {
      return handlerInput.responseBuilder
        .speak(
          "Welcome to Commute Oracle. I need to know where you're travelling from. " +
          "What's your home postcode or nearest station?"
        )
        .reprompt("What postcode or station should I use as your home?")
        .getResponse();
    }

    return handlerInput.responseBuilder
      .speak(
        "Commute Oracle is ready. Where are you heading, or what time do you need to arrive?"
      )
      .reprompt("Where would you like to go?")
      .getResponse();
  },
};

module.exports = LaunchRequestHandler;
