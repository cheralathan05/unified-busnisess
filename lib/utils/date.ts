/*
=====================================
Format Date
=====================================
*/

export function formatDate(date: Date | string) {

  const d = new Date(date)

  if (isNaN(d.getTime())) return ""

  return d.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric"
  })

}

/*
=====================================
Days Between
=====================================
*/

export function daysBetween(date: Date | string) {

  const now = new Date()
  const d = new Date(date)

  if (isNaN(d.getTime())) return 0

  const diff =
    (now.getTime() - d.getTime()) /
    (1000 * 60 * 60 * 24)

  return Math.floor(diff)

}