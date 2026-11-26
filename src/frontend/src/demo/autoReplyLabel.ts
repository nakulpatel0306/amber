/**
 * Seeded people's automatic replies start with this label. It lives apart from
 * autoReply.ts so the message panel can show it as a tag without pulling in the
 * demo backend.
 */
export const AUTO_REPLY_LABEL = '(Demo auto-reply)';

export function splitAutoReply(content: string): { isAutoReply: boolean; text: string } {
  return content.startsWith(AUTO_REPLY_LABEL)
    ? { isAutoReply: true, text: content.slice(AUTO_REPLY_LABEL.length).trimStart() }
    : { isAutoReply: false, text: content };
}
