/** First four characters of the trimmed name, uppercased (for default category codes). */
export function suggestedCodeFromCategoryName(name: string): string {
  return name.trim().slice(0, 4).toUpperCase()
}
