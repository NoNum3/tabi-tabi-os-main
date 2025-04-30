"use client";

import React, { useEffect, useState } from "react";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from "@/components/ui/menubar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Image from "next/image";
// import Clock from "../clock"; // Removed Clock import
import { ThemeToggle } from "../ui/theme-toggle";
import { playSound } from "@/lib/utils";
import { appRegistry } from "@/config/appRegistry";
import { useAtom, useAtomValue } from "jotai";
import { openWindowAtom } from "@/atoms/windowAtoms";
import { useTheme } from "next-themes"; // Import useTheme
import { useChangeLocale, useCurrentLocale, useI18n } from "@/locales/client"; // Import useI18n and locale hooks
import { supabase } from "@/lib/supabaseClient"; // Import supabase
import { authLoadingAtom, profileAtom, userAtom } from "@/atoms/authAtoms"; // Import auth atoms
import { SignInForm, SignUpForm } from "../auth/AuthForms"; // Import auth forms
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton
import { useToast } from "@/hooks/useToast"; // Keep this import
import { AppStoreWindow } from "@/components/appstore/AppStoreWindow";
import { Store } from "lucide-react"; // Import Store icon
import { addedAppIdsAtom } from "@/atoms/dashboardAtoms";
import ResetSystem from "@/components/(settings)/components/ResetSystem";
import { COUNTRIES, weatherDefaultCountryAtom } from "@/atoms/weatherAtom";
import {
  getWeatherForCountry,
  getWeatherIcon,
} from "@/components/(weather)/WeatherWidget";
import { soundEffectsMutedAtom } from "@/atoms/displaySettingsAtoms";
import { Volume2, VolumeX } from "lucide-react";
import { MiniYoutubePlayer } from "@/components/(music)/components/MiniYoutubePlayer";

