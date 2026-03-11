'use client'

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function LeadTasks(){

const [tasks,setTasks] = useState<string[]>([])
const [task,setTask] = useState("")

function addTask(){

setTasks([task,...tasks])
setTask("")

}

return(

<div className="space-y-3">

<h3 className="font-semibold">
Tasks
</h3>

<Input
value={task}
onChange={(e)=>setTask(e.target.value)}
placeholder="Add task"
/>

<Button onClick={addTask}>
Add Task
</Button>

<ul>

{tasks.map((t,i)=>(
<li key={i}>{t}</li>
))}

</ul>

</div>

)

}