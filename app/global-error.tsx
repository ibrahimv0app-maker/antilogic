"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error("Anti Logic root error", { digest: error.digest || "unavailable" }); }, [error]);
  return <html lang="en"><body style={{margin:0,padding:24,background:"#090b10",color:"#edf1f7",fontFamily:"Arial,sans-serif"}}><main style={{maxWidth:560,margin:"12vh auto"}}><div style={{color:"#c6f36a",fontSize:12,letterSpacing:2,textTransform:"uppercase"}}>Anti Logic</div><h1 style={{fontSize:36,letterSpacing:-1}}>The application hit an error.</h1><p style={{color:"#929bad",lineHeight:1.8}}>The page could not render. No trading execution is performed by this error screen.</p><button onClick={() => reset()} style={{padding:"12px 16px",borderRadius:9,border:"0",background:"#c6f36a",color:"#10140a",fontWeight:700,cursor:"pointer"}}>Try again</button></main></body></html>;
}
