export function chunk<T>(items: T[], size: number): T[][] {
  if (size <= 0) return [items];
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

export function groupBy<T, K extends string>(items: T[], getKey: (item: T) => K): Record<K, T[]> {
  return items.reduce((acc, item) => {
    const key = getKey(item);
    (acc[key] ??= []).push(item);
    return acc;
  }, {} as Record<K, T[]>);
}
