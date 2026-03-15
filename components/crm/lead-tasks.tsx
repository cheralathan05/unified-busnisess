'use client'

import { useEffect, useState } from "react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

import { getTasks, createTask, deleteTask } from "@/lib/services/task.service"

interface Task{
 id:string
 title:string
}

export default function LeadTasks({leadId}:{leadId:string}){

const [tasks,setTasks] = useState<Task[]>([])
const [task,setTask] = useState("")
const [loading,setLoading] = useState(false)

useEffect(()=>{
 loadTasks()
},[leadId])

async function loadTasks(){

 try{

  const res = await getTasks({leadId})

  setTasks(res.data || [])

 }catch(err){

  console.error("Task load failed",err)

 }

}

async function addTask(){

 if(!task.trim()) return

 try{

  setLoading(true)

  await createTask({
   title:task,
   leadId
  })

  setTask("")
  loadTasks()

 }catch(err){

  console.error("Task create failed",err)

 }finally{

  setLoading(false)

 }

}

async function removeTask(id:string){

 try{

  await deleteTask(id)

  setTasks(tasks.filter(t=>t.id !== id))

 }catch(err){

  console.error("Task delete failed",err)

 }

}

return(

<div className="space-y-3">

<h3 className="font-semibold">
Tasks
</h3>

<div className="flex gap-2">

<Input
value={task}
onChange={(e)=>setTask(e.target.value)}
placeholder="Add task"
/>

<Button
onClick={addTask}
disabled={loading}
>

Add

</Button>

</div>

<ul className="space-y-2">

{tasks.map((t)=>(
<li
key={t.id}
className="flex justify-between items-center border p-2 rounded"
>

<span>{t.title}</span>

<Button
variant="destructive"
size="sm"
onClick={()=>removeTask(t.id)}
>

Delete

</Button>

</li>
))}

</ul>

</div>

)

}