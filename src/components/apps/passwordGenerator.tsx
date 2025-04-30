"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, KeyRound, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const LOWERCASE_CHARS = "abcdefghijklmnopqrstuvwxyz";
const UPPERCASE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const NUMBER_CHARS = "0123456789";
const SYMBOL_CHARS = '!@#$%^&*()_+-=[]{}:"|,.<>/?';

const PasswordGeneratorApp: React.FC = () => {
    const [password, setPassword] = useState<string>("");
    const [length, setLength] = useState<number>(16);
    const [includeUppercase, setIncludeUppercase] = useState<boolean>(true);
    const [includeLowercase, setIncludeLowercase] = useState<boolean>(true);
    const [includeNumbers, setIncludeNumbers] = useState<boolean>(true);
    const [includeSymbols, setIncludeSymbols] = useState<boolean>(false);

    const generatePassword = useCallback(() => {
        let characterPool = "";
        if (includeLowercase) characterPool += LOWERCASE_CHARS;
        if (includeUppercase) characterPool += UPPERCASE_CHARS;
        if (includeNumbers) characterPool += NUMBER_CHARS;
        if (includeSymbols) characterPool += SYMBOL_CHARS;

        if (characterPool === "") {
            toast.error("Error", {
                description: "Please select at least one character type.",
                duration: 3000,
            });
            setPassword("");
            return;
        }

        let generatedPassword = "";
        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(
                Math.random() * characterPool.length,
            );
            generatedPassword += characterPool[randomIndex];
        }
        setPassword(generatedPassword);
    }, [
        length,
        includeLowercase,
        includeUppercase,
        includeNumbers,
        includeSymbols,
    ]);

    useEffect(() => {
        generatePassword();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleCopy = async () => {
        if (!password) return;
        try {
            await navigator.clipboard.writeText(password);
            toast.success("Copied!", {
                description: "Password copied to clipboard.",
                duration: 2000,
            });
        } catch (err) {
            console.error("Failed to copy password: ", err);
            toast.error("Copy Failed", {
                description: "Could not copy password.",
                duration: 2000,
            });
        }
    };

    return (
        <div className="p-2 h-full w-full flex flex-col">
            <Card className="flex-grow flex flex-col">
                <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <KeyRound className="h-4 w-4" />
                        Password Generator
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col gap-4 pt-4">
                    {/* Generated Password Display */}
                    <div className="relative">
                        <Input
                            type="text"
                            value={password}
                            readOnly
                            placeholder="Generated password will appear here"
                            className="pr-10 text-sm font-mono tracking-wider bg-muted"
                            aria-label="Generated Password"
                        />
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            onClick={handleCopy}
                            disabled={!password}
                            title="Copy password"
                        >
                            <Copy className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Length Slider */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <Label htmlFor="length" className="text-xs">
                                Password Length
                            </Label>
                            <span className="text-sm font-medium">
                                {length}
                            </span>
                        </div>
                        <Slider
                            id="length"
                            min={6}
                            max={40}
                            step={1}
                            value={[length]}
                            onValueChange={(value) => setLength(value[0])}
                            onValueCommit={generatePassword}
                        />
                    </div>

                    {/* Character Type Toggles */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="lowercase"
                                checked={includeLowercase}
                                onCheckedChange={setIncludeLowercase}
                            />
                            <Label
                                htmlFor="lowercase"
                                className="text-xs cursor-pointer"
                            >
                                Include Lowercase (a-z)
                            </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="uppercase"
                                checked={includeUppercase}
                                onCheckedChange={setIncludeUppercase}
                            />
                            <Label
                                htmlFor="uppercase"
                                className="text-xs cursor-pointer"
                            >
                                Include Uppercase (A-Z)
                            </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="numbers"
                                checked={includeNumbers}
                                onCheckedChange={setIncludeNumbers}
                            />
                            <Label
                                htmlFor="numbers"
                                className="text-xs cursor-pointer"
                            >
                                Include Numbers (0-9)
                            </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="symbols"
                                checked={includeSymbols}
                                onCheckedChange={setIncludeSymbols}
                            />
                            <Label
                                htmlFor="symbols"
                                className="text-xs cursor-pointer"
                            >
                                Include Symbols (!@#...)
                            </Label>
                        </div>
                    </div>

                    {/* Regenerate Button */}
                    <Button onClick={generatePassword} className="mt-auto">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Regenerate
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
};

export default PasswordGeneratorApp;
