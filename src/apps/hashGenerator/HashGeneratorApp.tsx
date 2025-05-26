"use client";

import React, { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, Hash, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/locales/client";

// Supported algorithms by SubtleCrypto (common ones)
type HashAlgorithm = "SHA-256" | "SHA-512" | "SHA-1"; // SHA-1 included for completeness, though less secure

const HashGeneratorApp: React.FC = () => {
    const t = useI18n();
    const [inputText, setInputText] = useState<string>("");
    const [selectedAlgorithm, setSelectedAlgorithm] = useState<HashAlgorithm>(
        "SHA-256",
    );
    const [hashedOutput, setHashedOutput] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const generateHash = useCallback(async () => {
        // Check for SubtleCrypto availability
        if (!window.crypto?.subtle) {
            toast.error(t('hashGenToastCryptoUnavailable'), {
                description: t('hashGenToastCryptoUnavailableDesc'),
                duration: 5000,
            });
            setHashedOutput(t('hashGenErrorCrypto'));
            setIsLoading(false); // Ensure loading stops
            return;
        }

        if (!inputText) {
            setHashedOutput("");
            return;
        }
        setIsLoading(true);
        setHashedOutput("");

        try {
            const encoder = new TextEncoder();
            const data = encoder.encode(inputText);
            // Now we know window.crypto.subtle exists
            const hashBuffer = await window.crypto.subtle.digest(
                selectedAlgorithm,
                data,
            );

            // Convert ArrayBuffer to hex string
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map((b) =>
                b.toString(16).padStart(2, "0")
            ).join("");
            setHashedOutput(hashHex);
        } catch (error) {
            console.error(`Error generating ${selectedAlgorithm} hash:`, error);
            toast.error(t('hashGenToastHashFailed'), {
                description: t('hashGenToastHashFailedDesc', { algorithm: selectedAlgorithm }),
                duration: 3000,
            });
            setHashedOutput(t('hashGenErrorGeneral'));
        } finally {
            setIsLoading(false);
        }
    }, [inputText, selectedAlgorithm, t]);

    const handleCopy = async () => {
        if (!hashedOutput || hashedOutput === t('hashGenErrorGeneral')) return;
        try {
            await navigator.clipboard.writeText(hashedOutput);
            toast.success(t('hashGenToastCopied'), {
                description: t('hashGenToastCopiedDesc'),
                duration: 2000,
            });
        } catch (err) {
            console.error("Failed to copy hash: ", err);
            toast.error(t('hashGenToastCopyFailed'), {
                description: t('hashGenToastCopyFailedDesc'),
                duration: 2000,
            });
        }
    };

    return (
        <div className="p-2 h-full w-full flex flex-col">
            <Card className="flex-grow flex flex-col">
                <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Hash className="h-4 w-4" />
                        {t('hashGenTitle')}
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col gap-3 pt-4">
                    {/* Input Text Area */}
                    <div>
                        <Label htmlFor="hash-input" className="text-xs">
                            {t('hashGenInputLabel')}
                        </Label>
                        <Textarea
                            id="hash-input"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder={t('hashGenInputPlaceholder')}
                            className="mt-1 resize-none text-sm min-h-[100px]"
                            rows={5}
                        />
                    </div>

                    {/* Algorithm Selection & Generate Button */}
                    <div className="flex items-end gap-2">
                        <div className="flex-grow">
                            <Label htmlFor="hash-algo" className="text-xs">
                                {t('hashGenAlgoLabel')}
                            </Label>
                            <Select
                                value={selectedAlgorithm}
                                onValueChange={(v) =>
                                    setSelectedAlgorithm(v as HashAlgorithm)}
                            >
                                <SelectTrigger id="hash-algo">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="SHA-1">SHA-1</SelectItem>
                                    <SelectItem value="SHA-256">
                                        SHA-256
                                    </SelectItem>
                                    <SelectItem value="SHA-512">
                                        SHA-512
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button
                            onClick={generateHash}
                            disabled={isLoading || !inputText}
                        >
                            <RefreshCw
                                className={`mr-2 h-4 w-4 ${
                                    isLoading ? "animate-spin" : ""
                                }`}
                            />
                            {isLoading ? t('hashGenButtonGenerating') : t('hashGenButton')}
                        </Button>
                    </div>

                    {/* Hashed Output Display */}
                    {hashedOutput && (
                        <div className="mt-2">
                            <Label htmlFor="hash-output" className="text-xs">
                                {t('hashGenOutputLabel', { algorithm: selectedAlgorithm })}
                            </Label>
                            <div className="relative mt-1">
                                <Textarea
                                    id="hash-output"
                                    value={hashedOutput}
                                    readOnly
                                    placeholder={t('hashGenOutputPlaceholder')}
                                    className="pr-10 text-xs font-mono bg-muted resize-none min-h-[80px]"
                                    rows={4}
                                    aria-label={t('hashGenOutputLabel', { algorithm: selectedAlgorithm })}
                                />
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-1 top-1 h-7 w-7 text-muted-foreground hover:text-foreground"
                                    onClick={handleCopy}
                                    disabled={!hashedOutput ||
                                        hashedOutput === t('hashGenErrorGeneral') ||
                                        hashedOutput === t('hashGenErrorCrypto')}
                                    title={t('hashGenCopyHash')}
                                >
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default HashGeneratorApp;
