/** Supabase peut renvoyer une relation embedée comme objet ou tableau selon le contexte. */
export function unwrapOne<T>(value: unknown): T | null {
  if (value == null) return null;
  if (Array.isArray(value)) return (value[0] as T | undefined) ?? null;
  return value as T;
}
