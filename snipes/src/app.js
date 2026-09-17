const { App, AwsLambdaReceiver } = require('@slack/bolt');
const config = require('./config');
const { handleTeamJoin } = require('./handlers/welcome');
const { handleChannelMessage } = require('./handlers/channelMessage');

const awsLambdaReceiver = new AwsLambdaReceiver({
  signingSecret: config.slack.signingSecret(),
});

const app = new App({
  token: config.slack.botToken(),
  receiver: awsLambdaReceiver,
});

app.event('team_join', handleTeamJoin);
app.message(handleChannelMessage);

module.exports.handler = async (event, context, callback) => {
  const handler = await awsLambdaReceiver.start();
  return handler(event, context, callback);
};
