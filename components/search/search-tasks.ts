import { Task } from "@/hooks/use-app-state"

export function searchTasks(tasks: Task[], query: string) {

  const q = query.toLowerCase()

  return tasks.filter((task) =>
    task.title.toLowerCase().includes(q) ||
    task.description.toLowerCase().includes(q)
  )

}