"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { CircleDot, Coins, Dices, HelpCircle, RefreshCw } from "lucide-react"; // Icons
import { cn } from "@/infrastructure/lib/utils"; // Import cn utility
import { useI18n } from '@/locales/client';

// --- Helper Functions ---
const getRandomInt = (min: number, max: number): number => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

const getRandomElement = <T,>(arr: T[]): T => {
    return arr[Math.floor(Math.random() * arr.length)];
};

// --- Mini Games Components ---

// 1. Dice Roller
const DiceRoller: React.FC = () => {
    const t = useI18n();
    const [numDice, setNumDice] = useState(1);
    const [results, setResults] = useState<number[]>([]);
    const [total, setTotal] = useState(0);

    const rollDice = () => {
        const newResults = Array.from(
            { length: numDice },
            () => getRandomInt(1, 6),
        );
        setResults(newResults);
        setTotal(newResults.reduce((sum, val) => sum + val, 0));
    };

    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Dices size={20} /> {t('diceRoller', { count: 1 })}
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col gap-4">
                <div className="flex items-center gap-2">
                    <Label htmlFor="numDice" className="whitespace-nowrap">
                        {t('number', { count: 1 })} {t('dice', { count: 1 })}:
                    </Label>
                    <Input
                        id="numDice"
                        type="number"
                        min="1"
                        max="10" // Limit max dice
                        value={numDice}
                        onChange={(e) =>
                            setNumDice(
                                Math.max(1, parseInt(e.target.value) || 1),
                            )}
                        className="w-20 h-8"
                    />
                </div>
                <Button onClick={rollDice}>{t('rollDice', { count: 1 })}</Button>
                {results.length > 0 && (
                    <div className="mt-4 p-3 bg-muted rounded-md text-center">
                        <p className="text-lg font-semibold mb-2">{t('results', { count: 1 }) || 'Results:'}</p>
                        <div className="flex flex-wrap justify-center gap-2 mb-2">
                            {results.map((res, i) => (
                                <span
                                    key={i}
                                    className="p-2 bg-background rounded border border-border text-xl font-mono"
                                >
                                    {res}
                                </span>
                            ))}
                        </div>
                        <p className="text-foreground font-medium">
                            {t('total', { count: 1 }) || 'Total:'} {total}
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

// 2. Coin Flip
const CoinFlip: React.FC = () => {
    const t = useI18n();
    const [numCoins, setNumCoins] = useState(1);
    const [results, setResults] = useState<string[]>([]);
    const [counts, setCounts] = useState({ heads: 0, tails: 0 });

    const flipCoins = () => {
        let heads = 0;
        let tails = 0;
        const newResults = Array.from({ length: numCoins }, () => {
            const result = Math.random() < 0.5 ? "Heads" : "Tails";
            if (result === "Heads") heads++;
            else tails++;
            return result;
        });
        setResults(newResults);
        setCounts({ heads, tails });
    };

    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Coins size={20} /> {t('coin', { count: 1 })}
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col gap-4">
                <div className="flex items-center gap-2">
                    <Label htmlFor="numCoins" className="whitespace-nowrap">
                        {t('number', { count: 1 })} {t('coin', { count: 1 })}:
                    </Label>
                    <Input
                        id="numCoins"
                        type="number"
                        min="1"
                        max="20" // Limit max coins
                        value={numCoins}
                        onChange={(e) =>
                            setNumCoins(
                                Math.max(1, parseInt(e.target.value) || 1),
                            )}
                        className="w-20 h-8"
                    />
                </div>
                <Button onClick={flipCoins}>{t('flipCoins', { count: 1 })}</Button>
                {results.length > 0 && (
                    <div className="mt-4 p-3 bg-muted rounded-md text-center">
                        <p className="text-lg font-semibold mb-2">{t('results', { count: 1 }) || 'Results:'}</p>
                        <div className="flex flex-wrap justify-center gap-2 mb-2 text-sm max-h-24 overflow-y-auto p-1 border border-border bg-background rounded">
                            {results.map((res, i) => (
                                <span
                                    key={i}
                                    className={cn(
                                        "px-1.5 py-0.5 rounded",
                                        res === "Heads"
                                            ? "bg-green-200 text-green-800"
                                            : "bg-blue-200 text-blue-800",
                                    )}
                                >
                                    {res}
                                </span>
                            ))}
                        </div>
                        <p className="text-foreground font-medium">
                            {t('heads', { count: 1 }) || 'Heads:'} {counts.heads}, {t('tails', { count: 1 }) || 'Tails:'} {counts.tails}
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

// 3. Random Number Generator
const RandomNumberGenerator: React.FC = () => {
    const t = useI18n();
    const [min, setMin] = useState(1);
    const [max, setMax] = useState(100);
    const [result, setResult] = useState<number | null>(null);

    const generateNumber = () => {
        setResult(getRandomInt(min, max));
    };

    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <RefreshCw size={20} /> {t('number', { count: 1 })}
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col gap-4">
                <div className="flex items-center gap-2">
                    <Label htmlFor="minNum">{t('min', { count: 1 }) || 'Min:'}</Label>
                    <Input
                        id="minNum"
                        type="number"
                        value={min}
                        onChange={(e) => setMin(parseInt(e.target.value) || 0)}
                        className="w-24 h-8"
                    />
                    <Label htmlFor="maxNum">{t('max', { count: 1 }) || 'Max:'}</Label>
                    <Input
                        id="maxNum"
                        type="number"
                        value={max}
                        onChange={(e) =>
                            setMax(parseInt(e.target.value) || min)} // Max shouldn't be less than min
                        className="w-24 h-8"
                    />
                </div>
                <Button onClick={generateNumber}>{t('generate', { count: 1 }) || 'Generate'}</Button>
                {result !== null && (
                    <div className="mt-4 p-3 bg-muted rounded-md text-center">
                        <p className="text-lg font-semibold mb-2">{t('result', { count: 1 }) || 'Result:'}</p>
                        <p className="text-3xl font-bold text-primary">
                            {result}
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

// 4. Yes/No/Maybe Picker
const YesNoMaybe: React.FC = () => {
    const t = useI18n();
    const answers = ["Yes", "No", "Maybe"];
    const [result, setResult] = useState<string | null>(null);

    const pickAnswer = () => {
        setResult(getRandomElement(answers));
    };

    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <HelpCircle size={20} /> {t('yesNo', { count: 1 })}
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col items-center justify-center gap-4">
                <Button onClick={pickAnswer} size="lg">{t('askOracle', { count: 1 }) || 'Ask the Oracle'}</Button>
                {result !== null && (
                    <div className="mt-4 p-3 bg-muted rounded-md text-center">
                        <p className="text-3xl font-bold text-primary">
                            {result}
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

// 5. Random Activity Suggestion
const ActivitySuggestion: React.FC = () => {
    const t = useI18n();
    const activities = [
        "Read a chapter of a book",
        "Go for a short walk",
        "Listen to a new podcast episode",
        "Do 10 minutes of stretching",
        "Tidy up your desk space",
        "Write down 3 things you're grateful for",
        "Drink a glass of water",
        "Learn 5 new words in a language",
        "Watch a short documentary",
        "Plan your next meal",
        "Sketch something for 5 minutes",
        "Do a quick breathing exercise",
    ];
    const [suggestion, setSuggestion] = useState<string | null>(null);

    const getSuggestion = () => {
        setSuggestion(getRandomElement(activities));
    };

    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <CircleDot size={20} /> {t('activity', { count: 1 })}
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col items-center justify-center gap-4">
                <Button onClick={getSuggestion} size="lg">{t('suggestActivity', { count: 1 }) || 'Suggest an Activity'}</Button>
                {suggestion !== null && (
                    <div className="mt-4 p-3 bg-muted rounded-md text-center">
                        <p className="text-xl font-semibold text-primary">
                            {suggestion}
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

// 6. Would You Rather
const WouldYouRather: React.FC = () => {
    const t = useI18n();
    const questions = [
        { a: "Be able to fly", b: "Be able to turn invisible" },
        { a: "Have unlimited money", b: "Have unlimited time" },
        { a: "Live in the city", b: "Live in the countryside" },
        { a: "Control the weather", b: "Talk to animals" },
        { a: "Give up social media", b: "Give up watching movies/TV" },
        { a: "Be famous", b: "Be behind the scenes" },
        { a: "Explore space", b: "Explore the deep ocean" },
    ];
    const [question, setQuestion] = useState<{ a: string; b: string } | null>(
        null,
    );

    const getQuestion = () => {
        setQuestion(getRandomElement(questions));
    };

    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <HelpCircle size={20} /> {t('wyr', { count: 1 })}
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col items-center justify-center gap-4 text-center">
                <Button onClick={getQuestion} size="lg">{t('newQuestion', { count: 1 }) || 'New Question'}</Button>
                {question !== null && (
                    <div className="mt-4 p-3 bg-muted rounded-md w-full">
                        <p className="text-lg font-semibold mb-2">
                            {t('wyrQuestion', { count: 1 }) || 'Would you rather...'}
                        </p>
                        <p className="text-primary mb-1">{question.a}</p>
                        <p className="text-muted-foreground font-bold">{t('or', { count: 1 }) || 'OR'}</p>
                        <p className="text-primary mt-1">{question.b}</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

// --- Main MiniGames Component ---
const MiniGames: React.FC = () => {
    const t = useI18n();
    return (
        <div className="w-full h-full p-2 bg-background text-foreground">
            <Tabs defaultValue="dice" className="w-full h-full flex flex-col">
                <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 mb-2">
                    <TabsTrigger value="dice">{t('dice', { count: 1 })}</TabsTrigger>
                    <TabsTrigger value="coin">{t('coin', { count: 1 })}</TabsTrigger>
                    <TabsTrigger value="number">{t('number', { count: 1 })}</TabsTrigger>
                    <TabsTrigger value="yesno">{t('yesNo', { count: 1 })}</TabsTrigger>
                    <TabsTrigger value="activity">{t('activity', { count: 1 })}</TabsTrigger>
                    <TabsTrigger value="wyr">{t('wyr', { count: 1 })}</TabsTrigger>
                </TabsList>
                <TabsContent value="dice" className="flex-grow">
                    <DiceRoller />
                </TabsContent>
                <TabsContent value="coin" className="flex-grow">
                    <CoinFlip />
                </TabsContent>
                <TabsContent value="number" className="flex-grow">
                    <RandomNumberGenerator />
                </TabsContent>
                <TabsContent value="yesno" className="flex-grow">
                    <YesNoMaybe />
                </TabsContent>
                <TabsContent value="activity" className="flex-grow">
                    <ActivitySuggestion />
                </TabsContent>
                <TabsContent value="wyr" className="flex-grow">
                    <WouldYouRather />
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default MiniGames;
