/**
 * 分享工具函数
 * 用于生成研究报告分享链接并复制到剪贴板
 */

/**
 * 生成分享链接
 * @param sessionId 研究会话 ID
 * @returns 完整的分享链接 URL
 */
export function generateShareUrl(sessionId: string): string {
  if (typeof window === 'undefined') return '';

  const baseUrl = window.location.origin;
  return `${baseUrl}/research?share=${sessionId}`;
}

/**
 * 复制分享链接到剪贴板
 * @param sessionId 研究会话 ID
 * @returns Promise<boolean> 复制是否成功
 */
export async function copyShareLink(sessionId: string): Promise<boolean> {
  try {
    const shareUrl = generateShareUrl(sessionId);

    // 使用 Clipboard API 复制链接
    await navigator.clipboard.writeText(shareUrl);

    return true;
  } catch (error) {
    console.error('复制分享链接失败:', error);
    return false;
  }
}

/**
 * 从 URL 查询参数中获取分享的 sessionId
 * @returns sessionId 或 null
 */
export function getSharedSessionId(): string | null {
  if (typeof window === 'undefined') return null;

  const params = new URLSearchParams(window.location.search);
  return params.get('share');
}
