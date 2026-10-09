"use client"
import { useEffect, useState } from "react"
import type { ApiRoute, ApiRoutes } from "@/types/api"
import { apiFetch, type ApiRequest } from "@/components/api-client"
export function useResource<R extends ApiRoute>(route:R, request:ApiRequest<R>) {
 const [data,setData]=useState<ApiRoutes[R]["res"]|null>(null)
 const [error,setError]=useState<Error|null>(null)
 const [loading,setLoading]=useState(true)
 const [revision,setRevision]=useState(0)
 const encoded=JSON.stringify(request)
 useEffect(()=>{ let active=true; const controller=new AbortController(); Promise.resolve().then(()=>{if(active){setLoading(true);setError(null)}}); apiFetch(route,{...JSON.parse(encoded),signal:controller.signal}).then(value=>{if(active){setData(value);setLoading(false)}}).catch(reason=>{if(active){setError(reason instanceof Error?reason:new Error("Could not load this view"));setLoading(false)}}); return ()=>{active=false;controller.abort()} },[route,encoded,revision])
 return {data,error,loading,reload:()=>setRevision(n=>n+1),setData}
}
