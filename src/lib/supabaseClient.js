import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log('🔍 SUPABASE DEBUG:')
console.log('URL:', supabaseUrl ? '✅ Carregada' : '❌ Não encontrada')
console.log('KEY:', supabaseAnonKey ? '✅ Carregada' : '❌ Não encontrada')

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase não configurado. Usando LocalStorage.')
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

if (supabase) {
  console.log('✅ SUPABASE CONECTADO COM SUCESSO!')
} else {
  console.log('❌ SUPABASE NÃO CONECTADO')
}