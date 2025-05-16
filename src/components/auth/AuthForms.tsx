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

interface AuthFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const SignInForm: React.FC<AuthFormProps> = ({ open, onOpenChange }) => {
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
            toast("Signed In Successfully", {
                description: "Welcome back! You have signed in successfully.",
                duration: 6000,
            });
            onOpenChange(false);
        } else if (error) {
            toast("Sign In Failed", {
                description: error,
                duration: 6000,
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Sign In</DialogTitle>
                    <DialogDescription>
                        Enter your email and password to sign in.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSignIn}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="email-signin" className="text-right">
                                Email
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
                                Password
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
                            {loading ? "Signing In..." : "Sign In"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export const SignUpForm: React.FC<AuthFormProps> = ({ open, onOpenChange }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");
    const { signUp, loading, error } = useSignUp();

    const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const success = await signUp({ email, password, username, avatar_url: avatarUrl });
        if (success) {
            toast("Sign Up Successful", {
                description: "Please check your email inbox for a confirmation link to activate your account.",
                duration: 8000,
            });
            onOpenChange(false);
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
                    <DialogTitle>Sign Up</DialogTitle>
                    <DialogDescription>
                        Create a new account. Username must be 3-20 characters
                        (letters, numbers, _). Optionally, add a profile picture URL.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSignUp}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="username-signup" className="text-right">
                                Username
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
                                Email
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
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="password-signup" className="text-right">
                                Password
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
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="avatar-url-signup" className="text-right">
                                Profile Picture URL
                            </Label>
                            <Input
                                id="avatar-url-signup"
                                type="url"
                                value={avatarUrl}
                                onChange={(e) => setAvatarUrl(e.target.value)}
                                className="col-span-3"
                                placeholder="https://example.com/avatar.png"
                                disabled={loading}
                                autoComplete="photo"
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
                            {loading ? "Signing Up..." : "Sign Up"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
