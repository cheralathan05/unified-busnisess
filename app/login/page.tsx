"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"

import {
  Eye,
  EyeOff,
  Loader2,
  Mail,
  Lock,
  AlertCircle
} from "lucide-react"

import { useAuth } from "@/contexts/auth-context"

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api/auth"

export default function LoginPage() {

  const router = useRouter()

  const {
    login,
    isLoading,
    isAuthenticated,
    isInitialized
  } = useAuth()

  const [email,setEmail] = useState("")
  const [password,setPassword] = useState("")
  const [showPassword,setShowPassword] = useState(false)
  const [error,setError] = useState("")

  useEffect(()=>{

    if(isInitialized && isAuthenticated){
      router.replace("/crm")
    }

  },[isAuthenticated,isInitialized,router])


  const handleSubmit = async (e:React.FormEvent)=>{

    e.preventDefault()

    if(isLoading) return

    setError("")

    const userEmail = email.trim().toLowerCase()
    const userPassword = password.trim()

    if(!userEmail || !userPassword){
      setError("Enter email and password")
      return
    }

    try{

      await login(userEmail,userPassword)

      router.push("/crm")

    }
    catch(err:any){

      setError(err?.message || "Invalid email or password")

    }

  }


  const handleGoogleLogin = ()=>{

    window.location.href =
      `${API_URL}/google`

  }


  if(!isInitialized){

    return(
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500"/>
      </div>
    )

  }


  return (

    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0b] p-6">

      <div className="w-full max-w-md">

        {/* Header */}

        <div className="text-center mb-10">

          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 mb-4 shadow-lg">

            <span className="text-white text-xl font-bold">
              DB
            </span>

          </div>

          <h1 className="text-3xl font-bold text-white">
            Digital Business Brain
          </h1>

          <p className="text-gray-400 text-sm mt-2">
            Sign in to manage your business
          </p>

        </div>


        <Card className="bg-[#111113] border border-white/10 shadow-xl rounded-2xl">

          <div className="p-8">

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Email */}

              <div className="space-y-2">

                <Label className="text-gray-300">Email</Label>

                <div className="relative">

                  <Mail className="absolute left-3 top-3.5 w-4 h-4 text-gray-400"/>

                  <Input
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    disabled={isLoading}
                    onChange={(e)=>setEmail(e.target.value)}
                    className="pl-10 h-11 bg-[#0a0a0b] border-white/10 text-white placeholder:text-gray-500"
                  />

                </div>

              </div>


              {/* Password */}

              <div className="space-y-2">

                <div className="flex justify-between items-center">

                  <Label className="text-gray-300">Password</Label>

                  <Link
                    href="/forgot-password"
                    className="text-xs text-blue-400 hover:underline"
                  >
                    Forgot Password?
                  </Link>

                </div>

                <div className="relative">

                  <Lock className="absolute left-3 top-3.5 w-4 h-4 text-gray-400"/>

                  <Input
                    type={showPassword ? "text":"password"}
                    value={password}
                    disabled={isLoading}
                    onChange={(e)=>setPassword(e.target.value)}
                    className="pl-10 pr-10 h-11 bg-[#0a0a0b] border-white/10 text-white"
                  />

                  <button
                    type="button"
                    onClick={()=>setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 text-gray-400"
                  >

                    {showPassword
                      ? <EyeOff size={18}/>
                      : <Eye size={18}/>}

                  </button>

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
                disabled={isLoading}
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white"
              >

                {isLoading
                  ? <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin"/>
                      Signing in...
                    </>
                  : "Sign In"}

              </Button>


              {/* Divider */}

              <div className="relative my-6">

                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-white/10"/>
                </div>

                <div className="relative flex justify-center text-xs uppercase">

                  <span className="bg-[#111113] px-3 text-gray-500">

                    Or continue with

                  </span>

                </div>

              </div>


              {/* Google */}

              <Button
                type="button"
                variant="outline"
                className="w-full h-11 border-white/10 text-white hover:bg-white/5"
                onClick={handleGoogleLogin}
              >
                Continue with Google
              </Button>

            </form>


            <div className="mt-8 text-center text-sm text-gray-400">

              New here?{" "}

              <Link
                href="/signup"
                className="text-blue-400 font-semibold hover:underline"
              >
                Create account
              </Link>

            </div>

          </div>

        </Card>

      </div>

    </div>

  )

}