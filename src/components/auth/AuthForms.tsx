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
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/useToast";

interface AuthFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const SignInForm: React.FC<AuthFormProps> = ({ open, onOpenChange }) => {
    const [identifier, setIdentifier] = useState(""); // username or email
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        let signInError = null;
        let userId = null;
        let userEmail = null;
        let userDisplayName = null;
        // Try email login first
        const { data: signInData, error } = await supabase.auth
            .signInWithPassword({
                email: identifier.includes("@") ? identifier : "",
                password,
            });
        if (signInData?.user) {
            userId = signInData.user.id;
            userEmail = signInData.user.email;
            userDisplayName = signInData.user.user_metadata?.username ||
                userEmail?.split("@")[0];
        }
        if (error && !identifier.includes("@")) {
            // Try username login (Supabase doesn't support username login natively, so we need to look up the email by username)
            const { data: userProfile, error: profileError } = await supabase
                .from("profiles")
                .select("email")
                .eq("full_name", identifier)
                .single();
            if (!profileError && userProfile?.email) {
                const { data: signInData2, error: signInError2 } =
                    await supabase.auth.signInWithPassword({
                        email: userProfile.email,
                        password,
                    });
                signInError = signInError2;
                if (signInData2?.user) {
                    userId = signInData2.user.id;
                    userEmail = signInData2.user.email;
                    userDisplayName =
                        signInData2.user.user_metadata?.username ||
                        userEmail?.split("@")[0];
                }
            } else {
                signInError = profileError || { message: "User not found" };
            }
        } else {
            signInError = error;
        }
        // After successful sign in, ensure profiles row exists
        if (!signInError && userId && userEmail) {
            const { data: profileExists } = await supabase
                .from("profiles")
                .select("id")
                .eq("id", userId)
                .maybeSingle();
            if (!profileExists) {
                await supabase.from("profiles").insert({
                    id: userId,
                    full_name: userDisplayName,
                    email: userEmail,
                });
            }
        }
        setLoading(false);
        if (signInError) {
            setError(signInError.message);
            toast({
                title: "Sign In Failed",
                description: signInError.message,
                variant: "destructive",
            });
        } else {
            toast({ title: "Signed In Successfully" });
            onOpenChange(false); // Close dialog on success
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Sign In</DialogTitle>
                    <DialogDescription>
                        Enter your username or email and password to sign in.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSignIn}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label
                                htmlFor="identifier-signin"
                                className="text-right"
                            >
                                Username or Email
                            </Label>
                            <Input
                                id="identifier-signin"
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                className="col-span-3"
                                required
                                disabled={loading}
                                autoComplete="username"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label
                                htmlFor="password-signin"
                                className="text-right"
                            >
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
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        const { data, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    username: username,
                },
            },
        });
        if (signUpError || !data.user) {
            setLoading(false);
            setError(signUpError?.message || "Sign up failed");
            toast({
                title: "Sign Up Failed",
                description: signUpError?.message || "Sign up failed.",
                variant: "destructive",
            });
            return;
        }
        // Insert into profiles
        const { error: profileError } = await supabase.from("profiles")
            .insert({
                id: data.user.id,
                full_name: username,
                email,
            });
        setLoading(false);
        if (profileError) {
            setError(profileError.message);
            toast({
                title: "Profile Creation Failed",
                description: profileError.message,
                variant: "destructive",
            });
        } else {
            toast({
                title: "Sign Up Successful",
                description: "Please check your email to verify your account.",
            });
            onOpenChange(false); // Close dialog on success
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Sign Up</DialogTitle>
                    <DialogDescription>
                        Create a new account. Username must be 3-20 characters
                        (letters, numbers, _).
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSignUp}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label
                                htmlFor="username-signup"
                                className="text-right"
                            >
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
                            <Label
                                htmlFor="email-signup"
                                className="text-right"
                            >
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
                            <Label
                                htmlFor="password-signup"
                                className="text-right"
                            >
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
