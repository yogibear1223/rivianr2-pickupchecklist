import type { Metadata, Viewport } from 'next';
import './globals.css';
export const metadata: Metadata={title:'R2 · Pickup Day',description:'Your private Rivian R2 delivery-day inspection, saved across devices.',applicationName:'R2 Pickup',manifest:'/manifest.webmanifest',appleWebApp:{capable:true,title:'R2 Pickup',statusBarStyle:'black-translucent'},icons:{icon:'/favicon.svg',apple:'/apple-touch-icon.png'},robots:{index:false,follow:false}};
export const viewport:Viewport={width:'device-width',initialScale:1,viewportFit:'cover',themeColor:'#173e32'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
