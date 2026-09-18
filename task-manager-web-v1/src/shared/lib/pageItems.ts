export type PageItem = number | 'gap'

/**
 * Numéros de page à afficher (base 0) : toujours la première et la dernière, la page
 * courante et ses voisines, des points de suspension ailleurs. Exemple pour la page 6
 * sur 12 : 1 … 5 6 7 … 12. Sept éléments au plus : la barre garde une largeur stable.
 */
export function pageItems(current: number, totalPages: number): PageItem[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index)
  }
  const first = 0
  const last = totalPages - 1
  const start = Math.max(1, Math.min(current - 1, last - 4))
  const end = Math.min(last - 1, Math.max(current + 1, 4))
  const middle = Array.from({ length: end - start + 1 }, (_, index) => start + index)
  return [first, ...(start > 1 ? ['gap' as const] : []), ...middle, ...(end < last - 1 ? ['gap' as const] : []), last]
}
