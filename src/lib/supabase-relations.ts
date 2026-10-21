/** Supabase peut renvoyer une relation embedée comme objet ou tableau selon le contexte. */
export function unwrapOne<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}
