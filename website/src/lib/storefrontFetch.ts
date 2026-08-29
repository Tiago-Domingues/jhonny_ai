const inflight = new Map<string, Promise<unknown>>();
const cache = new Map<string, { at: number; data: unknown }>();
const DEFAULT_TTL_MS = 4000;

export function bustStorefrontCache(url?: string) {
  if (!url) {
    cache.clear();
    return;
  }
  cache.delete(url);
}

export function storefrontGetJson<T>(
  url: string,
  options?: { ttlMs?: number; bust?: boolean }
): Promise<T | null> {
  if (options?.bust) cache.delete(url);
  const ttl = options?.ttlMs ?? DEFAULT_TTL_MS;
  const cached = cache.get(url);
  if (cached && Date.now() - cached.at < ttl) {
    return Promise.resolve(cached.data as T);
  }
  const pending = inflight.get(url);
  if (pending) return pending as Promise<T | null>;

  const request = fetch(url)
    .then((response) => (response.ok ? response.json() : null))
    .then((data) => {
      cache.set(url, { at: Date.now(), data });
      return data as T;
    })
    .catch(() => null)
    .finally(() => {
      inflight.delete(url);
    });

  inflight.set(url, request);
  return request;
}
