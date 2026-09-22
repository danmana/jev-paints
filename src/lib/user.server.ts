import 'server-only';
import { isUuid, USER_HEADER } from './user';

/** The caller's anonymous id from the request header, or null when missing or malformed. */
export function userFrom(request: Request): string | null {
  const v = request.headers.get(USER_HEADER);
  return isUuid(v) ? v.toLowerCase() : null;
}
