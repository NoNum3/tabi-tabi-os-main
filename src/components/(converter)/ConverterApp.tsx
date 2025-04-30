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
import { useI18n } from "@/locales/client";

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
    const t = useI18n();
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
            setEncodedText(btoa(unescape(encodeURIComponent(textToEncode))));
            setBase64Error(null);
        } catch (error) {
            console.error("Encode error:", error);
            setEncodedText("");
            setBase64Error(t("converter_encode_error", { count: 1 }));
        }
    }, [textToEncode, t]);

    const handleDecode = useCallback(() => {
        try {
            if (!textToDecode.trim()) {
                setDecodedText("");
                setBase64Error(null);
                return;
            }
            // Ensure input only contains valid Base64 characters and padding
            const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
            const cleanedInput = textToDecode.replace(/\s/g, ""); // Remove whitespace
            if (!base64Regex.test(cleanedInput)) {
                throw new DOMException(
                    "Invalid Base64 characters.",
                    "InvalidCharacterError",
                );
            }

            // Ensure correct padding
            let paddedInput = cleanedInput;
            while (paddedInput.length % 4 !== 0) {
                paddedInput += "=";
            }

            // Decode Base64
            const binaryString = atob(paddedInput);
            // Convert binary string to Uint8Array
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            // Decode Uint8Array to UTF-8 string
            const decoder = new TextDecoder("utf-8");
            setDecodedText(decoder.decode(bytes));

            setBase64Error(null); // Clear error on success
        } catch (error) {
            console.error("Decode error:", error);
            setDecodedText(""); // Clear output on error
            if (error instanceof URIError) {
                setBase64Error(t("converter_decode_error_uri", { count: 1 }));
            } else if (
                error instanceof DOMException &&
                error.name === "InvalidCharacterError"
            ) {
                setBase64Error(t("converter_decode_error_char", { count: 1 }));
            } else {
                setBase64Error(t("converter_decode_error_generic", { count: 1 } ));
            }
        }
    }, [textToDecode, t]);

    return (
        <div className="p-2 h-full w-full flex flex-col">
            <Tabs defaultValue="length" className="flex-grow flex flex-col">
                <TabsList className="grid w-full grid-cols-5 mb-2">
                    <TabsTrigger value="length">
                        {t("converter_length", { count: 1 })}
                    </TabsTrigger>
                    <TabsTrigger value="temperature">
                        {t("converter_temperature", { count: 1 })}
                    </TabsTrigger>
                    <TabsTrigger value="weight">
                        {t("converter_weight", { count: 1 })}
                    </TabsTrigger>
                    <TabsTrigger value="data">
                        {t("converter_data", { count: 1 })}
                    </TabsTrigger>
                    <TabsTrigger value="base64">
                        {t("converter_base64", { count: 1 })}
                    </TabsTrigger>
                </TabsList>

                {/* --- Length Tab --- */}
                <TabsContent
                    value="length"
                    className="flex-grow p-2 bg-muted/30 rounded"
                >
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <Ruler className="h-4 w-4" />{" "}
                                {t("converter_length_title", { count: 1 })}
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
                                    placeholder={t("converter_from_value", { count: 1 })}
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
                                    placeholder={t("converter_to_value", { count: 1 })}
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
                                {t("converter_temperature_title", { count: 1 })}
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
                                    placeholder={t("converter_from_value", { count: 1 })}
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
                                    placeholder={t("converter_to_value", { count: 1 })}
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
                                {t("converter_weight_title", { count: 1 })}
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
                                    placeholder={t("converter_from_value", { count: 1 })}
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
                                    placeholder={t("converter_to_value", { count: 1 })}
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
                                {t("converter_data_title", { count: 1 })}
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
                                    placeholder={t("converter_from_value", { count: 1 })}
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
                                    placeholder={t("converter_to_value", { count: 1 })}
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
                                {t("converter_base64_encode_title", { count: 1 })}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-grow flex flex-col gap-2">
                            <Label htmlFor="encodeInput" className="text-xs">
                                {t("converter_text_to_encode", { count: 1 })}
                            </Label>
                            <Textarea
                                id="encodeInput"
                                value={textToEncode}
                                onChange={(e) =>
                                    setTextToEncode(e.target.value)}
                                placeholder={t("converter_enter_text", { count: 1 })}
                                className="flex-grow resize-none text-sm"
                                rows={4}
                            />
                            <Button onClick={handleEncode} size="sm">
                                {t("converter_encode_button", { count: 1 })}
                            </Button>
                            <Label
                                htmlFor="encodeOutput"
                                className="text-xs mt-2"
                            >
                                {t("converter_result_base64", { count: 1 })}
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
                                {t("converter_base64_decode_title", { count: 1 })}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-grow flex flex-col gap-2">
                            <Label htmlFor="decodeInput" className="text-xs">
                                {t("converter_text_to_decode", { count: 1 })}
                            </Label>
                            <Textarea
                                id="decodeInput"
                                value={textToDecode}
                                onChange={(e) =>
                                    setTextToDecode(e.target.value)}
                                placeholder={t("converter_paste_base64", { count: 1 })}
                                className="flex-grow resize-none text-sm"
                                rows={4}
                            />
                            <Button onClick={handleDecode} size="sm">
                                {t("converter_decode_button", { count: 1 })}
                            </Button>
                            <Label
                                htmlFor="decodeOutput"
                                className="text-xs mt-2"
                            >
                                {t("converter_result_text", { count: 1 })}
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
