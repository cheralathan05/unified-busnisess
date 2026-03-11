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
  User,
  Mail,
  Lock,
  Building2,
  AlertCircle
} from "lucide-react"

import { useAuth } from "@/contexts/auth-context"

export default function SignupPage() {

  const router = useRouter()

  const { signup, isLoading, isAuthenticated, isInitialized } = useAuth()

  const [name,setName] = useState('')
  const [email,setEmail] = useState('')
  const [businessName,setBusinessName] = useState('')
  const [password,setPassword] = useState('')
  const [confirmPassword,setConfirmPassword] = useState('')

  const [showPassword,setShowPassword] = useState(false)
  const [showConfirm,setShowConfirm] = useState(false)

  const [agreeTerms,setAgreeTerms] = useState(false)
  const [error,setError] = useState('')

  useEffect(() => {

    if(isInitialized && isAuthenticated){
      router.push('/crm')
    }

  },[isInitialized,isAuthenticated,router])


  const handleSubmit = async (e:React.FormEvent) => {

    e.preventDefault()

    setError('')

    if(!name || !email || !businessName || !password || !confirmPassword){
      setError('Please fill in all fields')
      return
    }

    if(password !== confirmPassword){
      setError('Passwords do not match')
      return
    }

    if(password.length < 6){
      setError('Password must be at least 6 characters')
      return
    }

    if(!agreeTerms){
      setError('Please accept Terms & Conditions')
      return
    }

    try{

      const normalizedEmail = email.toLowerCase().trim()

      await signup(
        name,
        normalizedEmail,
        password,
        businessName
      )

      router.push(`/verify-email?email=${normalizedEmail}`)

    }
    catch(err:any){

      setError(err?.message || 'Signup failed')

    }

  }



  return (

    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0b] p-6">

      <div className="w-full max-w-md">

        {/* Header */}

        <div className="text-center mb-10">

          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 mb-4 shadow-lg">
            <span className="text-white font-bold text-xl">DB</span>
          </div>

          <h1 className="text-3xl font-bold text-white">
            Create Account
          </h1>

          <p className="text-gray-400 text-sm mt-2">
            Start managing your business intelligently
          </p>

        </div>



        {/* Card */}

        <Card className="bg-[#111113] border border-white/10 shadow-xl rounded-2xl">

          <div className="p-8">

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Name */}

              <div className="space-y-2">

                <Label className="text-gray-300">Full Name</Label>

                <div className="relative">

                  <User className="absolute left-3 top-3 text-gray-400 w-4 h-4"/>

                  <Input
                    placeholder="John Doe"
                    value={name}
                    onChange={(e)=>setName(e.target.value)}
                    className="pl-10 bg-[#0a0a0b] border-white/10 text-white"
                  />

                </div>

              </div>



              {/* Email */}

              <div className="space-y-2">

                <Label className="text-gray-300">Email</Label>

                <div className="relative">

                  <Mail className="absolute left-3 top-3 text-gray-400 w-4 h-4"/>

                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e)=>setEmail(e.target.value)}
                    className="pl-10 bg-[#0a0a0b] border-white/10 text-white"
                  />

                </div>

              </div>



              {/* Business */}

              <div className="space-y-2">

                <Label className="text-gray-300">Business Name</Label>

                <div className="relative">

                  <Building2 className="absolute left-3 top-3 text-gray-400 w-4 h-4"/>

                  <Input
                    placeholder="Your Company"
                    value={businessName}
                    onChange={(e)=>setBusinessName(e.target.value)}
                    className="pl-10 bg-[#0a0a0b] border-white/10 text-white"
                  />

                </div>

              </div>



              {/* Password */}

              <div className="space-y-2">

                <Label className="text-gray-300">Password</Label>

                <div className="relative">

                  <Lock className="absolute left-3 top-3 text-gray-400 w-4 h-4"/>

                  <Input
                    type={showPassword ? "text":"password"}
                    value={password}
                    onChange={(e)=>setPassword(e.target.value)}
                    className="pl-10 pr-10 bg-[#0a0a0b] border-white/10 text-white"
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

                <Label className="text-gray-300">Confirm Password</Label>

                <div className="relative">

                  <Lock className="absolute left-3 top-3 text-gray-400 w-4 h-4"/>

                  <Input
                    type={showConfirm ? "text":"password"}
                    value={confirmPassword}
                    onChange={(e)=>setConfirmPassword(e.target.value)}
                    className="pl-10 pr-10 bg-[#0a0a0b] border-white/10 text-white"
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



              {/* Terms */}

              <label className="flex items-center gap-2 text-sm text-gray-400">

                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e)=>setAgreeTerms(e.target.checked)}
                />

                I agree to Terms & Privacy Policy

              </label>



              {/* Submit */}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >

                {isLoading
                  ? <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin"/>
                      Creating account...
                    </>
                  : "Create Account"}

              </Button>

            </form>



            {/* Login */}

            <div className="mt-6 text-center text-sm text-gray-400">

              Already have an account?{" "}

              <Link
                href="/login"
                className="text-blue-400 font-semibold hover:underline"
              >
                Sign in
              </Link>

            </div>

          </div>

        </Card>

      </div>

    </div>

  )

}