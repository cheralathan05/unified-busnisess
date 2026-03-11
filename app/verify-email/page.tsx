"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

import {
  Loader2,
  ShieldCheck,
  AlertCircle,
  CheckCircle2
} from "lucide-react"

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api/auth"

function VerifyEmailForm() {

  const router = useRouter()
  const searchParams = useSearchParams()

  const email = searchParams.get("email")

  const [otp,setOtp] = useState("")
  const [loading,setLoading] = useState(false)
  const [error,setError] = useState("")
  const [resendLoading,setResendLoading] = useState(false)
  const [isSuccess,setIsSuccess] = useState(false)

  useEffect(()=>{

    if(!email){
      router.replace("/signup")
    }

  },[email,router])



  const verifyEmail = async (e:React.FormEvent)=>{

    e.preventDefault()

    if(loading) return

    setError("")

    if(!/^\d{6}$/.test(otp)){
      setError("Enter a valid 6-digit code")
      return
    }

    try{

      setLoading(true)

      const res = await fetch(
        `${API_URL}/verify-email`,
        {
          method:"POST",
          headers:{
            "Content-Type":"application/json"
          },
          body:JSON.stringify({ email, otp })
        }
      )

      const data = await res.json()

      if(!res.ok){
        throw new Error(data.message || "Invalid OTP")
      }

      setIsSuccess(true)

      setTimeout(()=>{
        router.push("/login")
      },2000)

    }
    catch(err:any){

      setError(err.message || "Verification failed")

    }
    finally{

      setLoading(false)

    }

  }



  const resendOtp = async ()=>{

    if(resendLoading) return

    setError("")

    try{

      setResendLoading(true)

      const res = await fetch(
        `${API_URL}/register-resend-otp`,
        {
          method:"POST",
          headers:{
            "Content-Type":"application/json"
          },
          body:JSON.stringify({ email })
        }
      )

      const data = await res.json()

      if(!res.ok){
        throw new Error(data.message)
      }

      alert("A new OTP has been sent to your email")

    }
    catch(err:any){

      setError(err.message || "Failed to resend code")

    }
    finally{

      setResendLoading(false)

    }

  }



  return (

    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0b] p-6">

      <div className="w-full max-w-md">

        {/* Header */}

        <div className="text-center mb-10">

          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 mb-4 shadow-lg">
            <ShieldCheck className="text-white"/>
          </div>

          <h1 className="text-3xl font-bold text-white">
            Verify Your Email
          </h1>

          <p className="text-gray-400 text-sm mt-2">
            Enter the code sent to
          </p>

          <p className="text-blue-400 text-sm font-medium">
            {email}
          </p>

        </div>



        <Card className="bg-[#111113] border border-white/10 shadow-xl rounded-2xl">

          <div className="p-8">

            {isSuccess ? (

              <div className="flex flex-col items-center text-center space-y-4">

                <div className="bg-green-500/10 p-3 rounded-full">

                  <CheckCircle2 className="w-10 h-10 text-green-500"/>

                </div>

                <h2 className="text-lg font-semibold text-white">

                  Email Verified

                </h2>

                <p className="text-gray-400 text-sm">

                  Redirecting to login...

                </p>

              </div>

            ) : (

              <form
                onSubmit={verifyEmail}
                className="space-y-6"
              >

                <div className="space-y-2 text-center">

                  <Label className="text-gray-300">

                    6-Digit Verification Code

                  </Label>

                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="000000"
                    value={otp}
                    maxLength={6}
                    onChange={(e)=>
                      setOtp(
                        e.target.value.replace(/\D/g,"")
                      )
                    }
                    className="text-center text-2xl tracking-[0.5em] font-bold h-14 bg-[#0a0a0b] border-white/10 text-white"
                  />

                </div>



                {error && (

                  <div className="flex items-center gap-2 p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg">

                    <AlertCircle className="w-4 h-4"/>

                    {error}

                  </div>

                )}



                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white"
                >

                  {loading
                    ? <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin"/>
                        Verifying...
                      </>
                    : "Verify Account"}

                </Button>



                <div className="text-center">

                  <button
                    type="button"
                    onClick={resendOtp}
                    disabled={resendLoading}
                    className="text-sm text-blue-400 hover:underline"
                  >

                    {resendLoading
                      ? "Sending new code..."
                      : "Didn't receive a code? Resend"}

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



export default function VerifyEmail(){

  return (

    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0b]">
          <Loader2 className="animate-spin text-blue-500 w-10 h-10"/>
        </div>
      }
    >

      <VerifyEmailForm/>

    </Suspense>

  )

}