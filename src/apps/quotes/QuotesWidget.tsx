"use client";
import React, { useEffect, useState } from "react";

const QuotesWidget: React.FC = () => {
    const [quote, setQuote] = useState<{ text: string; author: string } | null>(
        null,
    );
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getQuote = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(
                "https://thequoteshub.com/api/random-quote",
            );
            if (!res.ok) throw new Error("Failed to fetch quote");
            const data = await res.json();
            setQuote({ text: data.text, author: data.author });
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("An unknown error occurred");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getQuote();
    }, []);

    return (
        <div className="flex flex-col items-center justify-center h-full p-4">
            <h2 className="text-lg font-bold mb-2">Quotes & Inspiration</h2>
            <div className="w-full max-w-md bg-muted rounded shadow p-4 flex flex-col items-center">
                {loading && <div>Loading...</div>}
                {error && <div className="text-red-500">{error}</div>}
                {quote && (
                    <>
                        <blockquote className="italic mb-2 text-center">
                            &quot;{quote.text}&quot;
                        </blockquote>
                        <div className="text-right font-semibold w-full">
                            — {quote.author}
                        </div>
                    </>
                )}
                <button
                    className="mt-4 px-4 py-2 bg-primary text-white rounded"
                    onClick={getQuote}
                    disabled={loading}
                >
                    New Quote
                </button>
            </div>
        </div>
    );
};
export default QuotesWidget;
