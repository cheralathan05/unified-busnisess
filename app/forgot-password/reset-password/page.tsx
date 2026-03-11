"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"

import {
  Eye,
  EyeOff,
  Loader2,
  Lock,
  AlertCircle,
  CheckCircle2
} from "lucide-react"

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api/auth"

function ResetPasswordForm() {

  const router = useRouter()
  const params = useSearchParams()

  const email = params.get("email")
  const token = params.get("otp")

  const [password,setPassword] = useState("")
  const [confirmPassword,setConfirmPassword] = useState("")
  const [showPassword,setShowPassword] = useState(false)
  const [showConfirm,setShowConfirm] = useState(false)

  const [loading,setLoading] = useState(false)
  const [error,setError] = useState("")
  const [success,setSuccess] = useState(false)

  useEffect(()=>{
    if(!email || !token){
      router.replace("/forgot-password")
    }
  },[email,token,router])


  const changePassword = async (e:React.FormEvent)=>{

    e.preventDefault()

    if(loading) return

    setError("")

    const newPassword = password.trim()
    const confirm = confirmPassword.trim()

    if(!newPassword || !confirm){
      setError("Please fill all fields")
      return
    }

    if(newPassword !== confirm){
      setError("Passwords do not match")
      return
    }

    if(newPassword.length < 6){
      setError("Password must be at least 6 characters")
      return
    }

    try{

      setLoading(true)

      const res = await fetch(
        `${API_URL}/reset-password`,
        {
          method:"POST",
          headers:{
            "Content-Type":"application/json"
          },
          body:JSON.stringify({
            email,
            password:newPassword,
            token
          })
        }
      )

      const data = await res.json()

      if(!res.ok){
        throw new Error(data.message)
      }

      setSuccess(true)

      setTimeout(()=>{
        router.push("/login")
      },2000)

    }
    catch(err:any){
      setError(err?.message || "Failed to reset password")
    }
    finally{
      setLoading(false)
    }

  }



  return (

    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0b] px-6">

      <div className="w-full max-w-md">

        {/* Header */}

        <div className="text-center mb-12">

          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 mb-5 shadow-lg">
            <Lock className="text-white"/>
          </div>

          <h1 className="text-3xl font-bold text-white">
            Reset Your Password
          </h1>

          <p className="text-gray-400 text-sm mt-2">
            Secure your account for
          </p>

          <p className="text-blue-400 text-sm font-medium">
            {email}
          </p>

        </div>


        <Card className="bg-[#111113] border border-white/10 shadow-xl rounded-3xl">

          <div className="p-8">

            {success ? (

              <div className="flex flex-col items-center text-center space-y-4 py-4">

                <div className="bg-green-500/10 p-4 rounded-full">
                  <CheckCircle2 className="text-green-500 w-10 h-10"/>
                </div>

                <h2 className="text-white text-lg font-semibold">
                  Password Updated
                </h2>

                <p className="text-gray-400 text-sm">
                  Redirecting to login...
                </p>

              </div>

            ) : (

              <form onSubmit={changePassword} className="space-y-6">

                {/* Password */}

                <div className="space-y-2">

                  <Label className="text-gray-300">
                    New Password
                  </Label>

                  <div className="relative">

                    <Lock className="absolute left-3 top-3 text-gray-400 w-4 h-4"/>

                    <Input
                      type={showPassword ? "text":"password"}
                      value={password}
                      disabled={loading}
                      onChange={(e)=>setPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="pl-10 pr-10 h-11 bg-[#0a0a0b] border-white/10 text-white placeholder:text-gray-500"
                    />

                    <button
                      type="button"
                      onClick={()=>setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-400"
                    >
                      {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                    </button>

                  </div>

                </div>


                {/* Confirm */}

                <div className="space-y-2">

                  <Label className="text-gray-300">
                    Confirm Password
                  </Label>

                  <div className="relative">

                    <Lock className="absolute left-3 top-3 text-gray-400 w-4 h-4"/>

                    <Input
                      type={showConfirm ? "text":"password"}
                      value={confirmPassword}
                      disabled={loading}
                      onChange={(e)=>setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="pl-10 pr-10 h-11 bg-[#0a0a0b] border-white/10 text-white placeholder:text-gray-500"
                    />

                    <button
                      type="button"
                      onClick={()=>setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-3 text-gray-400"
                    >
                      {showConfirm ? <EyeOff size={18}/> : <Eye size={18}/>}
                    </button>

                  </div>

                </div>


                {/* Error */}

                {error && (

                  <div className="flex gap-2 p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg">

                    <AlertCircle size={16}/>
                    {error}

                  </div>

                )}


                {/* Button */}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                >

                  {loading
                    ? <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin"/>
                        Updating...
                      </>
                    : "Reset Password"}

                </Button>

              </form>

            )}

          </div>

        </Card>

      </div>

    </div>

  )

}



export default function ResetPassword(){

  return(

    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0b]">
          <Loader2 className="animate-spin text-blue-500 w-8 h-8"/>
        </div>
      }
    >

      <ResetPasswordForm/>

    </Suspense>

  )

}