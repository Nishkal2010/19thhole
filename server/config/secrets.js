// SESSION_SECRET signs the auth cookie. It used to carry the literal fallback
// 'golf-secret-change-me' at two call sites in a PUBLIC repository, so anyone
// reading GitHub could forge an auth_token for any user id whenever the env var
// was unset.
//
// This resolves it lazily and throws only when something actually needs to sign
// or verify. Throwing at module load would take the whole API down on a deploy
// where the variable is missing, including the routes that need no auth at all;
// this way an unset secret breaks exactly the operations that cannot be done
// safely without it, and nothing else.
function sessionSecret() {
  const s = process.env.SESSION_SECRET;
  if (!s) {
    throw new Error(
      'SESSION_SECRET is not set. Auth tokens cannot be signed or verified. ' +
        'Set it in the deployment environment; there is deliberately no default.',
    );
  }
  return s;
}

// Unsubscribe links are sent to people who are not signed in, so they cannot be
// gated on the auth cookie. This derives a per-address token from the same
// secret, which means no new environment variable to configure.
function unsubscribeToken(email) {
  const { createHmac } = require('crypto');
  return createHmac('sha256', sessionSecret())
    .update(`unsubscribe:${String(email).trim().toLowerCase()}`)
    .digest('hex')
    .slice(0, 32);
}

function unsubscribeTokenValid(email, token) {
  if (!token || typeof token !== 'string') return false;
  const { timingSafeEqual } = require('crypto');
  const expected = Buffer.from(unsubscribeToken(email));
  const given = Buffer.from(token);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

module.exports = { sessionSecret, unsubscribeToken, unsubscribeTokenValid };
