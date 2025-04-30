"use client";

import React, { useCallback, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
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
import { HardDrive, Ruler, Thermometer, Weight } from "lucide-react";

// Conversion Factors
const lengthFactors: { [key: string]: number } = {
    mm: 1,
    cm: 10,
    m: 1000,
    km: 1000000,
    in: 25.4,
    ft: 304.8,
    mi: 1609344,
};

const weightFactors: { [key: string]: number } = {
    g: 1,
    kg: 1000,
    oz: 28.3495,
    lb: 453.592,
};

const dataFactors: { [key: string]: number } = {
    B: 1,
    KB: 1024,
    MB: 1024 ** 2,
    GB: 1024 ** 3,
    TB: 1024 ** 4,
};

const ConverterApp: React.FC = () => {
    // --- State ---
    // Length
    const [lengthFromUnit, setLengthFromUnit] = useState<string>("cm");
    const [lengthToUnit, setLengthToUnit] = useState<string>("mm");
    const [lengthFromValue, setLengthFromValue] = useState<string>("");
    const [lengthToValue, setLengthToValue] = useState<string>("");

    // Temperature
    const [tempFromUnit, setTempFromUnit] = useState<string>("C");
    const [tempToUnit, setTempToUnit] = useState<string>("F");
    const [tempFromValue, setTempFromValue] = useState<string>("");
    const [tempToValue, setTempToValue] = useState<string>("");

    // Weight
    const [weightFromUnit, setWeightFromUnit] = useState<string>("kg");
    const [weightToUnit, setWeightToUnit] = useState<string>("lb");
    const [weightFromValue, setWeightFromValue] = useState<string>("");
    const [weightToValue, setWeightToValue] = useState<string>("");

    // Data Storage
    const [dataFromUnit, setDataFromUnit] = useState<string>("MB");
    const [dataToUnit, setDataToUnit] = useState<string>("KB");
    const [dataFromValue, setDataFromValue] = useState<string>("");
    const [dataToValue, setDataToValue] = useState<string>("");

    // Base64
    const [textToEncode, setTextToEncode] = useState<string>("");
    const [encodedText, setEncodedText] = useState<string>("");
    const [textToDecode, setTextToDecode] = useState<string>("");
    const [decodedText, setDecodedText] = useState<string>("");
    const [base64Error, setBase64Error] = useState<string | null>(null);

    // --- Generic Conversion Handler ---
    const handleConversion = useCallback(
        (
            valueStr: string,
            fromUnit: string,
            toUnit: string,
            factors: { [key: string]: number },
            setValueFrom: (val: string) => void,
            setValueTo: (val: string) => void,
            isInputFrom: boolean,
        ) => {
            if (isInputFrom) setValueFrom(valueStr);
            else setValueTo(valueStr);

            const value = parseFloat(valueStr);
            if (isNaN(value) || !factors[fromUnit] || !factors[toUnit]) {
                if (isInputFrom) setValueTo("");
                else setValueFrom("");
                return;
            }

            const valueInBase = value * factors[fromUnit];
            const convertedValue = valueInBase / factors[toUnit];

            // Format with reasonable precision, avoid scientific notation for typical ranges
            const formattedValue = Number(convertedValue.toPrecision(6))
                .toString();

            if (isInputFrom) setValueTo(formattedValue);
            else setValueFrom(formattedValue);
        },
        [],
    );

    // --- Temperature Conversion Handler ---
    const handleTempConversion = useCallback(
        (valueStr: string, from: string, to: string, isInputFrom: boolean) => {
            if (isInputFrom) setTempFromValue(valueStr);
            else setTempToValue(valueStr);

            const value = parseFloat(valueStr);
            if (isNaN(value)) {
                if (isInputFrom) setTempToValue("");
                else setTempFromValue("");
                return;
            }

            let result: number;

            if (from === to) {
                result = value;
            } else if (from === "C") {
                result = to === "F" ? value * 9 / 5 + 32 : value + 273.15;
            } else if (from === "F") {
                result = to === "C"
                    ? (value - 32) * 5 / 9
                    : (value - 32) * 5 / 9 + 273.15;
            } else { // from === 'K'
                result = to === "C"
                    ? value - 273.15
                    : (value - 273.15) * 9 / 5 + 32;
            }

            const formattedResult = Number(result.toFixed(2)).toString(); // Format to 2 decimal places

            if (isInputFrom) setTempToValue(formattedResult);
            else setTempFromValue(formattedResult);
        },
        [],
    );

    // --- Base64 Handlers ---
    const handleEncode = useCallback(() => {
        try {
            setEncodedText(btoa(unescape(encodeURIComponent(textToEncode)))); // Handle UTF-8
            setBase64Error(null);
        } catch (error) {
            console.error("Encode error:", error);
            setEncodedText("");
            setBase64Error("Failed to encode text.");
        }
    }, [textToEncode]);

    const handleDecode = useCallback(() => {
        try {
            setDecodedText(decodeURIComponent(escape(atob(textToDecode)))); // Handle UTF-8
            setBase64Error(null);
        } catch (error) {
            console.error("Decode error:", error);
            setDecodedText("");
            setBase64Error("Invalid Base64 string.");
        }
    }, [textToDecode]);

    return (
        <div className="p-2 h-full w-full flex flex-col">
            <Tabs defaultValue="length" className="flex-grow flex flex-col">
                <TabsList className="grid w-full grid-cols-5 mb-2">
                    <TabsTrigger value="length">Length</TabsTrigger>
                    <TabsTrigger value="temperature">Temperature</TabsTrigger>
                    <TabsTrigger value="weight">Weight</TabsTrigger>
                    <TabsTrigger value="data">Data</TabsTrigger>
                    <TabsTrigger value="base64">Base64</TabsTrigger>
                </TabsList>

                {/* --- Length Tab --- */}
                <TabsContent
                    value="length"
                    className="flex-grow p-2 bg-muted/30 rounded"
                >
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <Ruler className="h-4 w-4" /> Length Converter
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Input
                                    type="number"
                                    value={lengthFromValue}
                                    onChange={(e) =>
                                        handleConversion(
                                            e.target.value,
                                            lengthFromUnit,
                                            lengthToUnit,
                                            lengthFactors,
                                            setLengthFromValue,
                                            setLengthToValue,
                                            true,
                                        )}
                                    placeholder="From Value"
                                    className="flex-grow"
                                />
                                <Select
                                    value={lengthFromUnit}
                                    onValueChange={(unit) => {
                                        setLengthFromUnit(unit);
                                        handleConversion(
                                            lengthFromValue,
                                            unit,
                                            lengthToUnit,
                                            lengthFactors,
                                            setLengthFromValue,
                                            setLengthToValue,
                                            true,
                                        );
                                    }}
                                >
                                    <SelectTrigger className="w-[80px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.keys(lengthFactors).map(
                                            (unit) => (
                                                <SelectItem
                                                    key={unit}
                                                    value={unit}
                                                >
                                                    {unit}
                                                </SelectItem>
                                            ),
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                            <p className="text-center text-muted-foreground">
                                =
                            </p>
                            <div className="flex items-center gap-2">
                                <Input
                                    type="number"
                                    value={lengthToValue}
                                    onChange={(e) =>
                                        handleConversion(
                                            e.target.value,
                                            lengthFromUnit,
                                            lengthToUnit,
                                            lengthFactors,
                                            setLengthFromValue,
                                            setLengthToValue,
                                            false,
                                        )}
                                    placeholder="To Value"
                                    className="flex-grow"
                                />
                                <Select
                                    value={lengthToUnit}
                                    onValueChange={(unit) => {
                                        setLengthToUnit(unit);
                                        handleConversion(
                                            lengthFromValue,
                                            lengthFromUnit,
                                            unit,
                                            lengthFactors,
                                            setLengthFromValue,
                                            setLengthToValue,
                                            true,
                                        );
                                    }}
                                >
                                    <SelectTrigger className="w-[80px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.keys(lengthFactors).map(
                                            (unit) => (
                                                <SelectItem
                                                    key={unit}
                                                    value={unit}
                                                >
                                                    {unit}
                                                </SelectItem>
                                            ),
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- Temperature Tab --- */}
                <TabsContent
                    value="temperature"
                    className="flex-grow p-2 bg-muted/30 rounded"
                >
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <Thermometer className="h-4 w-4" />{" "}
                                Temperature Converter
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Input
                                    type="number"
                                    value={tempFromValue}
                                    onChange={(e) =>
                                        handleTempConversion(
                                            e.target.value,
                                            tempFromUnit,
                                            tempToUnit,
                                            true,
                                        )}
                                    placeholder="From Value"
                                    className="flex-grow"
                                />
                                <Select
                                    value={tempFromUnit}
                                    onValueChange={(unit) => {
                                        setTempFromUnit(unit);
                                        handleTempConversion(
                                            tempFromValue,
                                            unit,
                                            tempToUnit,
                                            true,
                                        );
                                    }}
                                >
                                    <SelectTrigger className="w-[80px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="C">°C</SelectItem>
                                        <SelectItem value="F">°F</SelectItem>
                                        <SelectItem value="K">K</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <p className="text-center text-muted-foreground">
                                =
                            </p>
                            <div className="flex items-center gap-2">
                                <Input
                                    type="number"
                                    value={tempToValue}
                                    onChange={(e) =>
                                        handleTempConversion(
                                            e.target.value,
                                            tempFromUnit,
                                            tempToUnit,
                                            false,
                                        )}
                                    placeholder="To Value"
                                    className="flex-grow"
                                />
                                <Select
                                    value={tempToUnit}
                                    onValueChange={(unit) => {
                                        setTempToUnit(unit);
                                        handleTempConversion(
                                            tempFromValue,
                                            tempFromUnit,
                                            unit,
                                            true,
                                        );
                                    }}
                                >
                                    <SelectTrigger className="w-[80px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="C">°C</SelectItem>
                                        <SelectItem value="F">°F</SelectItem>
                                        <SelectItem value="K">K</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- Weight Tab --- */}
                <TabsContent
                    value="weight"
                    className="flex-grow p-2 bg-muted/30 rounded"
                >
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <Weight className="h-4 w-4" />{" "}
                                Weight/Mass Converter
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Input
                                    type="number"
                                    value={weightFromValue}
                                    onChange={(e) =>
                                        handleConversion(
                                            e.target.value,
                                            weightFromUnit,
                                            weightToUnit,
                                            weightFactors,
                                            setWeightFromValue,
                                            setWeightToValue,
                                            true,
                                        )}
                                    placeholder="From Value"
                                    className="flex-grow"
                                />
                                <Select
                                    value={weightFromUnit}
                                    onValueChange={(unit) => {
                                        setWeightFromUnit(unit);
                                        handleConversion(
                                            weightFromValue,
                                            unit,
                                            weightToUnit,
                                            weightFactors,
                                            setWeightFromValue,
                                            setWeightToValue,
                                            true,
                                        );
                                    }}
                                >
                                    <SelectTrigger className="w-[80px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.keys(weightFactors).map(
                                            (unit) => (
                                                <SelectItem
                                                    key={unit}
                                                    value={unit}
                                                >
                                                    {unit}
                                                </SelectItem>
                                            ),
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                            <p className="text-center text-muted-foreground">
                                =
                            </p>
                            <div className="flex items-center gap-2">
                                <Input
                                    type="number"
                                    value={weightToValue}
                                    onChange={(e) =>
                                        handleConversion(
                                            e.target.value,
                                            weightFromUnit,
                                            weightToUnit,
                                            weightFactors,
                                            setWeightFromValue,
                                            setWeightToValue,
                                            false,
                                        )}
                                    placeholder="To Value"
                                    className="flex-grow"
                                />
                                <Select
                                    value={weightToUnit}
                                    onValueChange={(unit) => {
                                        setWeightToUnit(unit);
                                        handleConversion(
                                            weightFromValue,
                                            weightFromUnit,
                                            unit,
                                            weightFactors,
                                            setWeightFromValue,
                                            setWeightToValue,
                                            true,
                                        );
                                    }}
                                >
                                    <SelectTrigger className="w-[80px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.keys(weightFactors).map(
                                            (unit) => (
                                                <SelectItem
                                                    key={unit}
                                                    value={unit}
                                                >
                                                    {unit}
                                                </SelectItem>
                                            ),
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- Data Storage Tab --- */}
                <TabsContent
                    value="data"
                    className="flex-grow p-2 bg-muted/30 rounded"
                >
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <HardDrive className="h-4 w-4" />{" "}
                                Data Storage Converter
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Input
                                    type="number"
                                    value={dataFromValue}
                                    onChange={(e) =>
                                        handleConversion(
                                            e.target.value,
                                            dataFromUnit,
                                            dataToUnit,
                                            dataFactors,
                                            setDataFromValue,
                                            setDataToValue,
                                            true,
                                        )}
                                    placeholder="From Value"
                                    className="flex-grow"
                                />
                                <Select
                                    value={dataFromUnit}
                                    onValueChange={(unit) => {
                                        setDataFromUnit(unit);
                                        handleConversion(
                                            dataFromValue,
                                            unit,
                                            dataToUnit,
                                            dataFactors,
                                            setDataFromValue,
                                            setDataToValue,
                                            true,
                                        );
                                    }}
                                >
                                    <SelectTrigger className="w-[80px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.keys(dataFactors).map(
                                            (unit) => (
                                                <SelectItem
                                                    key={unit}
                                                    value={unit}
                                                >
                                                    {unit}
                                                </SelectItem>
                                            ),
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                            <p className="text-center text-muted-foreground">
                                =
                            </p>
                            <div className="flex items-center gap-2">
                                <Input
                                    type="number"
                                    value={dataToValue}
                                    onChange={(e) =>
                                        handleConversion(
                                            e.target.value,
                                            dataFromUnit,
                                            dataToUnit,
                                            dataFactors,
                                            setDataFromValue,
                                            setDataToValue,
                                            false,
                                        )}
                                    placeholder="To Value"
                                    className="flex-grow"
                                />
                                <Select
                                    value={dataToUnit}
                                    onValueChange={(unit) => {
                                        setDataToUnit(unit);
                                        handleConversion(
                                            dataFromValue,
                                            dataFromUnit,
                                            unit,
                                            dataFactors,
                                            setDataFromValue,
                                            setDataToValue,
                                            true,
                                        );
                                    }}
                                >
                                    <SelectTrigger className="w-[80px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.keys(dataFactors).map(
                                            (unit) => (
                                                <SelectItem
                                                    key={unit}
                                                    value={unit}
                                                >
                                                    {unit}
                                                </SelectItem>
                                            ),
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- Base64 Tab --- */}
                <TabsContent
                    value="base64"
                    className="flex-grow p-2 bg-muted/30 rounded flex flex-col gap-2"
                >
                    <Card className="flex-1 flex flex-col">
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">
                                Encode to Base64
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-grow flex flex-col gap-2">
                            <Label htmlFor="encodeInput" className="text-xs">
                                Text to Encode
                            </Label>
                            <Textarea
                                id="encodeInput"
                                value={textToEncode}
                                onChange={(e) =>
                                    setTextToEncode(e.target.value)}
                                placeholder="Enter text..."
                                className="flex-grow resize-none text-sm"
                                rows={4}
                            />
                            <Button onClick={handleEncode} size="sm">
                                Encode
                            </Button>
                            <Label
                                htmlFor="encodeOutput"
                                className="text-xs mt-2"
                            >
                                Result (Base64)
                            </Label>
                            <Textarea
                                id="encodeOutput"
                                value={encodedText}
                                readOnly
                                className="flex-grow resize-none text-sm bg-muted"
                                rows={4}
                            />
                        </CardContent>
                    </Card>
                    <Card className="flex-1 flex flex-col">
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">
                                Decode from Base64
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-grow flex flex-col gap-2">
                            <Label htmlFor="decodeInput" className="text-xs">
                                Base64 to Decode
                            </Label>
                            <Textarea
                                id="decodeInput"
                                value={textToDecode}
                                onChange={(e) =>
                                    setTextToDecode(e.target.value)}
                                placeholder="Paste Base64..."
                                className="flex-grow resize-none text-sm"
                                rows={4}
                            />
                            <Button onClick={handleDecode} size="sm">
                                Decode
                            </Button>
                            <Label
                                htmlFor="decodeOutput"
                                className="text-xs mt-2"
                            >
                                Result (Text)
                            </Label>
                            <Textarea
                                id="decodeOutput"
                                value={decodedText}
                                readOnly
                                className="flex-grow resize-none text-sm bg-muted"
                                rows={4}
                            />
                            {base64Error && (
                                <p className="text-xs text-destructive mt-1">
                                    {base64Error}
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default ConverterApp;
