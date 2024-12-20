import { expect, test } from 'vitest';
import { Result, Session } from '$lib/game';

test('can join 4 players but not 5', () => {
  let session = new Session();
  expect(session.join('a').result == Result.Ok);
  expect(session.join('b').result == Result.Ok);
  expect(session.join('c').result == Result.Ok);
  expect(session.join('d').result == Result.Ok);
  expect(session.join('e').result == Result.Err);
  console.log(session);
});
