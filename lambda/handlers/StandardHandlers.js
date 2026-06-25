const HelpIntentHandler = {
  canHandle(handlerInput) {
    const { request } = handlerInput.requestEnvelope;
    return request.type === 'IntentRequest' && request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak(
        "You can ask me things like: 'how do I get to Canary Wharf', or " +
        "'when do I need to leave to be at King's Cross by nine'. " +
        "To set your starting point, say 'set my home to' followed by your postcode or station. " +
        "How can I help?"
      )
      .reprompt("Where would you like to go?")
      .getResponse();
  },
};

const CancelAndStopHandler = {
  canHandle(handlerInput) {
    const { request } = handlerInput.requestEnvelope;
    return (
      request.type === 'IntentRequest' &&
      (request.intent.name === 'AMAZON.CancelIntent' ||
        request.intent.name === 'AMAZON.StopIntent')
    );
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder.speak("Safe travels!").getResponse();
  },
};

const FallbackIntentHandler = {
  canHandle(handlerInput) {
    const { request } = handlerInput.requestEnvelope;
    return request.type === 'IntentRequest' && request.intent.name === 'AMAZON.FallbackIntent';
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak(
        "Sorry, I didn't understand that. Try asking 'how do I get to' followed by your destination."
      )
      .reprompt("Where would you like to go?")
      .getResponse();
  },
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    // Clean up any pending disambiguation state
    const session = handlerInput.attributesManager.getSessionAttributes();
    delete session.disambigOptions;
    delete session.disambigFrom;
    return handlerInput.responseBuilder.getResponse();
  },
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.error('[ErrorHandler]', error.message, error.stack);
    return handlerInput.responseBuilder
      .speak("Sorry, something went wrong. Please try again.")
      .reprompt("You can ask me how to get somewhere in London.")
      .getResponse();
  },
};

module.exports = {
  HelpIntentHandler,
  CancelAndStopHandler,
  FallbackIntentHandler,
  SessionEndedRequestHandler,
  ErrorHandler,
};
