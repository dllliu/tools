const config = require('../config');
const { recordSnipe, countSnipesTaken, countTimesSniped } = require('../store/snipes');
const { displayName } = require('../slack/userNames');

/**
 * Counts snipes in the channel named by SNIPES_CHANNEL_ID. A snipe is an image
 * post that mentions someone: the poster gets credit, each mentioned user gets
 * a "sniped".
 */

// Slack writes mentions as <@U123> and sometimes <@U123|display-name>.
const MENTION_PATTERN = /<@([UW][A-Z0-9]+)(?:\|[^>]*)?>/g;

function hasImage(message) {
  return (message.files || []).some((file) => (file.mimetype || '').startsWith('image/'));
}

// Keyed on the user id, so tagging the same person twice is still one snipe.
function mentionedUsers(message) {
  const ids = new Set();
  for (const [, id] of (message.text || '').matchAll(MENTION_PATTERN)) {
    if (id !== message.user) ids.add(id);
  }
  return [...ids];
}

function plural(count, noun) {
  return `${count} ${noun}${count === 1 ? '' : 's'}`;
}

async function handleChannelMessage({ message, say, client, logger }) {
  // Photo posts arrive as file_share; every other subtype is channel noise.
  if (message.subtype && message.subtype !== 'file_share') return;
  if (message.bot_id) return;

  try {
    if (message.channel !== config.snipes.channelId()) return;

    const targets = mentionedUsers(message);
    if (targets.length === 0) return;

    if (!hasImage(message)) {
      await say({
        text: '📸 You need to attach an image for this to count!',
        thread_ts: message.ts,
      });
      return;
    }

    const recorded = await Promise.all(
      targets.map((snipedId) =>
        recordSnipe({
          sniperId: message.user,
          snipedId,
          channelId: message.channel,
          messageTs: message.ts,
        }),
      ),
    );

    if (!recorded.some(Boolean)) return;

    const [taken, sniped, sniperName, targetNames] = await Promise.all([
      countSnipesTaken(message.user),
      Promise.all(targets.map((id) => countTimesSniped(id))),
      displayName(client, message.user),
      Promise.all(targets.map((id) => displayName(client, id))),
    ]);

    const lines = [`Sniped! :camera: ${sniperName} has ${plural(taken, 'snipe')}!`];
    targets.forEach((id, index) => {
      lines.push(`${targetNames[index]} has been sniped ${plural(sniped[index], 'time')}`);
    });

    await say(lines.join('\n'));
  } catch (error) {
    logger.error(error);
  }
}

module.exports = { handleChannelMessage };
