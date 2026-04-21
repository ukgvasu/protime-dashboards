class CacheService {
  constructor(ttlMs = 15 * 60 * 1000) {
    this.cache = new Map();
    this.ttl = ttlMs;
    this.hits = 0;
    this.misses = 0;
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) { this.misses++; return null; }
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }
    this.hits++;
    return entry.data;
  }

  set(key, data) {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  invalidate(pattern) {
    let count = 0;
    for (const key of this.cache.keys()) {
      if (key.startsWith(pattern)) { this.cache.delete(key); count++; }
    }
    if (count > 0) console.log(`🗑️ Cache invalidated: ${count} entries matching "${pattern}"`);
  }

  clear() { this.cache.clear(); }

  getStats() {
    return { size: this.cache.size, hits: this.hits, misses: this.misses, ttlMs: this.ttl };
  }
}

export const cacheService = new CacheService();
