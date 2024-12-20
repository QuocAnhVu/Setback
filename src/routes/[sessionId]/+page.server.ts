import { SESSIONS, OBSERVABLES } from '$lib/database';
import type { ServerLoad } from '@sveltejs/kit';

export const load: ServerLoad = ({ params }) => {
  let sessionId = Number(params.sessionId);
  if (Number.isInteger(sessionId) && sessionId >= 0 && sessionId < SESSIONS.length) {
    return {
      session: JSON.stringify(SESSIONS[sessionId].summary()),
    };
  }
};
