
import { Capacitor } from '@capacitor/core'
import { CapacitorHttp } from '@capacitor/core'
import { supabase } from '@/lib/supabase'

// Platform-aware API service that handles both web and native environments
export async function invokeFunction(functionName: string, payload: any = {}) {
  const platform = Capacitor.getPlatform()
  console.log(`[invokeFunction] Calling '${functionName}' on platform: '${platform}'`)

  // Get the current user's token for authenticated requests
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token

  // --- NATIVE MOBILE PLATFORM (Android/iOS) ---
  // Use Capacitor's native HTTP plugin to bypass CORS issues
  if (platform !== 'web') {
    try {
      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${functionName}`

      const options = {
        url: functionUrl,
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        data: payload,
      }

      console.log('[invokeFunction] Using CapacitorHttp.post with options:', { 
        ...options, 
        headers: { ...options.headers, Authorization: token ? 'Bearer HIDDEN_TOKEN' : 'No token' }
      })
      
      const response = await CapacitorHttp.post(options)

      // The response body from CapacitorHttp is in `response.data`.
      // It might be a string, so we must ensure it's parsed to JSON.
      const responseData = typeof response.data === 'string' ? JSON.parse(response.data) : response.data

      console.log('[invokeFunction] CapacitorHttp success. Parsed data:', responseData)
      // Return the data in the same { data, error } format as the JS SDK for consistency.
      return { data: responseData, error: null }

    } catch (e) {
      console.error('[invokeFunction] CapacitorHttp request failed:', e)
      return { data: null, error: e }
    }
  } 
  // --- WEB PLATFORM ---
  // Use the standard Supabase JS SDK for web browsers
  else {
    try {
      console.log('[invokeFunction] Using supabase.functions.invoke for web.')
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: payload,
      })

      if (error) throw error

      console.log('[invokeFunction] supabase.functions.invoke success. Data:', data)
      return { data, error: null }

    } catch(e) {
       console.error('[invokeFunction] supabase.functions.invoke failed:', e)
       return { data: null, error: e }
    }
  }
}
