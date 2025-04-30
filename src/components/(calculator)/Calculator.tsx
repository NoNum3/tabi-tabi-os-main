"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Copy, Delete } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { useI18n } from "@/locales/client";
import { loadFeatureState, saveFeatureState } from "@/utils/storage";
import { useAtomValue } from "jotai";
import { userAtom } from "@/atoms/authAtoms";
import { supabase } from "@/lib/supabaseClient";

// Define button types for styling
type ButtonType = "number" | "operator" | "action" | "equals";

// Define state structure for persistence
interface CalculatorPersistentState {
    history: { expression: string; result: string }[];
    memory: number;
}

// Update the type for history items to include optional id and created_at
interface CalculatorHistoryItem {
    expression: string;
    result: string;
    id?: string;
    created_at?: string;
}

// Helper function for calculations
const calculate = (
    operand1: number,
    operand2: number,
    operator: string,
): number | string => {
    // Return string for potential errors
    switch (operator) {
        case "+":
            return operand1 + operand2;
        case "-":
            return operand1 - operand2;
        case "*":
            return operand1 * operand2;
        case "/":
            if (operand2 === 0) return "Error: Div by 0";
            return operand1 / operand2;
        default:
            return operand2; // Should not happen
    }
};

const FEATURE_KEY = "calculatorState"; // Define storage key

