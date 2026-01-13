import { defineHandler, readBody } from 'nitro/h3';
import { createDB, pastes, type NewPaste } from '~/server/database';
import {
  CONTENT_TYPES,
  detectContentType,
  normalizeContentType,
} from '~/server/utils/content-type';
import { nanoid } from '~/server/utils/nanoid';
import { generateSharePassword } from '~/server/utils/password';

interface CreateRequestBody {
  content: string;
  expire?: number;
  isPrivate?: boolean;
  is_protected?: boolean;
  content_type?: string;
  language?: string;
}

export default defineHandler(async (event) => {
  const body = await readBody<CreateRequestBody>(event);
  const { 
    content, 
    expire, 
    isPrivate, 
    is_protected,
    content_type,
    language
  } = body ?? {};

  if (!content) {
    return { error: 'Content is required' };
  }

  const isProtected = Boolean(is_protected ?? isPrivate);
  const requestedType =
    normalizeContentType(content_type) || normalizeContentType(language);
  const contentType =
    requestedType === CONTENT_TYPES.AUTO || !requestedType
      ? detectContentType(content)
      : requestedType;

  const id = nanoid();
  const createTime = Date.now();
  const sharePassword = generateSharePassword();
  const pasteBody: any = {
    content,
    expire: expire || 0,
    language: contentType,
    create_time: createTime,
    edit_password: nanoid(8),
    metadata: {
      content_type: contentType,
      is_protected: isProtected ? 1 : 0,
      create_time: createTime,
    },
  };

  if (isProtected) {
    pasteBody.metadata.share_password = sharePassword;
  }

  const cloudflare = event.context.cloudflare || event.req?.runtime?.cloudflare;
  const db = createDB(cloudflare.env.DB);
  const newPaste: NewPaste = {
    id,
    content: pasteBody.content,
    createTime: pasteBody.create_time,
    editPassword: pasteBody.edit_password,
    language: pasteBody.language,
    contentType,
    isProtected: isProtected ? 1 : 0,
    sharePassword: isProtected ? sharePassword : '',
    expire: pasteBody.expire,
    metadata: JSON.stringify(pasteBody.metadata),
  };

  await db.insert(pastes).values(newPaste);
  return {
    id,
    url: `${cloudflare.env.BASE_URL}/view/${id}`,
    content_type: contentType,
    is_protected: isProtected,
    password: sharePassword,
    ...pasteBody,
  };
});
