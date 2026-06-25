const { DynamoDbPersistenceAdapter } = require('ask-sdk-dynamodb-persistence-adapter');

// Alexa-hosted injects DYNAMODB_PERSISTENCE_TABLE_NAME and DYNAMODB_PERSISTENCE_REGION.
// Locally these won't be set; persistence calls will be skipped in test mode.
const adapter = process.env.DYNAMODB_PERSISTENCE_TABLE_NAME
  ? new DynamoDbPersistenceAdapter({
      tableName: process.env.DYNAMODB_PERSISTENCE_TABLE_NAME,
      createTable: false,
      region: process.env.DYNAMODB_PERSISTENCE_REGION || 'eu-west-1',
    })
  : null;

module.exports = { adapter };
