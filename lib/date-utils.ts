export function formatDate(date: Date | string) {

  const d = new Date(date)

  return d.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric"
  })

}

export function daysBetween(date: Date) {

  const now = new Date()

  const diff =
    (now.getTime() - new Date(date).getTime()) /
    (1000 * 60 * 60 * 24)

  return Math.floor(diff)

}