const Calculator: React.FC = () => {
    const t = useI18n();
    const [displayValue, setDisplayValue] = useState<string>("0");
    const [operand, setOperand] = useState<number | null>(null);
    const [operator, setOperator] = useState<string | null>(null);
    const [waitingForOperand, setWaitingForOperand] = useState<boolean>(false);
    const [expressionDisplay, setExpressionDisplay] = useState<string>(""); // State for the expression string

    // Update useState for history
    const [history, setHistory] = useState<CalculatorHistoryItem[]>(
        () =>
            loadFeatureState<CalculatorPersistentState>(FEATURE_KEY)?.history ||
            [],
    );
    const [memory, setMemory] = useState<number>(
        () =>
            loadFeatureState<CalculatorPersistentState>(FEATURE_KEY)?.memory ||
            0,
    );

    const [isError, setIsError] = useState<boolean>(false);

    const user = useAtomValue(userAtom);

    // Effect to save state whenever history or memory changes
    useEffect(() => {
        saveFeatureState<CalculatorPersistentState>(FEATURE_KEY, {
            history,
            memory,
        });
    }, [history, memory]);

    // Reset error state when input changes
    useEffect(() => {
        if (isError && !displayValue.startsWith("Error")) {
            setIsError(false);
        }
        if (!isError && displayValue.startsWith("Error")) {
            setIsError(true);
        }
    }, [displayValue, isError]);

    // On mount, fetch history from Supabase if logged in
    useEffect(() => {
        if (user) {
            supabase
                .from("calculator_history")
                .select("id, expression, result, created_at")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false })
                .limit(50)
                .then(({ data, error }) => {
                    if (!error && data) {
                        setHistory(
                            data.map((item) => ({
                                expression: item.expression ?? "",
                                result: item.result ?? "",
                                id: item.id !== undefined
                                    ? String(item.id)
                                    : undefined,
                                created_at: item.created_at,
                            })),
                        );
                    }
                });
        } else {
            setHistory(
                loadFeatureState<CalculatorPersistentState>(FEATURE_KEY)
                    ?.history || [],
            );
        }
    }, [user]);

    const getButtonClasses = (
        type: ButtonType,
        label: string,
        activeOperator: string | null,
        className: string = "",
    ): string => {
        let baseClasses =
            "text-lg sm:text-xl h-12 sm:h-14 w-full rounded-md flex items-center justify-center shadow-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed"; // Added ring-offset-background for focus

        const isActiveOperator = type === "operator" &&
            label === activeOperator;

        switch (type) {
            case "number":
                baseClasses +=
                    " bg-muted hover:bg-muted/80 dark:bg-muted/60 dark:hover:bg-muted/80 text-foreground font-medium"; // Adjusted dark mode bg
                break;
            case "operator":
                baseClasses +=
                    " bg-amber-500 hover:bg-amber-600 text-white dark:text-amber-950 font-semibold"; // Ensure dark text on amber in dark mode if needed, or keep white
                if (isActiveOperator) {
                    // Improved active ring style for both modes
                    baseClasses +=
                        " ring-2 ring-offset-2 ring-offset-background ring-amber-500 dark:ring-amber-400";
                }
                break;
            case "action":
                baseClasses +=
                    " bg-secondary hover:bg-secondary/90 dark:hover:bg-secondary/80 text-secondary-foreground"; // Adjusted dark hover
                break;
            case "equals":
                baseClasses +=
                    " bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"; // Seems ok
                break;
            default:
                baseClasses +=
                    " bg-muted hover:bg-muted/80 dark:bg-muted/60 dark:hover:bg-muted/80 text-foreground"; // Match number style for default
        }
        return cn(baseClasses, className);
    };

    // --- Logic Functions ---
    const handleNumberClick = useCallback((num: string) => {
        if (isError) return;
        const currentDisplay = displayValue;
        let newDisplayValue = "";

        if (waitingForOperand) {
            newDisplayValue = num;
            setWaitingForOperand(false);
        } else {
            if (currentDisplay.replace(/[,.]/g, "").length >= 15) return; // Limit digits
            newDisplayValue = currentDisplay === "0"
                ? num
                : currentDisplay + num;
        }

        setDisplayValue(newDisplayValue);

        // Update expression if operator is active (typing second operand)
        if (operator && operand !== null) {
            const displayOperator = operator === "*"
                ? "×"
                : operator === "/"
                ? "÷"
                : operator;
            setExpressionDisplay(
                `${operand} ${displayOperator} ${newDisplayValue}`,
            );
        }
        // If no operator active yet, expression remains empty or as set by equals/operator
    }, [displayValue, waitingForOperand, isError, operator, operand]); // Added operator, operand

    const handleOperatorClick = useCallback((op: string) => {
        if (isError) return;
        const currentValue = parseFloat(displayValue);
        if (isNaN(currentValue)) return;

        let nextOperand: number | null = null;
        let nextExpression = "";

        if (operand !== null && operator && !waitingForOperand) {
            // Chained operation: Calculate intermediate result first
            const intermediateResult = calculate(
                operand,
                currentValue,
                operator,
            );
            if (typeof intermediateResult === "string") { // Handle error
                setDisplayValue(intermediateResult);
                setExpressionDisplay("");
                setOperand(null);
                setOperator(null);
                setWaitingForOperand(false);
                return;
            }
            // Success: Update display with result, set result as next operand
            setDisplayValue(String(intermediateResult));
            nextOperand = intermediateResult;
        } else {
            // First operator: Current display value is the next operand
            nextOperand = currentValue;
        }

        // Set the operand state
        setOperand(nextOperand);

        // Determine and set the expression display *immediately*
        const displayOperator = op === "*" ? "×" : op === "/" ? "÷" : op;
        nextExpression = `${nextOperand} ${displayOperator}`; // e.g., "12 +"
        setExpressionDisplay(nextExpression);

        // Set the operator and waiting state for the next number
        setOperator(op);
        setWaitingForOperand(true);
    }, [displayValue, operand, operator, isError, waitingForOperand]);

    const handleEqualsClick = useCallback(() => {
        if (isError || operator === null || operand === null) {
            if (!waitingForOperand) return;
        }
        const currentValue = parseFloat(displayValue);
        if (isNaN(currentValue)) return;
        const firstOperand = operand ?? 0;
        const result = calculate(firstOperand, currentValue, operator ?? "+");
        const displayOperator = operator === "*"
            ? "×"
            : operator === "/"
            ? "÷"
            : operator;
        const fullExpression = `${firstOperand} ${
            displayOperator ?? ""
        } ${currentValue} =`;
        setExpressionDisplay(fullExpression);
        if (typeof result === "string") {
            setDisplayValue(result);
            if (user) {
                supabase.from("calculator_history").insert({
                    user_id: user.id,
                    expression: fullExpression,
                    result: result,
                }).then(() => {
                    // Refresh history
                    supabase
                        .from("calculator_history")
                        .select("id, expression, result, created_at")
                        .eq("user_id", user.id)
                        .order("created_at", { ascending: false })
                        .limit(50)
                        .then(({ data, error }) => {
                            if (!error && data) {
                                setHistory(
                                    data.map((item) => ({
                                        expression: item.expression ?? "",
                                        result: item.result ?? "",
                                        id: item.id !== undefined
                                            ? String(item.id)
                                            : undefined,
                                        created_at: item.created_at,
                                    })),
                                );
                            }
                        });
                });
            } else {
                setHistory((prev) =>
                    [
                        { expression: fullExpression, result: String(result) },
                        ...prev,
                    ]
                        .slice(0, 50)
                );
            }
            setOperand(null);
        } else {
            const resultString = String(result);
            setDisplayValue(resultString);
            if (user) {
                supabase.from("calculator_history").insert({
                    user_id: user.id,
                    expression: fullExpression,
                    result: resultString,
                }).then(() => {
                    // Refresh history
                    supabase
                        .from("calculator_history")
                        .select("id, expression, result, created_at")
                        .eq("user_id", user.id)
                        .order("created_at", { ascending: false })
                        .limit(50)
                        .then(({ data, error }) => {
                            if (!error && data) {
                                setHistory(
                                    data.map((item) => ({
                                        expression: item.expression ?? "",
                                        result: item.result ?? "",
                                        id: item.id !== undefined
                                            ? String(item.id)
                                            : undefined,
                                        created_at: item.created_at,
                                    })),
                                );
                            }
                        });
                });
            } else {
                setHistory((prev) =>
                    [
                        { expression: fullExpression, result: resultString },
                        ...prev,
                    ].slice(0, 50)
                );
            }
            setOperand(result);
        }
        setOperator(null);
        setWaitingForOperand(true);
    }, [displayValue, operand, operator, isError, waitingForOperand, user]);

    const handleClearClick = useCallback(() => {
        setDisplayValue("0");
        setOperand(null);
        setOperator(null);
        setWaitingForOperand(false);
        setIsError(false);
        setExpressionDisplay(""); // Clear expression display
        // setHistory([]); // Optional history clear
        // setMemory(0); // Optional memory clear
    }, []); // Removed setters

    const handleClearEntryClick = useCallback(() => {
        setDisplayValue("0");
        setIsError(false);
        // If an operator was active, revert expression to just "operand op"
        if (operator && operand !== null) {
            const displayOperator = operator === "*"
                ? "×"
                : operator === "/"
                ? "÷"
                : operator;
            setExpressionDisplay(`${operand} ${displayOperator}`);
            // Keep waiting for operand true if CE is pressed after an operator
            // But if CE is pressed mid-second-operand typing, allow new input? -> Let's keep it simple: CE resets display, keeps state
            setWaitingForOperand(true);
        } else {
            // If no operator, clear expression completely (clearing first number)
            setExpressionDisplay("");
        }
        // If we were waiting for an operand and cleared the display, keep waiting.
        // If we were *not* waiting, clearing the display means we start fresh.
        // The logic above handles setting waitingForOperand = true if operator is set.
    }, [operator, operand]); // Removed displayValue dependency

    const handleDecimalClick = useCallback(() => {
        if (isError) return;
        if (!displayValue.includes(".")) {
            if (displayValue.length >= 14) return;
            if (waitingForOperand) {
                setDisplayValue("0.");
                setWaitingForOperand(false);
            } else {
                setDisplayValue((prev) => prev + ".");
            }
        }
    }, [displayValue, waitingForOperand, isError]);

    const handlePlusMinusClick = useCallback(() => {
        if (isError) return;
        if (displayValue !== "0") {
            setDisplayValue((prev) => String(parseFloat(prev) * -1));
        }
    }, [displayValue, isError]);

    // --- Unary Operation Handler (Moved Before handlePercentClick) ---
    const applyUnaryOperation = useCallback((
        operation: (val: number) => number | string,
        input?: number,
        operationSymbol?: string, // e.g., "sqrt"
    ) => {
        if (isError) return;
        const currentValue = input ?? parseFloat(displayValue);
        if (isNaN(currentValue)) return;

        const result = operation(currentValue);

        // Set expression based on operation
        if (operationSymbol) {
            setExpressionDisplay(`${operationSymbol}(${currentValue})`);
        } else {
            setExpressionDisplay(""); // Clear expression for other unary ops if no symbol provided
        }

        if (typeof result === "string") {
            setDisplayValue(result);
            setOperand(null);
            setOperator(null);
            setWaitingForOperand(true);
        } else {
            setDisplayValue(String(result));
            setOperand(result); // Result becomes new operand
            setOperator(null);
            setWaitingForOperand(true);
        }
    }, [displayValue, isError]);

    // This now correctly references the initialized applyUnaryOperation
    const handlePercentClick = useCallback(() => {
        if (isError) return;
        // Update expression for percentage operation
        setExpressionDisplay(`${displayValue}%`);
        applyUnaryOperation((val) => val / 100);
    }, [isError, displayValue, applyUnaryOperation]); // Added displayValue dependency

    const handleBackspaceClick = useCallback(() => {
        if (isError) return;
        const newValue = displayValue.length > 1
            ? displayValue.slice(0, -1)
            : "0";
        setDisplayValue(newValue);

        if (newValue === "0") {
            // If backspace resulted in "0", reset waiting state
            setWaitingForOperand(false);
        }

        // Update expression if operator is active (editing second operand)
        if (operator && operand !== null) {
            const displayOperator = operator === "*"
                ? "×"
                : operator === "/"
                ? "÷"
                : operator;
            setExpressionDisplay(`${operand} ${displayOperator} ${newValue}`);
        } else {
            // If editing the first operand, clear the expression
            setExpressionDisplay("");
        }
    }, [displayValue, isError, operator, operand]); // Added operator, operand

    // --- Memory Functions ---
    const handleMemoryClear = useCallback(() => setMemory(0), []);
    const handleMemoryRecall = useCallback(() => {
        if (isError) return;
        setDisplayValue(String(memory));
        setWaitingForOperand(false);
    }, [memory, isError]);
    const handleMemoryAdd = useCallback(() => {
        if (isError) return;
        const currentValue = parseFloat(displayValue);
        if (!isNaN(currentValue)) setMemory((prev) => prev + currentValue);
    }, [displayValue, isError]);
    const handleMemorySubtract = useCallback(() => {
        if (isError) return;
        const currentValue = parseFloat(displayValue);
        if (!isNaN(currentValue)) setMemory((prev) => prev - currentValue);
    }, [displayValue, isError]);

    // --- Clipboard --- //
    const copyToClipboard = useCallback(async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            // console.log('Copied:', text);
        } catch (err) {
            console.error("Failed to copy text: ", err);
        }
    }, []);

    // --- Define Button Handlers Map ---
    const buttonHandlers: { [label: string]: () => void } = {
        "MC": handleMemoryClear,
        "MR": handleMemoryRecall,
        "M+": handleMemoryAdd,
        "M-": handleMemorySubtract,
        "CE": handleClearEntryClick,
        "C": handleClearClick,
        "DEL": handleBackspaceClick,
        "%": handlePercentClick,
        "sqrt": () =>
            applyUnaryOperation((val) => Math.sqrt(val), undefined, "sqrt"),
        "sqr": () => applyUnaryOperation((val) => val * val, undefined, "sqr"),
        "1/x": () => applyUnaryOperation((val) => 1 / val, undefined, "1/"),
        "negate": handlePlusMinusClick,
        "/": () => handleOperatorClick("/"),
        "*": () => handleOperatorClick("*"),
        "-": () => handleOperatorClick("-"),
        "+": () => handleOperatorClick("+"),
        "=": handleEqualsClick,
        "7": () => handleNumberClick("7"),
        "8": () => handleNumberClick("8"),
        "9": () => handleNumberClick("9"),
        "4": () => handleNumberClick("4"),
        "5": () => handleNumberClick("5"),
        "6": () => handleNumberClick("6"),
        "1": () => handleNumberClick("1"),
        "2": () => handleNumberClick("2"),
        "3": () => handleNumberClick("3"),
        "0": () => handleNumberClick("0"),
        ".": handleDecimalClick,
    };

    // --- Keyboard Support --- //
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            const key = event.key;

            if (!isNaN(parseInt(key))) {
                handleNumberClick(key);
            } else if (key === ".") {
                handleDecimalClick();
            } else if (
                key === "+" || key === "-" || key === "*" || key === "/"
            ) {
                handleOperatorClick(key);
            } else if (key === "Enter" || key === "=") {
                event.preventDefault(); // Prevent form submission if inside one
                handleEqualsClick();
            } else if (key === "Backspace") {
                handleBackspaceClick();
            } else if (key === "Escape") {
                handleClearClick();
            } else if (key === "%") {
                handlePercentClick();
            }
            // Add more shortcuts if needed (e.g., +/-)
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [
        handleNumberClick,
        handleDecimalClick,
        handleOperatorClick,
        handleEqualsClick,
        handleBackspaceClick,
        handleClearClick,
        handlePercentClick,
    ]);

    // --- Display Formatting --- //
    const formatDisplayValue = (value: string): string => {
        if (value.startsWith("Error")) return value;
        try {
            // Attempt to format as number, preserving precision
            const num = parseFloat(value);
            if (isNaN(num)) return value; // Should not happen if not Error

            // Format with commas, handle decimals
            const parts = value.split(".");
            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            let formatted = parts.join(".");

            // Limit display length intelligently (e.g., keep significant digits)
            if (formatted.length > 20) {
                // Use exponential notation for very large/small numbers if needed
                if (
                    Math.abs(num) > 1e15 || (Math.abs(num) < 1e-6 && num !== 0)
                ) {
                    formatted = num.toExponential(9); // Limit precision
                } else {
                    // Truncate if too long but not needing exponential
                    formatted = formatted.slice(0, 20) + "...";
                }
            }
            return formatted;
        } catch { // Remove unused 'e'
            /*(e)*/ return value; // Fallback if formatting fails
        }
    };

    // Define the type for button layout items more accurately
    type ButtonLayoutItem =
        | string
        | {
            label: string;
            children?: React.ReactNode; // Make children optional
            variant?:
                | "default"
                | "secondary"
                | "outline"
                | "destructive"
                | "ghost"
                | "link"
                | null;
            className?: string;
        };

    const buttonLayout: ButtonLayoutItem[][] = [
        // Use translation keys for display content
        [
            // { label: "MC", children: t("calculator_memory_clear") },
            { label: "MC", children: t("calculator_memory_clear", { count: 1 }) },
            { label: "MR", children: t("calculator_memory_recall", { count: 1 }) },
            { label: "M-", children: t("calculator_memory_subtract", { count: 1 }) },
            { label: "M+", children: t("calculator_memory_add", { count: 1 }) },
        ],
        [
            { label: "CE", children: t("calculator_clear_entry", { count: 1 }) },
            { label: "C", children: t("calculator_clear_all", { count: 1 }) },
            { label: "DEL", children: <Delete className="h-5 w-5" /> },
            { label: "/", children: t("calculator_divide", { count: 1 }) },
        ],
        [
            { label: "%", children: t("calculator_percent", { count: 1 }) },
            { label: "sqrt", children: t("calculator_sqrt", { count: 1 }) },
            { label: "sqr", children: t("calculator_squared", { count: 1 }) },
            { label: "1/x", children: t("calculator_reciprocal", { count: 1 }) },
        ],
        [
            { label: "7" },
            { label: "8" },
            { label: "9" },
            { label: "*", children: t("calculator_multiply", { count: 1 }) },
        ],
        [
            { label: "4" },
            { label: "5" },
            { label: "6" },
            { label: "-", children: t("calculator_subtract", { count: 1 }) },
        ],
        [
            { label: "1" },
            { label: "2" },
            { label: "3" },
            { label: "+", children: t("calculator_add", { count: 1 }) },
        ],
        [
            { label: "negate", children: t("calculator_negate", { count: 1 }) },
            { label: "0" },
            { label: ".", children: t("calculator_decimal", { count: 1 }) },
            {
                label: "=",
                children: t("calculator_equals", { count: 1 }),
                variant: "default",
                className: "bg-primary hover:bg-primary/90",
            },
        ],
    ];

    const handleDeleteHistory = async (itemIndexOrId: number | string) => {
        if (user) {
            // If using Supabase, itemIndexOrId is the id from the DB
            await supabase.from("calculator_history").delete().eq(
                "id",
                Number(itemIndexOrId),
            );
            // Refresh history
            const { data, error } = await supabase
                .from("calculator_history")
                .select("id, expression, result, created_at")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false })
                .limit(50);
            if (!error && data) {
                setHistory(
                    data.map((item) => ({
                        expression: item.expression ?? "",
                        result: item.result ?? "",
                        id: item.id !== undefined ? String(item.id) : undefined,
                        created_at: item.created_at,
                    })),
                );
            }
        } else {
            // Local storage: itemIndexOrId is the array index
            setHistory((prev) => {
                const newHistory = [...prev];
                newHistory.splice(itemIndexOrId as number, 1);
                return newHistory;
            });
        }
    };

    return (
        <TooltipProvider delayDuration={150}>
            <div className="flex flex-col h-full w-full bg-background text-foreground p-2 gap-2">
                {/* History Area */}
                <div className="h-20 mb-1 pr-1">
                    <ScrollArea className="h-full w-full rounded-md border border-border p-2 text-sm">
                        {history.length === 0
                            ? (
                                <p className="text-center text-muted-foreground italic">
                                    {t("calculator_history_empty", { count: 1 })}
                                </p>
                            )
                            : (
                                history.map((item, index) => (
                                    <div
                                        key={item.id || index}
                                        className="flex justify-between items-center mb-1 border-b border-border/50 pb-1 last:border-b-0 last:pb-0 last:mb-0"
                                    >
                                        <div className="flex flex-col text-right flex-grow mr-2">
                                            <span className="text-xs text-muted-foreground">
                                                {item.expression}
                                            </span>
                                            <span className="font-medium text-foreground truncate">
                                                {item.result}
                                            </span>
                                        </div>
                                        <div className="flex gap-1">
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 flex-shrink-0"
                                                        onClick={() =>
                                                            copyToClipboard(
                                                                item.result,
                                                            )}
                                                    >
                                                        <Copy className="h-3 w-3" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent side="left">
                                                    <p>Copy Result</p>
                                                </TooltipContent>
                                            </Tooltip>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 flex-shrink-0 text-destructive"
                                                        onClick={() => {
                                                            if (user) {
                                                                if (
                                                                    item.id !==
                                                                        undefined
                                                                ) {
                                                                    handleDeleteHistory(
                                                                        item.id,
                                                                    );
                                                                }
                                                            } else {
                                                                handleDeleteHistory(
                                                                    index,
                                                                );
                                                            }
                                                        }}
                                                    >
                                                        <Delete className="h-3 w-3" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent side="left">
                                                    <p>Delete</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </div>
                                    </div>
                                ))
                            )}
                    </ScrollArea>
                </div>

                {/* Expression Display (New) */}
                <div className="text-right text-sm text-muted-foreground h-6 px-3 truncate">
                    {expressionDisplay || " "} {/* Show expression or space */}
                </div>

                {/* Main Display */}
                <div className="bg-muted rounded-md p-3 text-right mb-1 shadow-inner overflow-hidden min-h-[60px] flex items-center justify-end">
                    <span
                        className={cn(
                            "text-4xl font-mono font-semibold break-all",
                            isError ? "text-destructive" : "text-foreground",
                        )}
                    >
                        {formatDisplayValue(displayValue)}
                    </span>
                </div>

                {/* Button Grid - Updated onClick and className */}
                <div className="grid grid-cols-4 gap-2 flex-1">
                    {buttonLayout.flat().map((btn, index) => {
                        const btnProps = typeof btn === "string"
                            ? { label: btn }
                            : btn;
                        const displayContent = typeof btn === "string"
                            ? btn
                            : btnProps.children ?? btnProps.label;

                        // Determine button type for styling
                        let buttonType: ButtonType = "action"; // Default
                        if (
                            !isNaN(parseInt(btnProps.label)) ||
                            btnProps.label === "."
                        ) {
                            buttonType = "number";
                        } else if (
                            ["/", "*", "-", "+"].includes(btnProps.label)
                        ) {
                            buttonType = "operator";
                        } else if (btnProps.label === "=") {
                            buttonType = "equals";
                        }
                        // Other buttons like MC, MR, C, CE, DEL, %, sqrt etc. remain "action"

                        return (
                            <Button
                                key={`${btnProps.label}-${index}`}
                                // Pass determined type, label, and active operator state
                                className={getButtonClasses(
                                    buttonType,
                                    btnProps.label,
                                    operator,
                                )}
                                onClick={() => {
                                    const handler =
                                        buttonHandlers[btnProps.label];
                                    if (handler) {
                                        handler();
                                    }
                                }}
                            >
                                {displayContent}
                            </Button>
                        );
                    })}
                </div>
            </div>
        </TooltipProvider>
    );
};

export default Calculator;
