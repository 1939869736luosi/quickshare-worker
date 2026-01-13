import { defineHandler, getRouterParam, getQuery } from 'nitro/h3';
import { eq } from 'drizzle-orm';
import { createDB, pastes } from '../../database';

export default defineHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  const query = getQuery(event);
  const password = (query.password || query.share_password) as string | undefined;

  const cloudflare = event.context.cloudflare || event.req?.runtime?.cloudflare;
  const db = createDB(cloudflare.env.DB);

  const res = await db.select().from(pastes).where(eq(pastes.id, id!)).get();
  if (!res) {
    event.res.status = 404;
    return 'Not found';
  }

  const content = res.content;
  if (res.isProtected) {
    if (!password) {
      event.res.status = 403;
      return 'Private paste, please provide password';
    }
    if (password !== res.sharePassword) {
      event.res.status = 403;
      return 'Wrong password';
    }
  }

  event.res.headers.set('Content-Type', 'text/plain; charset=utf-8');
  return content || '';
});
