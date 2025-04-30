"use client";
import React, { useEffect, useState } from "react";
import { loadFeatureState } from "@/utils/storage";
import { useAtom } from "jotai";
import { COUNTRIES, weatherDefaultCountryAtom } from "@/atoms/weatherAtom";
import { useI18n } from "@/locales/client";

const FEATURE_KEY = "weatherDefaultCountry";

const getCountryLatLon = (code: string) => {
    // For demo, use capital city coordinates
    switch (code) {
        case "US":
            return { lat: 38.89511, lon: -77.03637 }; // Washington, DC
        case "GB":
            return { lat: 51.5074, lon: -0.1278 }; // London
        case "JP":
            return { lat: 35.6895, lon: 139.6917 }; // Tokyo
        case "FR":
            return { lat: 48.8566, lon: 2.3522 }; // Paris
        case "DE":
            return { lat: 52.52, lon: 13.405 }; // Berlin
        case "IN":
            return { lat: 28.6139, lon: 77.209 }; // New Delhi
        case "CN":
            return { lat: 39.9042, lon: 116.4074 }; // Beijing
        case "AU":
            return { lat: -35.282, lon: 149.1286 }; // Canberra
        case "CA":
            return { lat: 45.4215, lon: -75.6997 }; // Ottawa
        case "TW":
            return { lat: 25.0330, lon: 121.5654 }; // Taipei
        default:
            return { lat: 0, lon: 0 };
    }
};

const fetchWeather = async (lat: number, lon: number) => {
    // Open-Meteo free API (no key required)
    const url =
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch weather");
    return res.json();
};

// Define a Weather type for the expected shape
interface Weather {
    temperature: number;
    windspeed: number;
    weathercode: number;
}

const WeatherWidget: React.FC = () => {
    const [country, setCountry] = useAtom(weatherDefaultCountryAtom);
    const [weather, setWeather] = useState<Weather | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const t = useI18n();

    const getWeather = async (countryCode: string) => {
        setLoading(true);
        setError(null);
        setWeather(null);
        try {
            const { lat, lon } = getCountryLatLon(countryCode);
            const data = await fetchWeather(lat, lon);
            setWeather(data.current_weather as Weather);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getWeather(country);
    }, [country]);

    const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setCountry(e.target.value);
    };

    // Helper for dynamic translation keys
    type ParamsObject<T = unknown> = { [key: string]: T };
    const translateDynamic = (
        t: (key: string, params?: ParamsObject) => string,
    ): (key: string) => string =>
    (key: string) => t(key, {});

    return (
        <div className="flex flex-col items-center justify-center h-full p-4">
            <h2 className="text-lg font-bold mb-2">
                {t("weather_widget_title", { count: 1 })}
            </h2>
            <div className="mb-4 flex gap-2 items-center">
                <select
                    value={country}
                    onChange={handleCountryChange}
                    className="border rounded px-2 py-1"
                >
                    {COUNTRIES.map((c) => (
                        <option key={c.code} value={c.code}>
                            {translateDynamic(t)(`country_${c.code}`)}
                        </option>
                    ))}
                </select>
            </div>
            <div className="w-full max-w-md bg-muted rounded shadow p-4 flex flex-col items-center">
                {loading && <div>{t("weather_loading", { count: 1 })}</div>}
                {error && <div className="text-red-500">{error}</div>}
                {weather && (
                    <>
                        <div className="text-5xl mb-2">
                            {getForecastInfo(
                                weather.weathercode,
                                translateDynamic(t),
                            ).image}
                        </div>
                        <div className="text-2xl font-bold mb-2">
                            {weather.temperature}°C
                        </div>
                        <div className="text-sm text-muted-foreground mb-2">
                            {t("weather_wind", { count: 1 })}:{" "}
                            {weather.windspeed} km/h
                        </div>
                        <div className="text-base font-medium mt-2">
                            {getForecastInfo(
                                weather.weathercode,
                                translateDynamic(t),
                            ).message}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

// Helper to get weather icon based on weather code (Open-Meteo codes)
export const getWeatherIcon = (weatherCode: number) => {
    // See https://open-meteo.com/en/docs#api_form for codes
    if ([0, 1].includes(weatherCode)) return "☀️"; // Clear
    if ([2, 3].includes(weatherCode)) return "⛅"; // Partly cloudy
    if ([45, 48].includes(weatherCode)) return "🌫️"; // Fog
    if (
        [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(
            weatherCode,
        )
    ) return "🌧️"; // Rain
    if ([71, 73, 75, 77, 85, 86].includes(weatherCode)) return "❄️"; // Snow
    if ([95, 96, 99].includes(weatherCode)) return "⛈️"; // Thunderstorm
    return "❔";
};

// Helper to get default country (for main menu)
export const getDefaultCountry = () => {
    return loadFeatureState<string>(FEATURE_KEY) || "US";
};

// Helper to get weather for a country (for main menu, async)
export const getWeatherForCountry = async (countryCode: string) => {
    const { lat, lon } = getCountryLatLon(countryCode);
    const data = await fetchWeather(lat, lon);
    return data.current_weather;
};

// Helper to get forecast image and message based on weather code
const getForecastInfo = (weatherCode: number, t: (k: string) => string) => {
    if ([0, 1].includes(weatherCode)) {
        return {
            image: "☀️",
            message: t("weather_sunny"),
        };
    }
    if ([2, 3].includes(weatherCode)) {
        return {
            image: "⛅",
            message: t("weather_partly_cloudy"),
        };
    }
    if ([45, 48].includes(weatherCode)) {
        return {
            image: "🌫️",
            message: t("weather_foggy"),
        };
    }
    if ([51, 53, 55, 56, 57, 61, 63, 66, 67, 80, 81].includes(weatherCode)) {
        return {
            image: "🌦️",
            message: t("weather_light_rain"),
        };
    }
    if ([65, 82].includes(weatherCode)) {
        return {
            image: "🌧️",
            message: t("weather_heavy_rain"),
        };
    }
    if ([71, 73, 75, 77, 85, 86].includes(weatherCode)) {
        return {
            image: "❄️",
            message: t("weather_snowy"),
        };
    }
    if ([95, 96, 99].includes(weatherCode)) {
        return {
            image: "⛈️",
            message: t("weather_thunderstorm"),
        };
    }
    return {
        image: "❔",
        message: t("weather_unavailable"),
    };
};

export default WeatherWidget;
