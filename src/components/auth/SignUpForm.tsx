import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { ReCaptchaProvider } from "@/components/providers/ReCaptchaProvider";

export function SignUpForm() {
  const { executeRecaptcha } = useGoogleReCaptcha();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!executeRecaptcha) return;
    await executeRecaptcha("sign_up");
    // Include recaptchaToken in your sign-up API call
    // ... your sign up logic ...
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* ...your form fields... */}
      <button type="submit">Sign Up</button>
    </form>
  );
}

export default function SignUpFormWithReCaptcha(props: Record<string, unknown>) {
  return (
    <ReCaptchaProvider>
      <SignUpForm {...props} />
    </ReCaptchaProvider>
  );
} 