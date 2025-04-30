"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eraser, Pen } from "lucide-react"; // Add icons
import { cn } from "@/lib/utils";

const colors = [
    "#000000",
    "#EF4444",
    "#F97316",
    "#EAB308",
    "#22C55E",
    "#3B82F6",
    "#8B5CF6",
];
const brushSizes = [2, 4, 6, 8, 12];

const DrawingPadApp: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const contextRef = useRef<CanvasRenderingContext2D | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState<string>(colors[0]);
    const [brushSize, setBrushSize] = useState<number>(brushSizes[1]);

    // Initialize Canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Adjust for DPI for sharper drawing
        const scale = window.devicePixelRatio;
        canvas.width = Math.floor(canvas.offsetWidth * scale);
        canvas.height = Math.floor(canvas.offsetHeight * scale);

        const context = canvas.getContext("2d");
        if (!context) return;

        context.scale(scale, scale);
        context.lineCap = "round";
        context.strokeStyle = color;
        context.lineWidth = brushSize;
        contextRef.current = context;

        // TODO: Load saved drawing from local storage if implemented
    }, [color, brushSize]);

    const startDrawing = useCallback(
        ({ nativeEvent }: React.MouseEvent | React.TouchEvent) => {
            const { offsetX, offsetY } = getCoordinates(nativeEvent);
            if (
                !contextRef.current || offsetX === undefined ||
                offsetY === undefined
            ) return;
            contextRef.current.beginPath();
            contextRef.current.moveTo(offsetX, offsetY);
            setIsDrawing(true);
        },
        [],
    );

    const finishDrawing = useCallback(() => {
        if (!contextRef.current) return;
        contextRef.current.closePath();
        setIsDrawing(false);
        // TODO: Save drawing state to local storage if implemented
    }, []);

    const draw = useCallback(
        ({ nativeEvent }: React.MouseEvent | React.TouchEvent) => {
            if (!isDrawing || !contextRef.current) return;
            const { offsetX, offsetY } = getCoordinates(nativeEvent);
            if (offsetX === undefined || offsetY === undefined) return;
            contextRef.current.lineTo(offsetX, offsetY);
            contextRef.current.stroke();
        },
        [isDrawing],
    );

    // Helper to get coordinates for both mouse and touch events
    const getCoordinates = (
        event: MouseEvent | TouchEvent,
    ): { offsetX?: number; offsetY?: number } => {
        const canvas = canvasRef.current;
        if (!canvas) return {};
        const rect = canvas.getBoundingClientRect();

        if (event instanceof MouseEvent) {
            return {
                offsetX: event.clientX - rect.left,
                offsetY: event.clientY - rect.top,
            };
        } else if (event.touches && event.touches.length > 0) {
            return {
                offsetX: event.touches[0].clientX - rect.left,
                offsetY: event.touches[0].clientY - rect.top,
            };
        }
        return {};
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const context = contextRef.current;
        if (canvas && context) {
            context.clearRect(
                0,
                0,
                canvas.width / window.devicePixelRatio,
                canvas.height / window.devicePixelRatio,
            );
            // TODO: Clear saved drawing from local storage if implemented
        }
    };

    return (
        <div className="p-1 h-full w-full flex flex-col bg-muted/30">
            <Card className="flex-grow flex flex-col overflow-hidden">
                <CardHeader className="p-2 border-b">
                    <CardTitle className="text-sm font-medium flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            <Pen className="h-4 w-4" /> Drawing Pad
                        </span>
                        {/* Toolbar Area */}
                        <div className="flex items-center gap-2">
                            {/* Color Palette */}
                            <div className="flex items-center gap-1 p-1 bg-background border rounded">
                                {colors.map((c) => (
                                    <button
                                        key={c}
                                        onClick={() => setColor(c)}
                                        className={cn(
                                            "h-5 w-5 rounded-full border transition-transform",
                                            color === c
                                                ? "ring-2 ring-offset-1 ring-primary scale-110"
                                                : "hover:scale-110",
                                        )}
                                        style={{ backgroundColor: c }}
                                        aria-label={`Set color to ${c}`}
                                    />
                                ))}
                            </div>

                            {/* Brush Size */}
                            <div className="flex items-center gap-1 p-1 bg-background border rounded">
                                {brushSizes.map((size) => (
                                    <button
                                        key={size}
                                        onClick={() => setBrushSize(size)}
                                        className={cn(
                                            "h-6 w-6 rounded-full border flex items-center justify-center transition-transform",
                                            brushSize === size
                                                ? "ring-2 ring-offset-1 ring-primary scale-110 bg-accent"
                                                : "hover:scale-110",
                                        )}
                                        aria-label={`Set brush size to ${size}`}
                                    >
                                        <div
                                            className="rounded-full bg-foreground"
                                            style={{
                                                width: `${size}px`,
                                                height: `${size}px`,
                                            }}
                                        >
                                        </div>
                                    </button>
                                ))}
                            </div>

                            {/* Clear Button */}
                            <Button
                                onClick={clearCanvas}
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                            >
                                <Eraser className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-grow p-0 relative bg-white dark:bg-neutral-800 cursor-crosshair">
                    {/* Canvas takes full space */}
                    <canvas
                        ref={canvasRef}
                        className="absolute top-0 left-0 w-full h-full"
                        onMouseDown={startDrawing}
                        onMouseUp={finishDrawing}
                        onMouseMove={draw}
                        onMouseLeave={finishDrawing} // Stop drawing if mouse leaves canvas
                        onTouchStart={startDrawing}
                        onTouchEnd={finishDrawing}
                        onTouchMove={draw}
                    />
                </CardContent>
            </Card>
        </div>
    );
};

export default DrawingPadApp;
 