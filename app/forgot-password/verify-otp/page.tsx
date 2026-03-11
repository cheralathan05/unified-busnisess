"use client"

import { useState, useEffect, Suspense, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

import {
  Loader2,
  ShieldCheck,
  AlertCircle
} from "lucide-react"

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api/auth"

function VerifyOTPForm() {

  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get("email")

  const inputRef = useRef<HTMLInputElement>(null)

  const [otp,setOtp] = useState("")
  const [loading,setLoading] = useState(false)
  const [error,setError] = useState("")
  const [resendLoading,setResendLoading] = useState(false)
  const [cooldown,setCooldown] = useState(0)

  /*
  ==============================
  Guard: Prevent direct access
  ==============================
  */

  useEffect(()=>{

    if(!email || typeof email !== "string"){
      router.replace("/forgot-password")
    }

  },[email,router])


  /*
  ==============================
  Auto focus input
  ==============================
  */

  useEffect(()=>{
    inputRef.current?.focus()
  },[])


  /*
  ==============================
  Resend cooldown timer
  ==============================
  */

  useEffect(()=>{

    if(cooldown <= 0) return

    const timer = setInterval(()=>{

      setCooldown((prev)=>prev-1)

    },1000)

    return ()=>clearInterval(timer)

  },[cooldown])


  /*
  ==============================
  Verify OTP
  ==============================
  */

  const verifyOtp = async (e?:React.FormEvent)=>{

    e?.preventDefault()

    if(loading) return

    setError("")

    if(otp.length !== 6){
      setError("Enter the 6 digit code")
      return
    }

    try{

      setLoading(true)

      const res = await fetch(
        `${API_URL}/verify-reset-otp`,
        {
          method:"POST",
          headers:{
            "Content-Type":"application/json"
          },
          body:JSON.stringify({
            email,
            otp
          })
        }
      )

      const data = await res.json()

      if(!res.ok){
        throw new Error(data.message)
      }

      /*
      Redirect to reset password
      */

      router.replace(
        `/forgot-password/reset-password?email=${encodeURIComponent(email!)}&otp=${otp}`
      )

    }
    catch(err:any){

      setError(
        err?.message ||
        "Invalid or expired OTP"
      )

    }
    finally{

      setLoading(false)

    }

  }


  /*
  ==============================
  Auto submit when OTP full
  ==============================
  */

  useEffect(()=>{

    if(otp.length === 6){
      verifyOtp()
    }

  },[otp])


  /*
  ==============================
  Resend OTP
  ==============================
  */

  const resendOtp = async ()=>{

    if(resendLoading || cooldown > 0) return

    setError("")

    try{

      setResendLoading(true)

      const res = await fetch(
        `${API_URL}/forgot-password`,
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

      setCooldown(30)

    }
    catch(err:any){

      setError(
        err?.message ||
        "Failed to resend OTP"
      )

    }
    finally{

      setResendLoading(false)

    }

  }



  return(

    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0b] p-6">

      <div className="w-full max-w-md">

        {/* Header */}

        <div className="text-center mb-10">

          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 mb-4 shadow-lg">
            <ShieldCheck className="text-white"/>
          </div>

          <h1 className="text-3xl font-bold text-white">
            Verify Reset Code
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

            <form
              onSubmit={verifyOtp}
              className="space-y-6"
            >

              {/* OTP Input */}

              <div className="space-y-2 text-center">

                <Label className="text-gray-300">
                  6 Digit Code
                </Label>

                <Input
                  ref={inputRef}
                  type="text"
                  inputMode="numeric"
                  placeholder="000000"
                  value={otp}
                  maxLength={6}
                  disabled={loading}
                  onChange={(e)=>
                    setOtp(
                      e.target.value.replace(/\D/g,"")
                    )
                  }
                  className="text-center text-3xl tracking-[0.4em] font-bold h-16 bg-[#0a0a0b] border-white/10 text-white"
                />

              </div>



              {/* Error */}

              {error && (

                <div className="flex gap-2 p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg">

                  <AlertCircle className="w-4 h-4"/>

                  {error}

                </div>

              )}



              {/* Button */}

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
                  : "Verify Code"}

              </Button>

            </form>



            {/* Resend */}

            <div className="mt-6 text-center">

              <button
                onClick={resendOtp}
                disabled={resendLoading || cooldown > 0}
                className="text-sm text-blue-400 hover:underline"
              >

                {resendLoading
                  ? "Sending..."
                  : cooldown > 0
                  ? `Resend in ${cooldown}s`
                  : "Resend Code"}

              </button>

            </div>

          </div>

        </Card>

      </div>

    </div>

  )

}



export default function VerifyOTP(){

  return(

    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0b]">
          <Loader2 className="animate-spin text-blue-500 w-8 h-8"/>
        </div>
      }
    >

      <VerifyOTPForm/>

    </Suspense>

  )

}