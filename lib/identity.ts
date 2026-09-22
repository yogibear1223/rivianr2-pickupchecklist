import { headers } from 'next/headers';
import { getChatGPTUser } from '@/app/chatgpt-auth';
// Supervised local preview has no auth dispatcher. This fixture is eliminated
// from production builds; hosted requests always require platform identity.
export async function inspectionUser() {
 const user=await getChatGPTUser();
 if(user)return user;
 if(process.env.NODE_ENV==='development') {
  const host=(await headers()).get('host');
  if(host && ['terminal.local:4173','localhost:4173','127.0.0.1:4173'].includes(host)) return {userId:'local-preview-owner',email:'preview@example.invalid',displayName:'Local preview',fullName:null};
 }
 return null;
}
