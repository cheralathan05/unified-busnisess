const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

/*
=====================================
Get Auth Token
=====================================
*/

export const getToken = (): string | null => {
  if (typeof window === "undefined") return null
  return localStorage.getItem("token")
}

/*
=====================================
Build Query String
=====================================
*/

const buildQuery = (params?: Record<string, any>) => {
  if (!params) return ""

  const query = new URLSearchParams(
    Object.entries(params).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null) {
        acc[key] = String(value)
      }
      return acc
    }, {} as Record<string, string>)
  ).toString()

  return query ? `?${query}` : ""
}

/*
=====================================
Main API Fetch Helper
=====================================
*/

export const apiFetch = async <T = any>(
  endpoint: string,
  options: RequestInit = {},
  params?: Record<string, any>
): Promise<T> => {

  const token = getToken()

  try {

    const res = await fetch(`${API_URL}${endpoint}${buildQuery(params)}`, {
      ...options,
      headers: {
        ...(options.body instanceof FormData
          ? {}
          : { "Content-Type": "application/json" }),
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(options.headers || {})
      }
    })

    /*
    Handle Unauthorized
    */

    if (res.status === 401) {

      if (typeof window !== "undefined") {
        localStorage.removeItem("token")
        window.location.href = "/login"
      }

      throw new Error("Unauthorized")
    }

    /*
    Handle No Content
    */

    if (res.status === 204) {
      return null as T
    }

    /*
    Parse Response
    */

    let data

    try {
      data = await res.json()
    } catch {
      data = await res.text()
    }

    /*
    Handle API Error
    */

    if (!res.ok) {
      throw new Error(data?.message || "API request failed")
    }

    return data as T

  } catch (error) {

    console.error("API Error:", error)
    throw error

  }
}

/*
=====================================
Shortcut API Methods
=====================================
*/

export const api = {

  get: <T = any>(endpoint: string, params?: Record<string, any>) =>
    apiFetch<T>(endpoint, { method: "GET" }, params),

  post: <T = any>(endpoint: string, body?: any) =>
    apiFetch<T>(endpoint, {
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body)
    }),

  put: <T = any>(endpoint: string, body?: any) =>
    apiFetch<T>(endpoint, {
      method: "PUT",
      body: body instanceof FormData ? body : JSON.stringify(body)
    }),

  patch: <T = any>(endpoint: string, body?: any) =>
    apiFetch<T>(endpoint, {
      method: "PATCH",
      body: body instanceof FormData ? body : JSON.stringify(body)
    }),

  delete: <T = any>(endpoint: string) =>
    apiFetch<T>(endpoint, {
      method: "DELETE"
    })

}