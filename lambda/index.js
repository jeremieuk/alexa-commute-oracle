const Alexa = require('ask-sdk-core');
const { adapter } = require('./util/persistence');

const LaunchRequestHandler = require('./handlers/LaunchRequestHandler');
const GetTravelTimeIntentHandler = require('./handlers/GetTravelTimeIntentHandler');
const GetLeaveTimeIntentHandler = require('./handlers/GetLeaveTimeIntentHandler');
const SetHomeIntentHandler = require('./handlers/SetHomeIntentHandler');
const DeleteHomeIntentHandler = require('./handlers/DeleteHomeIntentHandler');
const SelectChoiceIntentHandler = require('./handlers/SelectChoiceIntentHandler');
const {
  HelpIntentHandler,
  CancelAndStopHandler,
  FallbackIntentHandler,
  SessionEndedRequestHandler,
  ErrorHandler,
} = require('./handlers/StandardHandlers');

let builder = Alexa.SkillBuilders.custom()
  .addRequestHandlers(
    LaunchRequestHandler,
    // Disambiguation must come before GetTravelTime/GetLeaveTime so session state is checked first
    SelectChoiceIntentHandler,
    GetLeaveTimeIntentHandler,
    GetTravelTimeIntentHandler,
    SetHomeIntentHandler,
    DeleteHomeIntentHandler,
    HelpIntentHandler,
    CancelAndStopHandler,
    FallbackIntentHandler,
    SessionEndedRequestHandler,
  )
  .addErrorHandlers(ErrorHandler)
  .withApiClient(new Alexa.DefaultApiClient());

if (adapter) {
  builder = builder.withPersistenceAdapter(adapter);
}

exports.handler = builder.lambda();
