/**
 * 简单的内存缓存工具
 * 用于缓存 Apple iCloud 日历数据，避免频繁请求被限流
 */

interface CacheItem<T> {
  data: T;
  expiresAt: number;
}

class Cache {
  private store = new Map<string, CacheItem<unknown>>();

  /**
   * 设置缓存
   * @param key 缓存键
   * @param data 要缓存的数据
   * @param ttl 过期时间（毫秒），默认 1 小时
   */
  set<T>(key: string, data: T, ttl = 3600000): void {
    const expiresAt = Date.now() + ttl;
    this.store.set(key, { data, expiresAt });
  }

  /**
   * 获取缓存
   * @param key 缓存键
   * @returns 缓存的数据，如果不存在或已过期则返回 null
   */
  get<T>(key: string): T | null {
    const item = this.store.get(key) as CacheItem<T> | undefined;

    if (!item) {
      return null;
    }

    // 检查是否过期
    if (Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return item.data;
  }

  /**
   * 删除缓存
   * @param key 缓存键
   */
  delete(key: string): void {
    this.store.delete(key);
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * 清理所有过期的缓存项
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.store.entries()) {
      if (now > item.expiresAt) {
        this.store.delete(key);
      }
    }
  }
}

// 导出单例实例
export const cache = new Cache();

// 定期清理过期缓存（每小时一次）
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    cache.cleanup();
  }, 3600000); // 1 小时
}
