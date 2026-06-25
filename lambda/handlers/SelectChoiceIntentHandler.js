const { planJourney } = require('../services/tflService');
const { filterJourneys } = require('../services/disruptionFilter');
const { formatJourney } = require('../services/speechFormatter');

const SelectChoiceIntentHandler = {
  canHandle(handlerInput) {
    const { request, attributesManager } = handlerInput.requestEnvelope;
    const session = handlerInput.attributesManager.getSessionAttributes();
    return (
      request.type === 'IntentRequest' &&
      (request.intent.name === 'SelectChoiceIntent' ||
        request.intent.name === 'AMAZON.YesIntent' ||
        request.intent.name === 'AMAZON.NoIntent') &&
      Array.isArray(session.disambigOptions)
    );
  },
  async handle(handlerInput) {
    const { request } = handlerInput.requestEnvelope;
    const session = handlerInput.attributesManager.getSessionAttributes();
    const options = session.disambigOptions || [];
    const from = session.disambigFrom;

    // Resolve which option the user chose
    let chosen = null;
    if (request.intent.name === 'SelectChoiceIntent') {
      const slot = request.intent.slots && request.intent.slots.Choice;
      const raw = slot && slot.value;
      const num = parseInt(raw, 10);
      if (!isNaN(num) && num >= 1 && num <= options.length) {
        chosen = options[num - 1];
      } else if (raw) {
        // Try name match
        chosen = options.find(o => o.name && o.name.toLowerCase().includes(raw.toLowerCase()));
      }
    } else if (request.intent.name === 'AMAZON.YesIntent' && options.length === 1) {
      chosen = options[0];
    }

    if (!chosen) {
      return handlerInput.responseBuilder
        .speak("I didn't catch which one. Please say the number or the full name of your destination.")
        .reprompt("Which option did you mean?")
        .getResponse();
    }

    // Build a precise TfL to-coordinate or icsCode reference
    const to = chosen.lat && chosen.lon
      ? `${chosen.lat},${chosen.lon}`
      : chosen.icsCode || chosen.name;

    const journey = await planJourney({ from, to });

    if (journey.status === 'no_results') {
      return handlerInput.responseBuilder
        .speak("I couldn't find a route to that location. Please try a different destination.")
        .getResponse();
    }
    if (journey.status !== 'ok') {
      return handlerInput.responseBuilder
        .speak("Sorry, TfL isn't responding right now. Please try again.")
        .getResponse();
    }

    const { journey: best, disruptedLineNames, allDisrupted } = filterJourneys(journey.journeys);
    const speech = formatJourney(best, disruptedLineNames, allDisrupted);

    // Clear disambiguation state
    delete session.disambigOptions;
    delete session.disambigFrom;
    handlerInput.attributesManager.setSessionAttributes(session);

    return handlerInput.responseBuilder.speak(speech).getResponse();
  },
};

module.exports = SelectChoiceIntentHandler;
