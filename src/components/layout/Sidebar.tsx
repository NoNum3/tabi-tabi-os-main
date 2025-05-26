"use client";

import React, { useRef, useEffect, useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { profileAtom, userAtom, Profile, updateProfileAtom } from "@/application/atoms/authAtoms";
import { sidebarOpenAtom } from "@/application/atoms/sidebarAtoms";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useI18n, useCurrentLocale } from "@/locales/client";
import { getAppName } from "@/components/apps";
import { AppRegistration } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/infrastructure/lib/utils";
import { addedAppIdsAtom } from "@/application/atoms/dashboardAtoms";
import { toast } from "sonner";
import { appRegistry, AppCategory } from "@/config/appRegistry";
import { supabase } from '@/infrastructure/lib/supabaseClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { UploadIcon, LinkIcon, Trash2Icon } from 'lucide-react';

export const Sidebar: React.FC<{ fixed?: boolean }> = ({ fixed = true }) => {
    const t = useI18n();
    const currentLocale = useCurrentLocale();
    const isOpen = useAtomValue(sidebarOpenAtom);
    const sidebarRef = useRef<HTMLDivElement>(null);

    // Profile state
    const profile = useAtomValue(profileAtom) as Profile | null;
    const user = useAtomValue(userAtom);
    const addedAppIds = useAtomValue(addedAppIdsAtom);
    const setUpdateProfile = useSetAtom(updateProfileAtom);

    // Accessibility: blur focus from sidebar when closing
    useEffect(() => {
        if (!isOpen && sidebarRef.current) {
            const focused = sidebarRef.current.querySelector(":focus") as HTMLElement | null;
            if (focused) focused.blur();
            if (document && document.body) document.body.focus();
        }
    }, [isOpen]);

    // Account age
    let accountAge = "";
    if (user?.created_at) {
        try {
            accountAge = formatDistanceToNow(new Date(user.created_at), { addSuffix: true });
        } catch {
            accountAge = "Error calculating age";
        }
    }

    // Profile picture helpers
    const isValidProfilePicture = (url: string | null | undefined) => {
        return !!url && url.startsWith('http');
    };

    // App list logic (with search)
    const [search, setSearch] = useState("");
    const appEntries = Object.entries(appRegistry).filter(([appId, app]) => {
        if (!search) return true;
        const appRegistration: AppRegistration = {
            id: appId,
            nameKey: app.nameKey,
            src: app.src,
            defaultSize: app.defaultSize,
            minSize: app.minSize,
            category: app.category,
            component: app.component,
        };
        const name = getAppName(appRegistration, t);
        return name.toLowerCase().includes(search.toLowerCase());
    });
    const appsByCategory: Record<AppCategory, typeof appEntries> = {
        Utilities: [],
        Productivity: [],
        Entertainment: [],
        Games: [],
        System: [],
    };
    appEntries.forEach(([appId, app]) => {
        if (appsByCategory[app.category]) {
            appsByCategory[app.category].push([appId, app]);
        }
    });

    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [imageUrl, setImageUrl] = useState("");
    const [urlError, setUrlError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('file');

    // Profile section: Change Username & Reset Password
    const [newUsername, setNewUsername] = useState(profile?.username || "");
    const [usernameLoading, setUsernameLoading] = useState(false);
    const [resetEmail, setResetEmail] = useState(user?.email || "");
    const [resetLoading, setResetLoading] = useState(false);

    // State for modals
    const [usernameModalOpen, setUsernameModalOpen] = useState(false);
    const [passwordModalOpen, setPasswordModalOpen] = useState(false);

    // Change Username handler
    const handleChangeUsername = async () => {
        if (!newUsername.trim()) {
            toast(t('Username cannot be empty', { count: 1 }));
            return;
        }
        setUsernameLoading(true);
        try {
            await setUpdateProfile({ username: newUsername.trim() });
            toast(t('Username updated successfully', { count: 1 }));
        } catch {
            toast(t('Failed to update username', { count: 1 }));
        } finally {
            setUsernameLoading(false);
        }
    };

    // Reset Password handler
    const handleResetPassword = async () => {
        if (!resetEmail.trim()) {
            toast(t('Email cannot be empty', { count: 1 }));
            return;
        }
        setResetLoading(true);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim());
            if (error) throw error;
            toast(t('Password reset email sent', { count: 1 }));
        } catch {
            toast(t('Failed to send password reset email', { count: 1 }));
        } finally {
            setResetLoading(false);
        }
    };

    // Handle avatar click to open modal
    const handleAvatarClick = () => {
        setModalOpen(true);
        setUploadError(null);
        setUrlError(null);
        setImageUrl("");
    };

    // Handle file input change (robust, with extension)
    const handleProfilePicChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) {
            setUploadError(t('No file chosen', { count: 1 }));
            toast(t('No file chosen', { count: 1 }));
            setUploading(false);
            return;
        }
        setUploading(true);
        setUploadError(null);
        setUrlError(null);
        const maxSize = 2 * 1024 * 1024; // 2MB
        if (!file.type.startsWith('image/')) {
            const msg = t('Invalid file type. Please select an image.', { count: 1 });
            setUploadError(msg);
            toast(msg);
            setUploading(false);
            return;
        }
        if (file.size > maxSize) {
            const msg = t('File too large. Max size is 2MB.', { count: 1 });
            setUploadError(msg);
            toast(msg);
            setUploading(false);
            return;
        }
        toast(t('profilePicUploading', { count: 1 }));
        try {
            // Get file extension
            const ext = file.name.split('.').pop() || 'png';
            const filePath = `user-${user.id}.${ext}`;
            // Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage.from('profile-pictures').upload(filePath, file, {
                upsert: true,
                cacheControl: '3600',
                contentType: file.type,
            });
            if (uploadError) throw uploadError;
            // Get public URL
            const { data } = supabase.storage.from('profile-pictures').getPublicUrl(filePath);
            const publicUrl = data?.publicUrl;
            if (!publicUrl) throw new Error('Failed to get public URL');
            // Update profile_picture in profiles table and refetch profile
            await setUpdateProfile({ profile_picture: publicUrl });
            await supabase.from('profiles').update({ last_profile_update: new Date().toISOString() }).eq('id', user.id);
            toast(t('profilePicUploadSuccess', { count: 1 }));
            setModalOpen(false);
        } catch (err: unknown) {
            let message = t('profilePicUploadError', { count: 1 });
            if (err instanceof Error) message = err.message;
            setUploadError(message);
            toast(message);
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    // Handle image URL upload
    const handleUrlUpload = async () => {
        setUploading(true);
        setUploadError(null);
        setUrlError(null);
        // Basic URL validation
        if (!imageUrl.trim() || !/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(imageUrl.trim())) {
            setUrlError(t('Invalid image URL. Must be a direct link to an image.', { count: 1 }));
            setUploading(false);
            return;
        }
        toast(t('profilePicUploading', { count: 1 }));
        try {
            await setUpdateProfile({ profile_picture: imageUrl.trim() });
            await supabase.from('profiles').update({ last_profile_update: new Date().toISOString() }).eq('id', user.id);
            toast(t('profilePicUploadSuccess', { count: 1 }));
            setModalOpen(false);
        } catch (err: unknown) {
            let message = t('profilePicUploadError', { count: 1 });
            if (err instanceof Error) message = err.message;
            setUrlError(message);
            toast(message);
        } finally {
            setUploading(false);
        }
    };

    // Handle delete profile picture (robust, with extension)
    const handleDeleteProfilePic = async () => {
        if (!user || !profile?.profile_picture) return;
        setUploading(true);
        setUploadError(null);
        setUrlError(null);
        try {
            // Extract extension from current profile_picture URL
            const extMatch = profile.profile_picture.match(/user-[^.]+\.(\w+)/);
            const ext = extMatch ? extMatch[1] : 'png';
            const filePath = `user-${user.id}.${ext}`;
            await supabase.storage.from('profile-pictures').remove([filePath]);
            // Set profile_picture to null in DB
            await setUpdateProfile({ profile_picture: null });
            await supabase.from('profiles').update({ last_profile_update: new Date().toISOString() }).eq('id', user.id);
            toast(t('profilePicUploadSuccess', { count: 1 }));
            setModalOpen(false);
        } catch (err: unknown) {
            let message = t('profilePicUploadError', { count: 1 });
            if (err instanceof Error) message = err.message;
            setUploadError(message);
            toast(message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <>
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent>
                    <Card className="p-0 bg-background/95 border-none shadow-none">
                        <DialogHeader className="mb-2">
                            <DialogTitle className="text-lg font-bold mb-1">{t('changeProfilePicture', { count: 1 })}</DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground mb-2">{t('profilePicCriteria', { count: 1 })}</DialogDescription>
                        </DialogHeader>
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-2">
                            <TabsList className="mb-4 w-full flex gap-2">
                                <TabsTrigger value="file" className="flex-1">{t('uploadFile', { count: 1 })}</TabsTrigger>
                                <TabsTrigger value="url" className="flex-1">{t('imageUrl', { count: 1 })}</TabsTrigger>
                            </TabsList>
                            <TabsContent value="file">
                                <div className="flex flex-col gap-3">
                                    <Label htmlFor="profile-pic-upload-modal" className="font-medium mb-1">
                                        {t('uploadFile', { count: 1 })}
                                    </Label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            id="profile-pic-upload-modal"
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleProfilePicChange}
                                            aria-label={t('changeProfilePicture', { count: 1 })}
                                            disabled={uploading}
                                            className="hidden"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={uploading}
                                            className="flex items-center gap-2"
                                            aria-label={t('chooseFile', { count: 1 })}
                                        >
                                            <UploadIcon className="size-4" />
                                            {t('chooseFile', { count: 1 })}
                                        </Button>
                                        <span className="text-xs text-muted-foreground">
                                            {fileInputRef.current?.files?.[0]?.name || t('noFileChosen', { count: 1 })}
                                        </span>
                                    </div>
                                    {activeTab === 'file' && uploadError && (
                                        <div className="text-xs text-red-500 mt-1" role="alert">{uploadError}</div>
                                    )}
                                </div>
                            </TabsContent>
                            <TabsContent value="url">
                                <div className="flex flex-col gap-3">
                                    <Label htmlFor="profile-pic-url" className="font-medium mb-1">
                                        {t('imageUrl', { count: 1 })}
                                    </Label>
                                    <div className="flex items-center gap-2">
                                        <LinkIcon className="size-4 text-muted-foreground" />
                                        <input
                                            id="profile-pic-url"
                                            type="url"
                                            value={imageUrl}
                                            onChange={e => setImageUrl(e.target.value)}
                                            placeholder="https://example.com/avatar.png"
                                            className="input input-bordered w-full text-sm rounded-lg pl-4"
                                            aria-label={t('imageUrl', { count: 1 })}
                                            disabled={uploading}
                                        />
                                    </div>
                                    {activeTab === 'url' && urlError && (
                                        <div className="text-xs text-red-500 mt-1" role="alert">{urlError}</div>
                                    )}
                                </div>
                            </TabsContent>
                        </Tabs>
                        <div className="h-px bg-border my-4" />
                        <DialogFooter className="flex flex-col gap-2 w-full">
                            <div className="flex gap-2 w-full">
                                {profile?.profile_picture && (
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        className="flex-1 flex items-center gap-2"
                                        onClick={handleDeleteProfilePic}
                                        disabled={uploading}
                                        aria-label={t('delete', { count: 1 })}
                                    >
                                        <Trash2Icon className="size-4" />
                                        {t('delete', { count: 1 })}
                                    </Button>
                                )}
                                <DialogClose asChild>
                                    <Button type="button" variant="outline" className="flex-1" disabled={uploading}>
                                        {t('cancel', { count: 1 })}
                                    </Button>
                                </DialogClose>
                                {activeTab === 'file' ? null : (
                                    <Button
                                        type="button"
                                        className="flex-1"
                                        onClick={handleUrlUpload}
                                        disabled={uploading || !imageUrl.trim()}
                                    >
                                        {t('uploadFile', { count: 1 })}
                                    </Button>
                                )}
                            </div>
                        </DialogFooter>
                    </Card>
                </DialogContent>
            </Dialog>
            <aside
                ref={sidebarRef}
                key={currentLocale}
                className={cn(
                    fixed
                        ? "fixed top-0 left-0 h-screen w-64 bg-background/95 shadow-lg border-r border-border z-50"
                        : "w-full h-full bg-background/95 border-r border-border",
                    "flex flex-col transition-transform duration-300 ease-in-out",
                    fixed && (isOpen ? "translate-x-0" : "-translate-x-full")
                )}
                {...(fixed && !isOpen ? { inert: true } : {})}
            >
                {/* Profile section */}
                <div className="p-4 border-b border-border flex-shrink-0 bg-muted/40 rounded-b-lg shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                        <label
                            className="h-10 w-10 rounded-full overflow-hidden border border-muted-foreground shadow-sm flex items-center justify-center bg-muted transition-transform duration-200 hover:scale-105 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus-visible:ring-2 focus-visible:ring-primary relative"
                            aria-label={uploading ? t('Uploading', { count: 1 }) : t('changeProfilePicture', { count: 1 })}
                            tabIndex={0}
                            htmlFor="profile-pic-upload"
                            onClick={handleAvatarClick}
                        >
                            {user && isValidProfilePicture(profile?.profile_picture) ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={profile?.profile_picture ? `${profile.profile_picture}?t=${Date.now()}` : ''}
                                    alt={profile?.username ? `${profile.username}'s profile picture` : "User Avatar"}
                                    width={40}
                                    height={40}
                                    className="object-cover w-full h-full"
                                    style={{ objectFit: 'cover' }}
                                    loading="lazy"
                                />
                            ) : (
                                <span className="text-lg font-bold text-foreground select-none">
                                    {profile?.username?.[0]?.toUpperCase() || "G"}
                                </span>
                            )}
                        </label>
                        <div className="overflow-hidden flex flex-col justify-center">
                            <p className="text-sm font-semibold text-foreground truncate" aria-label="Username">
                                {profile?.username || "Guest"}
                            </p>
                            {accountAge && (
                                <p className="text-xs text-muted-foreground mt-0.5" aria-label="Member since">
                                    {accountAge}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
                {/* Profile section: minimalist with modal triggers */}
                <section className="p-4 border-b border-border bg-background">
                    <h2 className="text-lg font-semibold mb-2">{t('sidebarProfile', { count: 1 })}</h2>
                    <div className="flex flex-col gap-2">
                        <Button
                            type="button"
                            onClick={() => setUsernameModalOpen(true)}
                            aria-label={t('sidebarChangeUsername', { count: 1 })}
                        >
                            {t('sidebarChangeUsername', { count: 1 })}
                        </Button>
                        <Button
                            type="button"
                            onClick={() => setPasswordModalOpen(true)}
                            aria-label={t('sidebarResetPassword', { count: 1 })}
                        >
                            {t('sidebarResetPassword', { count: 1 })}
                        </Button>
                    </div>
                </section>
                {/* Search bar */}
                <div className="p-4 border-b border-border flex-shrink-0 bg-background/80 rounded-b-lg mb-0 pb-0">
                    <input
                        type="text"
                        placeholder={t("appStoreSearch", { count: 1 })}
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="input input-bordered w-full text-sm mb-2 rounded-lg focus:ring-2 focus:ring-primary pl-4"
                        aria-label={t("appStoreSearch", { count: 1 })}
                    />
                </div>
                {/* App list */}
                <nav
                    className="flex flex-col gap-2 p-4 pt-0 mt-0 flex-1 min-h-0 overflow-y-auto custom-scrollbar"
                    role="navigation"
                    aria-label={t("menu", { count: 1 })}
                >
                    {Object.entries(appsByCategory).map(([category, apps]) => (
                        apps.length > 0 && (
                            <div key={category} className="mb-4">
                                <h3
                                    className={cn(
                                        "sticky top-0 text-xs font-semibold uppercase text-muted-foreground px-1 bg-background rounded py-2 transition-shadow shadow-sm"
                                    )}
                                    style={{ zIndex: 2, boxShadow: '0 2px 8px -4px rgba(0,0,0,0.06)', top: 0 }}
                                >
                                    {t(`appStoreCategory${category}`, { count: 1 })}
                                </h3>
                                <div className="flex flex-col gap-1">
                                    {apps.map(([appId, app]) => {
                                        const appRegistration: AppRegistration = {
                                            id: appId,
                                            nameKey: app.nameKey,
                                            src: app.src,
                                            defaultSize: app.defaultSize,
                                            minSize: app.minSize,
                                            category: app.category,
                                            component: app.component,
                                        };
                                        const label = getAppName(appRegistration, t);
                                        return (
                                            <Button
                                                key={currentLocale + '-' + appId}
                                                variant="ghost"
                                                className="justify-start w-full text-sm gap-2 mb-1 rounded-lg transition-all hover:bg-accent/80 hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-primary"
                                                onClick={() => {
                                                    const signInRequiredApps = [
                                                        "notepad",
                                                        "music", // assuming this is the id for YouTube Music
                                                        "bookmarks",
                                                        "calculator",
                                                        "calendar"
                                                    ];
                                                    if (signInRequiredApps.includes(appId) && !user) {
                                                        toast(t('signInRequiredToast', { count: 1 }));
                                                        return;
                                                    }
                                                    const isAvailable = appId in appRegistry && addedAppIds.includes(appId);
                                                    if (!isAvailable) {
                                                        toast(t('appUnavailableToast', { count: 1 }));
                                                        return;
                                                    }
                                                    window.dispatchEvent(new CustomEvent('open-app', { detail: { appId } }));
                                                }}
                                                aria-label={`Open ${label}`}
                                                data-slot="button"
                                                tabIndex={0}
                                            >
                                                <Image
                                                    alt={label}
                                                    loading="lazy"
                                                    width={20}
                                                    height={20}
                                                    src={app.src}
                                                    className="mr-2 rounded shadow-sm"
                                                    style={{ color: "transparent" }}
                                                />
                                                <span className="truncate" title={label}>{label}</span>
                                            </Button>
                                        );
                                    })}
                                </div>
                            </div>
                        )
                    ))}
                </nav>
                {/* App Store button */}
                <div className="p-4 border-t border-border mt-auto flex-shrink-0 bg-background/80 flex justify-center">
                    <Button
                        variant="link"
                        size="sm"
                        className="justify-center p-0 h-auto text-muted-foreground hover:text-primary underline-offset-4 hover:underline py-3"
                        onClick={() => {
                            const event = new CustomEvent("open-app", { detail: { appId: "appStore" } });
                            window.dispatchEvent(event);
                        }}
                        aria-label={t("appStoreTitle", { count: 1 })}
                    >
                        {t("appStoreTitle", { count: 1 })}
                    </Button>
                </div>
            </aside>
            {/* Change Username Modal */}
            <Dialog open={usernameModalOpen} onOpenChange={setUsernameModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('Change Username', { count: 1 })}</DialogTitle>
                    </DialogHeader>
                    <div className="mb-4">
                        <Label htmlFor="username-input">{t('Username', { count: 1 })}</Label>
                        <input
                            id="username-input"
                            type="text"
                            className="w-full mt-1 p-2 border rounded"
                            value={newUsername}
                            onChange={e => setNewUsername(e.target.value)}
                            disabled={usernameLoading}
                            aria-label={t('Change Username', { count: 1 })}
                        />
                    </div>
                    <DialogFooter>
                        <Button onClick={handleChangeUsername} disabled={usernameLoading} aria-label={t('Change Username', { count: 1 })}>
                            {usernameLoading ? t('Saving...', { count: 1 }) : t('Change Username', { count: 1 })}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* Reset Password Modal */}
            <Dialog open={passwordModalOpen} onOpenChange={setPasswordModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('Reset Password', { count: 1 })}</DialogTitle>
                    </DialogHeader>
                    <div className="mb-4">
                        <Label htmlFor="reset-email-input">{t('Email', { count: 1 })}</Label>
                        <input
                            id="reset-email-input"
                            type="email"
                            className="w-full mt-1 p-2 border rounded"
                            value={resetEmail}
                            onChange={e => setResetEmail(e.target.value)}
                            disabled={resetLoading}
                            aria-label={t('Reset Password', { count: 1 })}
                        />
                    </div>
                    <DialogFooter>
                        <Button onClick={handleResetPassword} disabled={resetLoading} aria-label={t('Reset Password', { count: 1 })}>
                            {resetLoading ? t('Sending...', { count: 1 }) : t('Reset Password', { count: 1 })}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};
