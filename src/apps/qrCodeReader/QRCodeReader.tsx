"use client";

import React, { useCallback, useRef, useState } from "react";
import jsQR from "jsqr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, QrCode, Upload } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/locales/client";

const QRCodeReader: React.FC = () => {
    const t = useI18n();
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [decodedText, setDecodedText] = useState<string>("");
    const [statusMessage, setStatusMessage] = useState<string>(
        () => t('qrReaderStatusDefault', { count: 1 })
    );
    const [isScanning, setIsScanning] = useState<boolean>(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const scanQRCode = useCallback((imageDataUrl: string) => {
        if (!canvasRef.current) return;
        setStatusMessage(t('qrReaderStatusScanning', { count: 1 }));
        setIsScanning(true);
        setDecodedText("");

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
            setStatusMessage(t('qrReaderStatusErrorContext', { count: 1 }));
            setIsScanning(false);
            return;
        }

        const img = new Image();
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0, img.width, img.height);
            const imageData = ctx.getImageData(0, 0, img.width, img.height);

            try {
                const code = jsQR(
                    imageData.data,
                    imageData.width,
                    imageData.height,
                    {
                        // Try scanning both normal and inverted colors
                        inversionAttempts: "attemptBoth",
                    },
                );

                if (code) {
                    setDecodedText(code.data);
                    setStatusMessage(t('qrReaderStatusDecoded', { count: 1 }));
                } else {
                    setStatusMessage(t('qrReaderStatusNotFound', { count: 1 }));
                }
            } catch (error) {
                console.error("QR Scan Error:", error);
                setStatusMessage(t('qrReaderStatusErrorScan', { count: 1 }));
            }
            setIsScanning(false);
        };
        img.onerror = () => {
            setStatusMessage(t('qrReaderStatusErrorLoad', { count: 1 }));
            setIsScanning(false);
        };
        img.src = imageDataUrl;
    }, [t]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            setStatusMessage(t('qrReaderStatusErrorFiletype', { count: 1 }));
            setImageUrl(null);
            setDecodedText("");
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const url = e.target?.result as string;
            setImageUrl(url);
            scanQRCode(url);
        };
        reader.onerror = () => {
            setStatusMessage(t('qrReaderStatusErrorRead', { count: 1 }));
            setIsScanning(false);
        };
        reader.readAsDataURL(file);
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    const handleCopy = async () => {
        if (!decodedText) return;
        try {
            await navigator.clipboard.writeText(decodedText);
            toast.success(t('qrReaderCopySuccess', { count: 1 }), {
                description: t('qrReaderCopySuccessDesc', { count: 1 }),
                duration: 2000,
            });
        } catch (err) {
            console.error("Failed to copy text: ", err);
            toast.error(t('qrReaderCopyFailed', { count: 1 }), {
                description: t('qrReaderCopyFailedDesc', { count: 1 }),
                duration: 2000,
            });
        }
    };

    return (
        <div className="p-2 h-full w-full flex flex-col">
            <Card className="flex-grow flex flex-col">
                <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <QrCode className="h-4 w-4" />
                        {t('qrReaderTitle', { count: 1 })}
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col gap-3">
                    {/* Hidden File Input */}
                    <Input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                        id="qr-upload"
                    />

                    {/* Upload Button */}
                    <Button
                        onClick={triggerFileInput}
                        variant="outline"
                        disabled={isScanning}
                    >
                        <Upload className="mr-2 h-4 w-4" />
                        {imageUrl ? t('qrReaderUploadButtonDifferent', { count: 1 }) : t('qrReaderUploadButton', { count: 1 })}
                    </Button>

                    {/* Image Preview */}
                    {imageUrl && (
                        <div className="mt-2 border border-border rounded p-2 max-h-40 overflow-auto bg-muted/30">
                            <p className="text-xs text-muted-foreground mb-1">
                                {t('qrReaderPreview', { count: 1 })}
                            </p>
                            {/* Disable next/image warning for local data URL preview */}
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={imageUrl}
                                alt="QR Code Preview"
                                className="max-w-full h-auto mx-auto"
                            />
                        </div>
                    )}

                    {/* Status Message */}
                    <p
                        className={`text-sm mt-2 ${
                            decodedText
                                ? "text-foreground"
                                : "text-muted-foreground"
                        }`}
                    >
                        {isScanning ? t('qrReaderStatusScanning', { count: 1 }) : statusMessage}
                    </p>

                    {/* Decoded Text Area & Copy Button */}
                    {decodedText && (
                        <div className="flex flex-col gap-1 mt-1 flex-grow">
                            <Textarea
                                value={decodedText}
                                readOnly
                                className="w-full flex-grow resize-none text-sm bg-muted font-mono"
                                rows={6}
                                aria-label={t('qrReaderDecodedContentLabel', { count: 1 })}
                            />
                            <Button
                                onClick={handleCopy}
                                size="sm"
                                variant="secondary"
                                className="mt-1 self-end"
                            >
                                <Copy className="mr-2 h-3.5 w-3.5" />
                                {t('qrReaderCopyResult', { count: 1 })}
                            </Button>
                        </div>
                    )}

                    {/* Canvas (Hidden) */}
                    <canvas ref={canvasRef} style={{ display: "none" }}>
                    </canvas>
                </CardContent>
            </Card>
        </div>
    );
};

export default QRCodeReader;
