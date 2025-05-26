"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSignIn } from "@/application/hooks/useSignIn";
import { useSignUp } from "@/application/hooks/useSignUp";
import { toast } from "sonner";
import { playSound } from "@/infrastructure/lib/utils";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { useI18n } from "@/locales/client";
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

interface AuthFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const SignInForm: React.FC<AuthFormProps> = ({ open, onOpenChange }) => {
    const t = useI18n();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const { signIn, loading, error } = useSignIn();
    const { executeRecaptcha } = useGoogleReCaptcha();

    const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!executeRecaptcha) return;
        await executeRecaptcha("sign_in");
        // Optionally: send recaptchaToken to your backend for verification
        // You can add a fetch to /api/verify-recaptcha here if you want to block sign-in on failure
        const success = await signIn({ identifier: email, password });
        if (success) {
            playSound("/sounds/signed-in.mp3");
            toast(t("signInSuccess", { count: 1 }), {
                description: `${t("signInWelcome", { count: 1 })} (${email})`,
                duration: 6000,
            });
            onOpenChange(false);
        } else if (error) {
            toast(t("signInFailed", { count: 1 }), {
                description: error,
                duration: 6000,
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle><VisuallyHidden>Sign In</VisuallyHidden></DialogTitle>
                    <DialogDescription>
                        {t("signInDesc", { count: 1 })}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSignIn}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="email-signin" className="text-right">
                                {t('authEmailLabel')}
                            </Label>
                            <Input
                                id="email-signin"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="col-span-3"
                                required
                                disabled={loading}
                                autoComplete="username"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="password-signin" className="text-right">
                                {t('authPasswordLabel')}
                            </Label>
                            <Input
                                id="password-signin"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="col-span-3"
                                required
                                disabled={loading}
                                autoComplete="current-password"
                            />
                        </div>
                        {error && (
                            <p className="col-span-4 text-center text-sm text-destructive">
                                {error}
                            </p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading ? t("signIn", { count: 1 }) + "..." : t("signIn", { count: 1 })}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export const SignUpForm: React.FC<AuthFormProps> = ({ open, onOpenChange }) => {
    const t = useI18n();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");
    const { signUp, loading, error, duplicateEmail } = useSignUp();
    const [localError, setLocalError] = useState<string | null>(null);

    const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLocalError(null);
        const success = await signUp({ email, password, username });
        if (success) {
            toast(t("signUpSuccess", { count: 1 }), {
                description: `${t("signUpCheckEmail", { count: 1 })} (${email})`,
                duration: 8000,
            });
            onOpenChange(false);
        } else if (duplicateEmail) {
            setLocalError(t("signUpEmailUsed", { count: 1 }));
        } else if (error) {
            toast("Sign Up Failed", {
                description: error,
                duration: 8000,
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle><VisuallyHidden>Sign Up</VisuallyHidden></DialogTitle>
                    <DialogDescription>
                        {t("signUpDesc", { count: 1 })}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSignUp}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="username-signup" className="text-right">
                                {t('authUsernameLabel')}
                            </Label>
                            <Input
                                id="username-signup"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="col-span-3"
                                required
                                minLength={3}
                                maxLength={20}
                                pattern="^[a-zA-Z0-9_]+$"
                                title="Username can only contain letters, numbers, and underscores."
                                disabled={loading}
                                autoComplete="username"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="email-signup" className="text-right">
                                {t('authEmailLabel')}
                            </Label>
                            <Input
                                id="email-signup"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="col-span-3"
                                required
                                disabled={loading}
                                autoComplete="username"
                                aria-invalid={!!localError}
                                aria-describedby={localError ? "email-signup-error" : undefined}
                            />
                        </div>
                        {localError && (
                            <p id="email-signup-error" className="col-span-4 text-center text-sm text-destructive">
                                {localError}
                            </p>
                        )}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="password-signup" className="text-right">
                                {t('authPasswordLabel')}
                            </Label>
                            <Input
                                id="password-signup"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="col-span-3"
                                required
                                minLength={6}
                                disabled={loading}
                                autoComplete="new-password"
                            />
                        </div>
                        {/* Show other errors (not duplicate email) */}
                        {error && !duplicateEmail && (
                            <p className="col-span-4 text-center text-sm text-destructive">
                                {error}
                            </p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading ? t("signUp", { count: 1 }) + "..." : t("signUp", { count: 1 })}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
