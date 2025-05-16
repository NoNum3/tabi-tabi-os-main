"use client";
import { useAtomValue } from "jotai";
import { userAtom, profileAtom, authLoadingAtom } from "@/application/atoms/authAtoms";
import { useEffect } from "react";

export const AuthAtomLogger = (): null => {
  const user = useAtomValue(userAtom);
  const profile = useAtomValue(profileAtom);
  const isLoadingAuth = useAtomValue(authLoadingAtom);

  useEffect(() => {
    console.log("[AuthAtomLogger] user:", user);
  }, [user]);

  useEffect(() => {
    console.log("[AuthAtomLogger] profile:", profile);
  }, [profile]);

  useEffect(() => {
    console.log("[AuthAtomLogger] isLoadingAuth:", isLoadingAuth);
  }, [isLoadingAuth]);

  return null;
}; 