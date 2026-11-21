import { useEffect } from "react";
import { toast } from "@yusufceng1z/ding-react";
export { toast };
export function useErrorToast(message: string) { useEffect(() => { if (message) toast.error(message, { duration: 6000 }); }, [message]); }
