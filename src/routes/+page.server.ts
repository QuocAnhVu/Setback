import { redirect, type Actions, type ServerLoad } from '@sveltejs/kit';
import { Session, SessionResponse, Result } from '$lib/game';
import { Observable, OBSERVABLES, SESSIONS } from '$lib/database';

export const load: ServerLoad = ({ cookies }) => {
  const user = cookies.get('user');
  return { user };
};

export const actions = {
  login: async ({ cookies, request }) => {
    const data = await request.formData();
    const email = data.get('user');
    if (email == null) {
      return { success: false };
    }
    // const password = data.get('password');
    cookies.set('user', email.toString(), { path: '/' });
    return { success: true };
  },
  create: async ({ cookies }) => {
    const user = cookies.get('user');
    if (user === undefined) {
      return { success: false, msg: "Action requires login." };
    }
    const sessionId = SESSIONS.length;
    const session = new Session();
    session.join(user);
    SESSIONS.push(session);
    OBSERVABLES.push(new Observable())
    throw redirect(302, `/${sessionId}`);
  },
  join: async ({ cookies, request }) => {
    const user = cookies.get('user');
    if (user === undefined) {
      return { success: false, msg: "Action requires login." };
    }
    const data = await request.formData();
    const sessionIdStr = data.get('session');
    if (sessionIdStr == null) {
      return { success: false, msg: "Session ID not provided." };
    }
    const sessionId = Number(sessionIdStr);
    if (isNaN(sessionId)) {
      return { success: false, msg: "Session ID is not a number."}
    }
    if (sessionId < 0 || sessionId >= SESSIONS.length) {
      return { success: false, msg: "Session ID does not exist."}
    }
    const session = SESSIONS[sessionId];
    const response = session.join(user);
    if (response.result == Result.Ok) {
      OBSERVABLES[sessionId].notify(session);
      throw redirect(302, `/${sessionId}`);
    } else {
      return { success: false, msg: response.msg };
    }
  },
} satisfies Actions;
