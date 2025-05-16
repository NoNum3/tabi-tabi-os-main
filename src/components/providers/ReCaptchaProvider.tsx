"use client";
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";

export const ReCaptchaProvider = ({ children }: { children: React.ReactNode }) => (
  <GoogleReCaptchaProvider reCaptchaKey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!}>
    {children}
  </GoogleReCaptchaProvider>
); 