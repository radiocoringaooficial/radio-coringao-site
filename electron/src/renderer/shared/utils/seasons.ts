/**
 * Gera lista de anos (temporadas) dinamicamente com base no ano atual.
 *
 * @param yearsAhead - quantos anos no futuro incluir (padrão: 2)
 * @param yearsBack - quantos anos no passado incluir (padrão: 3)
 * @returns array de anos decrescente, ex: [2028, 2027, 2026, 2025, 2023]
 */
export function getSeasonYears(yearsAhead = 2, yearsBack = 3): number[] {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let y = currentYear + yearsAhead; y >= currentYear - yearsBack; y--) {
    years.push(y);
  }
  return years;
}
