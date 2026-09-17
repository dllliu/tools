// Names change rarely, so cache them for the life of the process.
const names = new Map();

/**
 * Human-readable name for a user id, falling back to a plain mention if the
 * lookup fails so a snipe still gets announced.
 */
async function displayName(client, userId) {
  if (names.has(userId)) return names.get(userId);

  let name = `<@${userId}>`;
  try {
    const { user } = await client.users.info({ user: userId });
    name = user.profile?.display_name || user.real_name || user.name || name;
    names.set(userId, name);
  } catch {
    // Leave it uncached so the next snipe retries the lookup.
  }

  return name;
}

module.exports = { displayName };
