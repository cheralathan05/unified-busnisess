"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

import {
  Loader2,
  Mail,
  AlertCircle,
  CheckCircle2
} from "lucide-react"

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api/auth"

export default function ForgotPassword() {

  const router = useRouter()

  const [email,setEmail] = useState("")
  const [cleanEmail,setCleanEmail] = useState("")

  const [loading,setLoading] = useState(false)
  const [error,setError] = useState("")
  const [isSent,setIsSent] = useState(false)



  const handleSubmit = async (e:React.FormEvent)=>{

    e.preventDefault()

    if(loading) return

    setError("")

    const normalized = email.trim().toLowerCase()

    if(!normalized){
      setError("Please enter your email")
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if(!emailRegex.test(normalized)){
      setError("Enter a valid email")
      return
    }

    try{

      setLoading(true)

      const res = await fetch(
        `${API_URL}/forgot-password`,
        {
          method:"POST",
          headers:{
            "Content-Type":"application/json"
          },
          body:JSON.stringify({ email:normalized })
        }
      )

      const data = await res.json()

      if(!res.ok){
        throw new Error(data.message)
      }

      setCleanEmail(normalized)
      setIsSent(true)

      setTimeout(()=>{
        router.push(`/forgot-password/verify-otp?email=${encodeURIComponent(normalized)}`)
      },1500)

    }
    catch(err:any){

      setError(err?.message || "Failed to send OTP")

    }
    finally{

      setLoading(false)

    }

  }



  return(

    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0b] p-6">

      <div className="w-full max-w-md">

        {/* Header */}

        <div className="text-center mb-10">

          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 mb-4 shadow-lg">
            <Mail className="text-white"/>
          </div>

          <h1 className="text-3xl font-bold text-white">
            Forgot Password
          </h1>

          <p className="text-gray-400 text-sm mt-2">
            Enter your email to receive a reset code
          </p>

        </div>



        <Card className="bg-[#111113] border border-white/10 shadow-xl rounded-2xl">

          <div className="p-8">

            {isSent ? (

              <div className="flex flex-col items-center text-center space-y-4">

                <div className="bg-blue-500/10 p-3 rounded-full">
                  <CheckCircle2 className="w-10 h-10 text-blue-500"/>
                </div>

                <h2 className="text-lg font-semibold text-white">
                  OTP Sent
                </h2>

                <p className="text-gray-400 text-sm">
                  We sent a code to
                </p>

                <p className="text-blue-400 font-medium">
                  {cleanEmail}
                </p>

              </div>

            ) : (

              <form
                onSubmit={handleSubmit}
                className="space-y-5"
              >

                {/* Email */}

                <div className="space-y-2">

                  <Label className="text-gray-300">
                    Email Address
                  </Label>

                  <div className="relative">

                    <Mail className="absolute left-3 top-3 text-gray-400 w-4 h-4"/>

                    <Input
                      type="email"
                      placeholder="name@company.com"
                      value={email}
                      disabled={loading}
                      onChange={(e)=>setEmail(e.target.value)}
                      className="pl-10 h-11 bg-[#0a0a0b] border-white/10 text-white"
                    />

                  </div>

                </div>



                {/* Error */}

                {error && (

                  <div className="flex gap-2 p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg">

                    <AlertCircle className="w-4 h-4"/>

                    {error}

                  </div>

                )}



                {/* Submit */}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white"
                >

                  {loading
                    ? <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin"/>
                        Sending OTP...
                      </>
                    : "Send Reset Code"}

                </Button>



                <div className="text-center">

                  <button
                    type="button"
                    onClick={()=>router.push("/login")}
                    className="text-sm text-gray-400 hover:text-blue-400"
                  >

                    Back to Login

                  </button>

                </div>

              </form>

            )}

          </div>

        </Card>

      </div>

    </div>

  )

}