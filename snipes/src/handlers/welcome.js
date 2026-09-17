/**
 * Sends a DM when someone joins the workspace.
 * Edit the text for your org; keep it short.
 */
async function handleTeamJoin({ event, client, logger }) {
  const userId = event.user?.id;
  if (!userId) return;

  try {
    await client.chat.postMessage({
      channel: userId,
      text: [
        'Hey — welcome! Glad you are here.',
        '',
        'Say hi in the general channel, and ping an organizer if you need anything.',
      ].join('\n'),
    });
  } catch (error) {
    logger.error(error);
  }
}

module.exports = { handleTeamJoin };
