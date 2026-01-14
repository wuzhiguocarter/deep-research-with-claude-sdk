/**
 * 组织信息更新事件管理器
 * 用于在组织信息变化时通知 UI 组件刷新
 */

type Listener = () => void;

class OrgEventEmitter {
  private listeners: Set<Listener> = new Set();

  /**
   * 订阅组织更新事件
   */
  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * 触发组织更新事件
   */
  emit() {
    this.listeners.forEach((listener) => listener());
  }
}

// 全局单例
export const orgEvent = new OrgEventEmitter();

/**
 * 便捷方法：通知组织信息已更新
 * 在修改组织名称、创建组织等场景调用
 */
export function notifyOrgUpdated() {
  orgEvent.emit();
}
