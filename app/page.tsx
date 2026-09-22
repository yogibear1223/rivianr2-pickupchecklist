import PickupApp from './pickup-app';
import { chatGPTSignInPath } from './chatgpt-auth';
import { inspectionUser } from '@/lib/identity';
export const dynamic='force-dynamic';
export default async function Home(){
 const user=await inspectionUser();
 return <PickupApp signedIn={!!user} userKey={user?.userId||''} signInPath={chatGPTSignInPath('/')} />;
}
