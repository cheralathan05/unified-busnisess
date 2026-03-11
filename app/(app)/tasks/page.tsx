'use client'

import { useState } from "react"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"

import { useAppState, type Task } from "@/hooks/use-app-state"

import {
  Plus,
  Filter,
  Search,
  AlertCircle,
  Clock
} from "lucide-react"

export default function TasksPage() {

  const { tasks, updateTask, getOverdueTasks } = useAppState()

  const [searchTerm, setSearchTerm] = useState("")

  const overdueTasks = getOverdueTasks()

  const completedTasks = tasks.filter(t => t.status === "done")
  const inProgressTasks = tasks.filter(t => t.status === "in-progress")

  const priorityColors: Record<string,string> = {
    high: "bg-red-500/10 text-red-400 border border-red-500/30",
    medium: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/30",
    low: "bg-blue-500/10 text-blue-400 border border-blue-500/30"
  }

  const filteredTasks = tasks.filter(task =>
    task.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const toggleComplete = (task: Task) => {

    updateTask(task.id,{
      status: task.status === "done" ? "todo" : "done"
    })

  }

  return (

    <div className="w-full h-full flex flex-col">

      <div className="flex-1 overflow-y-auto">

        <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">

          {/* HEADER */}

          <div className="flex items-center justify-between">

            <div>

              <h1 className="text-3xl font-bold">
                Tasks & Follow-ups
              </h1>

              <p className="text-muted-foreground mt-1">
                Manage your tasks and team activities
              </p>

            </div>

            <Button className="gap-2">

              <Plus className="w-5 h-5"/>

              <span className="hidden sm:inline">
                New Task
              </span>

            </Button>

          </div>



          {/* STATS */}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

            <Card className="p-6">

              <p className="text-sm text-muted-foreground">
                Total Tasks
              </p>

              <p className="text-2xl font-bold mt-1">
                {tasks.length}
              </p>

            </Card>


            <Card className="p-6">

              <p className="text-sm text-muted-foreground">
                Completed
              </p>

              <p className="text-2xl font-bold mt-1">
                {completedTasks.length}
              </p>

            </Card>


            <Card className="p-6">

              <p className="text-sm text-muted-foreground">
                In Progress
              </p>

              <p className="text-2xl font-bold mt-1">
                {inProgressTasks.length}
              </p>

            </Card>


            <Card className="p-6 border-red-500/20 bg-red-500/5">

              <p className="text-sm text-muted-foreground">
                Overdue
              </p>

              <p className="text-2xl font-bold text-red-400 mt-1">
                {overdueTasks.length}
              </p>

            </Card>

          </div>



          {/* SEARCH */}

          <div className="flex items-center gap-4">

            <div className="relative flex-1 max-w-md">

              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>

              <Input
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e)=>setSearchTerm(e.target.value)}
                className="pl-10"
              />

            </div>


            <Button
              variant="outline"
              size="sm"
              className="gap-2"
            >

              <Filter className="w-4 h-4"/>

              Filter

            </Button>

          </div>



          {/* TASK LIST */}

          <div className="space-y-3">

            {filteredTasks.length === 0 ? (

              <Card className="p-12 text-center">

                <p className="text-muted-foreground">
                  No tasks found. Create a new task to get started.
                </p>

              </Card>

            ) : (

              filteredTasks.map(task => {

                const isOverdue =
                  task.dueDate &&
                  new Date(task.dueDate) < new Date() &&
                  task.status !== "done"

                return (

                  <Card
                    key={task.id}
                    className="p-4 hover:shadow-lg transition-all"
                  >

                    <div className="flex items-center gap-4">

                      <Checkbox
                        checked={task.status === "done"}
                        onCheckedChange={()=>toggleComplete(task)}
                      />


                      <div className="flex-1 min-w-0">

                        <h3
                          className={`font-medium ${
                            task.status === "done"
                              ? "line-through text-muted-foreground"
                              : ""
                          }`}
                        >
                          {task.title}
                        </h3>


                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">

                          {task.dueDate && (

                            <span className="flex items-center gap-1">

                              <Clock className="w-3 h-3"/>

                              {new Date(task.dueDate).toLocaleDateString()}

                            </span>

                          )}


                          {isOverdue && (

                            <span className="flex items-center gap-1 text-red-400">

                              <AlertCircle className="w-3 h-3"/>

                              Overdue

                            </span>

                          )}

                        </div>

                      </div>


                      <Badge
                        className={
                          priorityColors[task.priority] ??
                          "bg-gray-500/10"
                        }
                      >

                        {task.priority ?? "normal"}

                      </Badge>

                    </div>

                  </Card>

                )

              })

            )}

          </div>

        </div>

      </div>

    </div>

  )

}