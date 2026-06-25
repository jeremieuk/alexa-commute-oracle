const { deleteHome } = require('../services/locationService');

const DeleteHomeIntentHandler = {
  canHandle(handlerInput) {
    const { request } = handlerInput.requestEnvelope;
    return request.type === 'IntentRequest' && request.intent.name === 'DeleteHomeIntent';
  },
  async handle(handlerInput) {
    await deleteHome(handlerInput);
    return handlerInput.responseBuilder
      .speak("I've deleted your saved home address. You can set a new one any time by saying 'set my home to' followed by your postcode.")
      .getResponse();
  },
};

module.exports = DeleteHomeIntentHandler;
