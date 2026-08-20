import { type PostRecipientInsert } from '@app/db/schema/post';
import { ids } from './ids';

const jardimPosts = [
  '55555555-5555-5555-5555-555555555551',
  '55555555-5555-5555-5555-555555555552',
  '55555555-5555-5555-5555-555555555553',
];
const bosquePosts = [
  '55555555-5555-5555-5555-555555555554',
  '55555555-5555-5555-5555-555555555555',
  '55555555-5555-5555-5555-555555555556',
];
const jardimUsers = [ids.users.joao, ids.users.maria, ids.users.ana, ids.users.fernanda];
const bosqueUsers = [ids.users.carlos, ids.users.beatriz, ids.users.rafael, ids.users.luciana];

function recipients(postIds: string[], userIds: string[]): PostRecipientInsert[] {
  return postIds.flatMap((postId) => userIds.map((userId) => ({ postId, userId })));
}

export const postRecipientSeedData: PostRecipientInsert[] = [
  ...recipients(jardimPosts, jardimUsers),
  ...recipients(bosquePosts, bosqueUsers),
];
