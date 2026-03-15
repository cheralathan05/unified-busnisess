'use client'

import { useEffect, useState } from "react"

import {
Card,
CardContent,
CardHeader,
CardTitle
} from '@/components/ui/card'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

import {
Circle,
CheckCircle2
} from 'lucide-react'

interface Task {

id:string
title:string
status:string
dueDate?:string

}

export function TaskOverview(){

const [tasks,setTasks] = useState<Task[]>([])
const [loading,setLoading] = useState(true)

useEffect(()=>{

fetchTasks()

},[])

async function fetchTasks(){

try{

const res = await fetch(
`${process.env.NEXT_PUBLIC_API_URL}/api/tasks`,
{
headers:{
Authorization:`Bearer ${localStorage.getItem("token")}`
}
}
)

const data = await res.json()

setTasks(data.data || [])

}catch(err){

console.error("Task fetch error",err)

}finally{

setLoading(false)

}

}

async function toggleTask(id:string,status:string){

try{

await fetch(
`${process.env.NEXT_PUBLIC_API_URL}/api/tasks/${id}`,
{
method:"PATCH",
headers:{
"Content-Type":"application/json",
Authorization:`Bearer ${localStorage.getItem("token")}`
},
body:JSON.stringify({
status: status === "COMPLETED" ? "PENDING" : "COMPLETED"
})
}
)

fetchTasks()

}catch(err){

console.error("Task update error",err)

}

}

if(loading){

return(

<Card className="p-6">
Loading tasks...
</Card>

)

}

const todayTasks = tasks.slice(0,5)

return(

<Card className="bg-card border-border">

<CardHeader className="pb-3">

<div className="flex items-center justify-between">

<CardTitle className="text-base">
Tasks Today
</CardTitle>

<Badge variant="secondary">
{todayTasks.length} tasks
</Badge>

</div>

</CardHeader>

<CardContent className="space-y-2">

{todayTasks.map((task)=>{

const completed = task.status === "COMPLETED"

return(

<div
key={task.id}
className="flex items-start gap-3 p-2 hover:bg-muted/30 rounded-lg transition-colors group"
>

<button
onClick={()=>toggleTask(task.id,task.status)}
className="mt-1 flex-shrink-0"
>

{completed ? (
<CheckCircle2 className="w-4 h-4 text-green-500"/>
) : (
<Circle className="w-4 h-4 text-muted-foreground"/>
)}

</button>

<div className="flex-1 min-w-0">

<p className={`text-sm font-medium ${
completed ? "line-through text-muted-foreground" : "text-foreground"
}`}>

{task.title}

</p>

{task.dueDate && (

<p className="text-xs text-muted-foreground">

{new Date(task.dueDate).toLocaleDateString()}

</p>

)}

</div>

</div>

)

})}

{todayTasks.length === 0 && (

<p className="text-sm text-muted-foreground text-center py-4">
No tasks
</p>

)}

<Button
variant="ghost"
size="sm"
className="w-full mt-3"
onClick={()=>window.location.href="/tasks"}
>

View All Tasks

</Button>

</CardContent>

</Card>

)

}