"use client"

import React,
{
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect
} from "react"

export interface User {
  id:string
  email:string
  name:string
  role?:string
  businessId?:string
}

interface AuthContextType {

  user:User | null
  token:string | null

  isLoading:boolean
  isInitialized:boolean

  login:(email:string,password:string)=>Promise<void>
  signup:(name:string,email:string,password:string,businessName:string)=>Promise<any>
  logout:()=>void

  isAuthenticated:boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api/auth"

export const AuthProvider:React.FC<{children:React.ReactNode}> = ({children}) => {

  const [user,setUser] = useState<User | null>(null)
  const [token,setToken] = useState<string | null>(null)

  const [isLoading,setIsLoading] = useState(false)
  const [isInitialized,setIsInitialized] = useState(false)

  /*
  ===========================
  Restore Session
  ===========================
  */

  useEffect(()=>{

    try{

      const storedUser = localStorage.getItem("user")
      const storedToken = localStorage.getItem("token")

      if(storedUser && storedToken){

        setUser(JSON.parse(storedUser))
        setToken(storedToken)

      }

    }
    catch(err){

      console.error("Auth restore failed",err)

      localStorage.removeItem("user")
      localStorage.removeItem("token")

    }
    finally{

      setIsInitialized(true)

    }

  },[])



  /*
  ===========================
  Login
  ===========================
  */

  const login = useCallback(async(email:string,password:string)=>{

    setIsLoading(true)

    try{

      const res = await fetch(
        `${API_URL}/login`,
        {
          method:"POST",
          headers:{
            "Content-Type":"application/json"
          },
          body:JSON.stringify({
            email,
            password
          })
        }
      )

      const data = await res.json()

      if(!res.ok){
        throw new Error(data.message || "Login failed")
      }

      const userData = data.data.user
      const jwtToken = data.data.token

      setUser(userData)
      setToken(jwtToken)

      localStorage.setItem("user",JSON.stringify(userData))
      localStorage.setItem("token",jwtToken)

    }
    finally{

      setIsLoading(false)

    }

  },[])



  /*
  ===========================
  Signup
  ===========================
  */

  const signup = useCallback(async(
    name:string,
    email:string,
    password:string,
    businessName:string
  )=>{

    setIsLoading(true)

    try{

      const res = await fetch(
        `${API_URL}/register`,
        {
          method:"POST",
          headers:{
            "Content-Type":"application/json"
          },
          body:JSON.stringify({
            name,
            email,
            password,
            businessName
          })
        }
      )

      const data = await res.json()

      if(!res.ok){
        throw new Error(data.message || "Signup failed")
      }

      return data

    }
    finally{

      setIsLoading(false)

    }

  },[])



  /*
  ===========================
  Logout
  ===========================
  */

  const logout = useCallback(()=>{

    setUser(null)
    setToken(null)

    localStorage.removeItem("user")
    localStorage.removeItem("token")

    window.location.href="/login"

  },[])



  return(

    <AuthContext.Provider
      value={{

        user,
        token,

        isLoading,
        isInitialized,

        login,
        signup,
        logout,

        isAuthenticated: !!user && !!token

      }}
    >

      {isInitialized
        ? children
        : (
          <div className="min-h-screen flex items-center justify-center">

            <div className="flex flex-col items-center gap-3">

              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>

              <p className="text-sm text-muted-foreground">

                Initializing...

              </p>

            </div>

          </div>
        )
      }

    </AuthContext.Provider>

  )

}



/*
============================
Hook
============================
*/

export const useAuth = ()=>{

  const context = useContext(AuthContext)

  if(!context){
    throw new Error("useAuth must be used inside AuthProvider")
  }

  return context

}