export function Mainmenu() {
  const t = useI18n(); // Get translation function
  const { toast } = useToast(); // Call the hook here to get the toast function
  const changeLocale = useChangeLocale() as (locale: string) => void;
  const currentLocale = useCurrentLocale();
  // Theme and mount state
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Get the setter for opening windows
  const openWindow = useAtom(openWindowAtom)[1];
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  // Auth state
  const user = useAtomValue(userAtom);
  const profile = useAtomValue(profileAtom);
  const isLoadingAuth = useAtomValue(authLoadingAtom);
  const [signInOpen, setSignInOpen] = useState(false);
  const [signUpOpen, setSignUpOpen] = useState(false);

  // Read the list of added app IDs
  const addedAppIds = useAtomValue(addedAppIdsAtom);

  // Weather state
  const weatherCountry = useAtomValue(weatherDefaultCountryAtom);
  const weatherCountryName =
    COUNTRIES.find((c) => c.code === weatherCountry)?.name || weatherCountry;
  const [weather, setWeather] = useState<
    { temperature: number; weathercode: number } | null
  >(null);

  // Sound state
  const [soundMuted, setSoundMuted] = useAtom(soundEffectsMutedAtom);

  // Effect to set mounted state
  useEffect(() => {
    setMounted(true);
  }, []);

  // Effect to update icon source based on theme *after* mounting
  useEffect(() => {
    if (mounted) {
      // const lightIconSrc = "/icons/white-ico/android-icon-192x192.png";
      // const darkIconSrc = "/icons/dark-ico/android-icon-192x192.png";
      // Set to DARK icon if theme is dark, otherwise set to LIGHT icon
      // setCurrentIconSrc(resolvedTheme === "dark" ? darkIconSrc : lightIconSrc);
    }
  }, [mounted, resolvedTheme]);

  // Fetch weather on mount, when default country changes, or on storage event
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const w = await getWeatherForCountry(weatherCountry);
        setWeather(w);
      } catch {
        setWeather(null);
      }
    };
    fetchWeather();
    // Listen for storage changes (e.g., set as default in weather app)
    const onStorage = (e: StorageEvent) => {
      if (e.key && e.key.includes("weatherDefaultCountry")) fetchWeather();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", fetchWeather);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", fetchWeather);
    };
  }, [weatherCountry]);

  // Function to open an app
  const openApp = (appId: string) => {
    const appConfig = appRegistry[appId];
    if (!appConfig) return;

    playSound("/sounds/open.mp3");
    const windowInstanceId = `${appId}-instance-${Date.now()}`;

    openWindow({
      id: windowInstanceId,
      appId: appId,
      title: t(appId as keyof ReturnType<typeof t>, {}),
      minSize: appConfig.minSize,
      initialSize: appConfig.defaultSize,
      children: React.createElement(appConfig.component, {
        windowId: windowInstanceId,
      }),
    });
  };

  // NEW: Function to open the App Store window
  const openAppStore = () => {
    playSound("/sounds/open.mp3");
    const windowId = "app-store-window"; // Use a fixed ID
    openWindow({
      id: windowId,
      appId: "appStore",
      title: t("appStoreTitle", { count: 1 }),
      initialSize: { width: 800, height: 600 },
      minSize: { width: 500, height: 400 },
      children: <AppStoreWindow />,
    });
  };

  // Function to open URL in the current window
  const openUrl = (url: string) => {
    playSound("/sounds/click.mp3");
    window.open(url, "_blank");
  };

  // Function to open reset dialog
  const openResetDialog = () => {
    playSound("/sounds/click.mp3");
    setResetDialogOpen(true);
  };

  const handleSignOut = async () => {
    playSound("/sounds/click.mp3");
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Sign Out Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: t("signOutSuccess", { count: 1 }) });
    }
  };

  return (
    <>
      <Menubar className="fixed top-0 left-0 right-0 bg-stone-100 border-stone-300 border-b text-black dark:bg-neutral-900 dark:border-neutral-700 dark:text-white z-30 shadow-sm h-9 px-2 flex items-center">
        {/* Weather Icon and Temp */}
        <div
          className="flex items-center cursor-pointer mr-2 select-none"
          onClick={() => openApp("weather")}
          title={`Weather in ${weatherCountryName}`}
        >
          {weather
            ? (
              <>
                <span className="text-xl mr-1">
                  {getWeatherIcon(weather.weathercode)}
                </span>
                <span className="font-semibold text-sm">
                  {weather.temperature}°C
                </span>
                <span className="ml-1 text-xs text-muted-foreground">
                  {weatherCountryName}
                </span>
              </>
            )
            : <span className="text-muted-foreground text-sm">--°C</span>}
        </div>
        <MenubarMenu>
          <MenubarTrigger
            className="text-sm hover:bg-stone-200 focus:bg-stone-200 data-[state=open]:bg-stone-200 dark:hover:bg-neutral-700 dark:focus:bg-neutral-700 dark:data-[state=open]:bg-neutral-700 px-3 py-1.5 rounded"
            onPointerDown={() => playSound("/sounds/click.mp3")}
          >
            {t("menu", { count: 1 })}
          </MenubarTrigger>
          <MenubarContent>
            <MenubarItem
              onSelect={openAppStore}
              className="flex items-center gap-2"
            >
              <Store className="h-4 w-4" />
              {t("appStoreTitle", { count: 1 })}
            </MenubarItem>
            <MenubarSeparator />
            {addedAppIds
              .filter((appId) => appId !== "appStore")
              .map((appId) => {
                const appConfig = appRegistry[appId];
                if (!appConfig) return null;
                return (
                  <MenubarItem
                    key={appId}
                    onSelect={() => openApp(appId)}
                    className="flex items-center gap-2"
                  >
                    <Image
                      src={appConfig.src}
                      alt={t(appId as keyof ReturnType<typeof t>, {})}
                      width={16}
                      height={16}
                    />
                    {t(appId as keyof ReturnType<typeof t>, {})}
                  </MenubarItem>
                );
              })}
            <MenubarSeparator />
            <MenubarItem
              inset
              onSelect={openResetDialog}
              className="text-destructive"
            >
              {t("reset_system", { count: 1 })}
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        {
          /* <MenubarMenu>
          <MenubarTrigger onPointerDown={() => playSound("/sounds/click.mp3")}>
            Bookmark
          </MenubarTrigger>
          <MenubarContent>
            <MenubarItem disabled>Coming Soon</MenubarItem>
          </MenubarContent>
        </MenubarMenu> */
        }
        <MenubarMenu>
          <MenubarTrigger
            className="text-sm hover:bg-stone-200 focus:bg-stone-200 data-[state=open]:bg-stone-200 dark:hover:bg-neutral-700 dark:focus:bg-neutral-700 dark:data-[state=open]:bg-neutral-700 px-3 py-1.5 rounded"
            onPointerDown={() => playSound("/sounds/click.mp3")}
          >
            {t("about", { count: 1 })}
          </MenubarTrigger>
          <MenubarContent>
            <MenubarItem disabled>
              たびたび<MenubarShortcut>v 1.0</MenubarShortcut>
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem
              inset
              onSelect={() =>
                openUrl("https://www.linkedin.com/in/kenny-stevens-abenz")}
            >
              {t("made_with", { count: 1 })}{" "}
              <MenubarShortcut>NoNum3</MenubarShortcut>
            </MenubarItem>
            <MenubarItem
              inset
              onSelect={() => openUrl("https://github.com/NoNum3")}
            >
              {t("github", { count: 1 })}
              <MenubarShortcut>{t("repository", { count: 1 })}</MenubarShortcut>
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger
            className="text-sm hover:bg-stone-200 focus:bg-stone-200 data-[state=open]:bg-stone-200 dark:hover:bg-neutral-700 dark:focus:bg-neutral-700 dark:data-[state=open]:bg-neutral-700 px-3 py-1.5 rounded"
            onPointerDown={() => playSound("/sounds/click.mp3")}
          >
            {t("language", { count: 1 })}{" "}
            ({(currentLocale as string).toUpperCase()})
          </MenubarTrigger>
          <MenubarContent>
            <MenubarItem
              onSelect={() => changeLocale("en")}
              disabled={currentLocale === "en"}
              className={currentLocale === "en" ? "font-semibold" : ""}
            >
              English
            </MenubarItem>
            <MenubarItem
              onSelect={() => changeLocale("zh-TW")}
              disabled={currentLocale === "zh-TW"}
              className={currentLocale === "zh-TW" ? "font-semibold" : ""}
            >
              中文 (繁體)
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <div className="flex-grow"></div>
        <div className="flex items-center gap-2 mr-2">
          {!mounted || isLoadingAuth
            ? (
              <>
                <Skeleton className="h-6 w-24" />
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-sm h-7"
                  onClick={handleSignOut}
                >
                  {t("signOut", { count: 1 })}
                </Button>
              </>
            )
            : user && profile
            ? (
              <MenubarMenu>
                <MenubarTrigger className="text-sm ... px-3 py-1.5 rounded">
                  {profile.full_name || user.email}
                </MenubarTrigger>
                <MenubarContent>
                  <MenubarItem
                    onSelect={handleSignOut}
                    className="text-destructive"
                  >
                    {t("signOut", { count: 1 })}
                  </MenubarItem>
                </MenubarContent>
              </MenubarMenu>
            )
            : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-sm h-7"
                  onClick={() => setSignInOpen(true)}
                >
                  {t("signIn", { count: 1 })}
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  className="text-sm h-7"
                  onClick={() => setSignUpOpen(true)}
                >
                  {t("signUp", { count: 1 })}
                </Button>
              </>
            )}
        </div>
        {/* Mute/Unmute Button */}
        <button
          className="mr-2 flex items-center justify-center w-8 h-8 rounded hover:bg-stone-200 dark:hover:bg-neutral-700 transition"
          title={soundMuted ? "Unmute sound effects" : "Mute sound effects"}
          onClick={() => setSoundMuted((m) => !m)}
          aria-label={soundMuted
            ? "Unmute sound effects"
            : "Mute sound effects"}
        >
          {soundMuted
            ? <VolumeX className="w-5 h-5" />
            : <Volume2 className="w-5 h-5" />}
        </button>
        <div className="mr-2">
          <ThemeToggle />
        </div>
        {/* <Clock /> */} {/* Removed Clock component usage */}
      </Menubar>
      <MiniYoutubePlayer />
      {/* Auth Modals */}
      <SignInForm open={signInOpen} onOpenChange={setSignInOpen} />
      <SignUpForm open={signUpOpen} onOpenChange={setSignUpOpen} />

      {/* Reset Confirmation Dialog */}
      <Dialog
        open={resetDialogOpen}
        onOpenChange={(open) => {
          if (!open) playSound("/sounds/close.mp3");
          setResetDialogOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-md bg-background border border-border z-[2500] shadow">
          <DialogHeader>
            <DialogTitle className="text-destructive">
              {t("reset_dialog_title", { count: 1 })}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {t("reset_dialog_desc", { count: 1 })}
            </DialogDescription>
          </DialogHeader>
          <ResetSystem onComplete={() => setResetDialogOpen(false)} />
          <DialogFooter className="sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                playSound("/sounds/close.mp3");
                setResetDialogOpen(false);
              }}
            >
              {t("reset_dialog_cancel", { count: 1 })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

//
//
//
