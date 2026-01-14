/**
 * 积分更新事件管理器
 * 用于在积分变化时通知 UI 组件刷新
 */

type Listener = () => void;

class CreditsEventEmitter {
  private listeners: Set<Listener> = new Set();

  /**
   * 订阅积分更新事件
   */
  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * 触发积分更新事件
   */
  emit() {
    this.listeners.forEach((listener) => listener());
  }
}

// 全局单例
export const creditsEvent = new CreditsEventEmitter();

/**
 * 便捷方法：通知积分已更新
 * 在研究完成、充值成功等场景调用
 */
export function notifyCreditsUpdated() {
  creditsEvent.emit();
}
