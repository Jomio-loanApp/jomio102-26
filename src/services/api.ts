
import { Capacitor } from '@capacitor/core'
import { CapacitorHttp } from '@capacitor/core'
import { supabase } from '@/lib/supabase'

export async function invokeFunction(functionName: string, payload?: any) {
  const platform = Capacitor.getPlatform()
  console.log(`[API Service] Invoking '${functionName}' on platform: ${platform}`)

  if (platform === 'web') {
    // Use supabase.functions.invoke for web, as it handles CORS correctly there
    console.log('[API Service] Using supabase.functions.invoke for web.')
    try {
      const { data, error } = await supabase.functions.invoke(functionName, { body: payload })
      
      if (error) throw error
      
      console.log('[API Service] supabase.functions.invoke success. Data:', data)
      return { data, error: null }
    } catch (error) {
      console.error('[API Service] supabase.functions.invoke failed:', error)
      return { data: null, error }
    }
  } else {
    // Use CapacitorHttp for native (android, ios), which bypasses CORS
    console.log('[API Service] Using CapacitorHttp for native mobile.')
    
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://uoaqlexshiozfoekwksp.supabase.co'
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvYXFsZXhzaGlvemZvZWt3a3NwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg3OTc0MjMsImV4cCI6MjA2NDM3MzQyM30.uqqvZQuSEe8YLDiJPZCv4JexYmrWBzUur1xoDAEcXQE'
    
    const functionUrl = `${supabaseUrl}/functions/v1/${functionName}`
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token

    const options = {
      url: functionUrl,
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      data: payload || {},
    }
    
    try {
      console.log('[API Service] Using CapacitorHttp.post with options:', { ...options, headers: { ...options.headers, Authorization: token ? 'Bearer HIDDEN_TOKEN' : undefined }})
      const response = await CapacitorHttp.post(options)
      console.log('[API Service] CapacitorHttp raw response:', response)
      
      // The response body from CapacitorHttp is in `response.data`.
      // It might be a string, so we must ensure it's parsed to JSON.
      const responseData = typeof response.data === 'string' ? JSON.parse(response.data) : response.data
      
      console.log('[API Service] CapacitorHttp success. Parsed data:', responseData)
      // Return the data in the same { data, error } format as the JS SDK for consistency.
      return { data: responseData, error: null }
    } catch (error) {
      console.error('[API Service] CapacitorHttp error:', error)
      return { data: null, error: error }
    }
  }
}
