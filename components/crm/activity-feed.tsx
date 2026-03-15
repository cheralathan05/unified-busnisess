'use client'

import { useEffect, useState } from "react"

import { Card } from "@/components/ui/card"

import {
  getActivities,
  Activity
} from "@/lib/services/activity.service"

export default function ActivityFeed(){

  const [activities,setActivities] = useState<Activity[]>([])
  const [loading,setLoading] = useState(true)

  useEffect(()=>{

    fetchActivities()

  },[])

  async function fetchActivities(){

    try{

      const res = await getActivities()

      setActivities(res.data || [])

    }catch(err){

      console.error("Activity fetch error",err)

    }finally{

      setLoading(false)

    }

  }

  return(

    <Card className="p-6">

      <h3 className="font-semibold mb-4">
        Live Activity Feed
      </h3>

      {loading && (

        <p className="text-sm text-muted-foreground">
          Loading activities...
        </p>

      )}

      {!loading && activities.length === 0 && (

        <p className="text-sm text-muted-foreground">
          No recent activity
        </p>

      )}

      <ul className="space-y-2 text-sm">

        {activities.slice(0,8).map((activity)=>(

          <li key={activity.id}>

            {activity.description}

            <span className="block text-xs text-muted-foreground">

              {new Date(activity.createdAt).toLocaleString()}

            </span>

          </li>

        ))}

      </ul>

    </Card>

  )

}