const CACHE_PREFIXES = ['polish-notebook', 'workbox', 'vite'];

export async function estimateCacheSizeMb(): Promise<number> {
  let bytes = 0;

  if ('caches' in window) {
    try {
      const names = await caches.keys();
      for (const name of names) {
        const cache = await caches.open(name);
        const requests = await cache.keys();
        for (const req of requests) {
          const res = await cache.match(req);
          if (res) {
            const blob = await res.blob();
            bytes += blob.size;
          }
        }
      }
    } catch {
      // ignore
    }
  }

  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (!key) continue;
    if (CACHE_PREFIXES.some((p) => key.includes(p))) {
      bytes += (localStorage.getItem(key)?.length ?? 0) * 2;
    }
  }

  return Math.max(0.1, Math.round((bytes / (1024 * 1024)) * 10) / 10);
}

export async function clearAppCache(): Promise<number> {
  const before = await estimateCacheSizeMb();

  if ('caches' in window) {
    const names = await caches.keys();
    await Promise.all(names.map((name) => caches.delete(name)));
  }

  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (!key) continue;
    if (
      key.includes('temp') ||
      key.includes('cache') ||
      key.startsWith('polish-notebook-cache')
    ) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((key) => localStorage.removeItem(key));

  const after = await estimateCacheSizeMb();
  const freed = Math.max(0, Math.round((before - after) * 10) / 10);
  return freed > 0 ? freed : before;
}
