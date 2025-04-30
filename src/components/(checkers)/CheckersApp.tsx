"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Crown, Lightbulb, RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";

// --- Types ---
type PieceType = "white" | "black";
type Player = PieceType | null;
type SquareState = Player | "whiteKing" | "blackKing";
type BoardState = (SquareState | null)[][];
type Position = { row: number; col: number };
// Move now includes the starting position and piece type
type Move = {
    start: Position;
    end: Position;
    piece: SquareState; // Piece making the move
    jumped?: Position; // Position of the jumped piece
};

// --- Constants ---
const BOARD_SIZE = 8;
const COL_LABELS = ["A", "B", "C", "D", "E", "F", "G", "H"];
const ROW_LABELS = ["8", "7", "6", "5", "4", "3", "2", "1"]; // Displayed 8->1 top to bottom

// --- Helper Functions ---
const createInitialBoard = (): BoardState => {
    const board: BoardState = Array(BOARD_SIZE).fill(null).map(() =>
        Array(BOARD_SIZE).fill(null)
    );
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if ((row + col) % 2 !== 0) { // Playable squares (dark squares)
                if (row < 3) {
                    board[row][col] = "black"; // Black pieces at the top
                } else if (row > 4) {
                    board[row][col] = "white"; // White pieces at the bottom
                }
            }
        }
    }
    return board;
};

const isOutOfBounds = (row: number, col: number): boolean => {
    return row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE;
};

// New Helper Function for Coordinate Translation
const getLogicalCoords = (
    visualRow: number,
    visualCol: number,
    orientation: "white" | "black",
): Position => {
    if (orientation === "white") {
        return { row: visualRow, col: visualCol };
    } else {
        // If black is at the bottom, visual row 0 is logical row 7, visual col 0 is logical col 7
        return {
            row: BOARD_SIZE - 1 - visualRow,
            col: BOARD_SIZE - 1 - visualCol,
        };
    }
};

const getVisualCoords = (
    logicalRow: number,
    logicalCol: number,
    orientation: "white" | "black",
): Position => {
    if (orientation === "white") {
        return { row: logicalRow, col: logicalCol };
    } else {
        // If black is at the bottom, logical row 7 is visual row 0, logical col 7 is visual col 0
        return {
            row: BOARD_SIZE - 1 - logicalRow,
            col: BOARD_SIZE - 1 - logicalCol,
        };
    }
};

// --- Component ---
const CheckersApp: React.FC = () => {
    const [board, setBoard] = useState<BoardState>(createInitialBoard());
    const [currentPlayer, setCurrentPlayer] = useState<PieceType>("white");
    const [selectedPiece, setSelectedPiece] = useState<Position | null>(null); // Position of selected piece
    const [selectedPieceValidMoves, setSelectedPieceValidMoves] = useState<
        Move[]
    >([]); // Moves for the *selected* piece only
    const [isJumpForced, setIsJumpForced] = useState<boolean>(false); // Is *any* jump forced this turn?
    const [activePlayerPieces, setActivePlayerPieces] = useState<Position[]>(
        [],
    ); // Positions of pieces that *can* move this turn
    const [whitePieces, setWhitePieces] = useState<number>(12);
    const [blackPieces, setBlackPieces] = useState<number>(12);
    const [winner, setWinner] = useState<PieceType | null>(null);
    const [isMultiJumping, setIsMultiJumping] = useState<boolean>(false); // Track if in a multi-jump sequence
    const [boardOrientation, setBoardOrientation] = useState<"white" | "black">(
        "white",
    ); // 'white' means white at bottom

    // New state for tips
    const [gameTip, setGameTip] = useState<string>("Select a piece to start.");

    // --- Core Game Logic --- //

    // Get all possible moves (simple & jumps) for a SINGLE piece at a given position
    const getPieceMoves = useCallback(
        (startPos: Position, currentBoard: BoardState): Move[] => {
            const piece = currentBoard[startPos.row][startPos.col];
            if (!piece) return [];

            const simpleMoves: Move[] = [];
            const jumpMoves: Move[] = [];
            const isKing = piece.endsWith("King");
            // Kings move both ways, regular pieces only forward
            const moveDirs = isKing ? [-1, 1] : [piece === "white" ? -1 : 1];
            const opponentColor = piece.startsWith("white") ? "black" : "white";

            for (const dRow of moveDirs) {
                for (const dCol of [-1, 1]) { // Check left and right diagonals
                    const nextRow = startPos.row + dRow;
                    const nextCol = startPos.col + dCol;
                    const jumpRow = startPos.row + 2 * dRow;
                    const jumpCol = startPos.col + 2 * dCol;

                    if (isOutOfBounds(nextRow, nextCol)) continue;

                    const nextSquare = currentBoard[nextRow][nextCol];

                    // Check Simple Move (only if not currently multi-jumping)
                    if (!isMultiJumping && nextSquare === null) {
                        simpleMoves.push({
                            start: startPos,
                            end: { row: nextRow, col: nextCol },
                            piece,
                        });
                    } // Check Jump
                    else if (nextSquare?.startsWith(opponentColor)) {
                        if (
                            !isOutOfBounds(jumpRow, jumpCol) &&
                            currentBoard[jumpRow][jumpCol] === null
                        ) {
                            jumpMoves.push({
                                start: startPos,
                                end: { row: jumpRow, col: jumpCol },
                                jumped: { row: nextRow, col: nextCol },
                                piece,
                            });
                        }
                    }
                }
            }
            // During multi-jump, only jumps are allowed
            return isMultiJumping ? jumpMoves : [...jumpMoves, ...simpleMoves];
        },
        [isMultiJumping],
    ); // Depend on multi-jump status

    // Calculate all valid moves for the current player, considering forced jumps
    const calculateTurnMoves = useCallback(
        (player: PieceType, currentBoard: BoardState) => {
            const allSimpleMoves: Move[] = [];
            const allJumpMoves: Move[] = [];
            const piecesWithMoves: Position[] = [];

            for (let r = 0; r < BOARD_SIZE; r++) {
                for (let c = 0; c < BOARD_SIZE; c++) {
                    const piece = currentBoard[r][c];
                    if (piece?.startsWith(player)) {
                        const pieceMoves = getPieceMoves(
                            { row: r, col: c },
                            currentBoard,
                        );
                        if (pieceMoves.length > 0) {
                            piecesWithMoves.push({ row: r, col: c });
                            pieceMoves.forEach((move) => {
                                if (move.jumped) {
                                    allJumpMoves.push(move);
                                } else {
                                    allSimpleMoves.push(move);
                                }
                            });
                        }
                    }
                }
            }

            const forced = allJumpMoves.length > 0;
            const validMoves = forced ? allJumpMoves : allSimpleMoves;
            const piecesThatCanMove = forced
                ? piecesWithMoves.filter((pos) =>
                    allJumpMoves.some((move) =>
                        move.start.row === pos.row && move.start.col === pos.col
                    )
                )
                : piecesWithMoves;

            return {
                forced,
                validMoves, // All valid moves for the turn (respecting force)
                piecesThatCanMove, // Pieces that have at least one valid move
            };
        },
        [getPieceMoves],
    ); // Depends only on getPieceMoves

    // --- Effects --- //

    // Update piece counts and check for win by capture
    useEffect(() => {
        let whiteCount = 0;
        let blackCount = 0;
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                if (board[r][c]?.startsWith("white")) whiteCount++;
                if (board[r][c]?.startsWith("black")) blackCount++;
            }
        }
        setWhitePieces(whiteCount);
        setBlackPieces(blackCount);

        // Only declare winner if game isn't already won
        if (!winner) {
            if (whiteCount === 0) setWinner("black");
            else if (blackCount === 0) setWinner("white");
        }
    }, [board, winner]);

    // Update board orientation when player changes
    useEffect(() => {
        setBoardOrientation(currentPlayer);
    }, [currentPlayer]);

    // Update available moves & forced status when player or board changes
    useEffect(() => {
        if (winner || isMultiJumping) return; // Don't recalculate mid-jump or if game over

        const { forced, piecesThatCanMove, validMoves } = calculateTurnMoves(
            currentPlayer,
            board,
        );

        setIsJumpForced(forced);
        setActivePlayerPieces(piecesThatCanMove);

        let newTip = "";
        if (winner) {
            newTip = "Game Over!";
        } else if (forced) {
            newTip =
                "Tip: A jump is required! Choose a piece that can capture.";
        } else if (piecesThatCanMove.length > 0) {
            // Basic tips based on piece count or potential moves
            const opponentPieces = currentPlayer === "white"
                ? blackPieces
                : whitePieces;
            if (opponentPieces <= 3) {
                newTip =
                    "Tip: Opponent is low on pieces. Press your advantage!";
            } else if (whitePieces + blackPieces < 10) {
                newTip = "Tip: Endgame! Every move counts.";
            } else {
                newTip =
                    "Tip: Look for opportunities to advance or control the center.";
            }
        } else {
            // This case should trigger a win condition check
            newTip = "Checking for game end...";
        }
        setGameTip(newTip);

        // Check for win by no valid moves
        if (
            piecesThatCanMove.length === 0 &&
            (currentPlayer === "white" ? whitePieces > 0 : blackPieces > 0)
        ) {
            console.log(
                `No valid moves for ${currentPlayer}. ${
                    currentPlayer === "white" ? "Black" : "White"
                } wins!`,
            );
            setWinner(currentPlayer === "white" ? "black" : "white");
            setGameTip(
                `No moves for ${currentPlayer}! ${
                    currentPlayer === "white" ? "Black" : "White"
                } wins!`,
            );
        }

        // Clear selection if the previously selected piece can no longer move
        if (
            selectedPiece &&
            !piecesThatCanMove.some((p) =>
                p.row === selectedPiece.row && p.col === selectedPiece.col
            )
        ) {
            setSelectedPiece(null);
            setSelectedPieceValidMoves([]);
        } // Update moves for the currently selected piece if it's still valid
        else if (selectedPiece) {
            const movesForSelected = validMoves.filter((m) =>
                m.start.row === selectedPiece.row &&
                m.start.col === selectedPiece.col
            );
            setSelectedPieceValidMoves(movesForSelected);
            if (movesForSelected.some((m) => m.jumped)) {
                setGameTip(
                    "Tip: Capture available! Select the green destination.",
                );
            } else if (movesForSelected.length > 0) {
                setGameTip("Tip: Select a blue destination square to move.");
            }
        }
    }, [
        currentPlayer,
        board,
        winner,
        calculateTurnMoves,
        isMultiJumping,
        selectedPiece,
        whitePieces,
        blackPieces,
        gameTip,
    ]);

    // --- Event Handlers --- //

    const handleSquareClick = (visualRow: number, visualCol: number) => {
        if (winner) return; // Game already over

        // Translate visual coords to logical coords based on current orientation
        const { row: logicalRow, col: logicalCol } = getLogicalCoords(
            visualRow,
            visualCol,
            boardOrientation,
        );

        const clickedSquareContent = board[logicalRow][logicalCol];
        const targetPosition = { row: logicalRow, col: logicalCol }; // Use logical coords for selection

        // --- 1. Try Selecting a Piece ---
        if (clickedSquareContent?.startsWith(currentPlayer)) {
            // Check if this piece is allowed to move (respects forced jumps) using logical coords
            const canSelect = activePlayerPieces.some((p) =>
                p.row === logicalRow && p.col === logicalCol
            );

            if (canSelect) {
                const { validMoves: allTurnMoves } = calculateTurnMoves(
                    currentPlayer,
                    board,
                ); // Recalculate to be safe
                const movesForThisPiece = allTurnMoves.filter((m) =>
                    m.start.row === logicalRow && m.start.col === logicalCol // Use logical coords
                );
                setSelectedPiece(targetPosition); // Store logical coords
                setSelectedPieceValidMoves(movesForThisPiece);
                // Update tip based on selected piece's moves
                if (movesForThisPiece.some((m) => m.jumped)) {
                    setGameTip(
                        "Tip: Capture available! Select the green destination.",
                    );
                } else if (movesForThisPiece.length > 0) {
                    setGameTip(
                        "Tip: Select a blue destination square to move.",
                    );
                } else {
                    // Should not happen if canSelect is true, but as fallback:
                    setGameTip("Select a piece to move.");
                }
            } else {
                setGameTip(
                    isJumpForced
                        ? "Tip: Must select a piece that can jump!"
                        : "Tip: This piece cannot move.",
                );
                setSelectedPiece(null);
                setSelectedPieceValidMoves([]);
            }
            return; // End turn after selection attempt
        }

        // --- 2. Try Making a Move (Requires a piece to be selected) ---
        if (selectedPiece && clickedSquareContent === null) { // SelectedPiece stores logical coords
            // Find the move matching the selected destination (logical coords)
            const targetMove = selectedPieceValidMoves.find((m) =>
                m.end.row === logicalRow && m.end.col === logicalCol
            );

            if (targetMove) {
                // --- Execute the Valid Move ---
                const startRow = selectedPiece.row; // Logical start coords
                const startCol = selectedPiece.col;
                let pieceToMove = board[startRow][startCol]; // Get the piece type before clearing start

                // Create new board state using logical coords
                const newBoard = board.map((r) => [...r]);
                newBoard[targetMove.end.row][targetMove.end.col] = pieceToMove; // Place piece at logical destination
                newBoard[startRow][startCol] = null; // Clear logical starting square

                let justJumped = false;
                if (targetMove.jumped) {
                    newBoard[targetMove.jumped.row][targetMove.jumped.col] = // Use logical coords for jumped piece
                        null; // Remove jumped piece
                    console.log(
                        `Jumped piece at ${targetMove.jumped.row}, ${targetMove.jumped.col}`,
                    );
                    justJumped = true;
                }

                // --- Check for Multi-Jump --- //
                let furtherJumps: Move[] = [];
                if (justJumped) {
                    // Temporarily set multi-jumping flag to ensure getPieceMoves only finds jumps
                    setIsMultiJumping(true);
                    furtherJumps = getPieceMoves(targetMove.end, newBoard)
                        .filter((m) => m.jumped);
                    setIsMultiJumping(false); // Reset flag
                }

                if (justJumped && furtherJumps.length > 0) {
                    // --- Continue Multi-Jump --- //
                    console.log("Continuing multi-jump...");
                    setBoard(newBoard); // Update board to show intermediate jump
                    setSelectedPiece(targetMove.end); // Keep the *same piece* selected at its new *logical* position
                    setSelectedPieceValidMoves(furtherJumps); // Update valid moves to only the next jumps
                    setIsMultiJumping(true); // Set flag to indicate we are in a multi-jump sequence
                } else {
                    // --- End of Move/Turn --- //
                    setIsMultiJumping(false); // Ensure multi-jump sequence ends
                    console.log("Move sequence ended.");

                    // Check for kinging *at the end* of the sequence
                    const backRank = currentPlayer === "white"
                        ? 0
                        : BOARD_SIZE - 1;
                    if (
                        targetMove.end.row === backRank && pieceToMove &&
                        !pieceToMove.endsWith("King")
                    ) {
                        pieceToMove = `${currentPlayer}King` as SquareState;
                        newBoard[targetMove.end.row][targetMove.end.col] =
                            pieceToMove; // Update piece on board
                        console.log(
                            `Kinged piece at ${targetMove.end.row}, ${targetMove.end.col}`,
                        );
                    }

                    setBoard(newBoard); // Final board update for the turn
                    setSelectedPiece(null); // Clear logical selection
                    setSelectedPieceValidMoves([]);
                    setCurrentPlayer(
                        currentPlayer === "white" ? "black" : "white",
                    ); // Switch player
                }
            } else {
                // Clicked an empty square that is not a valid destination for the selected piece
                console.log(
                    `Invalid move target ${logicalRow}, ${logicalCol} for piece at ${selectedPiece.row}, ${selectedPiece.col}`,
                );
                // Keep piece selected, do nothing or deselect?
                setSelectedPiece(null);
                setSelectedPieceValidMoves([]);
            }
            return; // End turn after move execution attempt
        }

        // --- 3. Clicked Elsewhere (Opponent piece, non-playable square, or empty without selection) ---
        // Deselect if not clicking on a valid move target when a piece is selected
        if (selectedPiece) { // selectedPiece uses logical coords
            setSelectedPiece(null);
            setSelectedPieceValidMoves([]);
            console.log("Deselected piece.");
        }
    };

    const resetGame = () => {
        setBoard(createInitialBoard());
        setCurrentPlayer("white");
        setSelectedPiece(null);
        setSelectedPieceValidMoves([]);
        setIsJumpForced(false);
        setActivePlayerPieces([]); // Will be recalculated by effect
        setWinner(null);
        setIsMultiJumping(false);
        setGameTip("New game started. White's turn."); // Reset tip
    };

    // --- Rendering --- //

    // Render piece receives LOGICAL coordinates to check against state like selectedPiece
    const renderPiece = (
        square: SquareState,
        logicalRow: number,
        logicalCol: number,
    ) => {
        if (!square) return null;

        const isKing = square.endsWith("King");
        const pieceColor = square.startsWith("white")
            ? "bg-white border-neutral-400 dark:bg-gray-200 dark:border-gray-500 text-black"
            : "bg-neutral-800 border-neutral-950 dark:bg-neutral-700 dark:border-neutral-600 text-white";
        const kingColor = square.startsWith("white")
            ? "text-neutral-700 dark:text-neutral-800"
            : "text-yellow-400";
        // Check selection using LOGICAL coordinates
        const isSelected = selectedPiece?.row === logicalRow &&
            selectedPiece?.col === logicalCol;
        // Highlight pieces that *can* move this turn, slightly differently if selected
        // Check active pieces using LOGICAL coordinates
        const canMove = activePlayerPieces.some((p) =>
            p.row === logicalRow && p.col === logicalCol
        );
        const pieceOpacity = (!selectedPiece && !canMove &&
                currentPlayer === square?.split("King")[0])
            ? "opacity-60"
            : "opacity-100"; // Dim pieces that cannot move

        return (
            <div
                className={cn(
                    "w-[70%] h-[70%] rounded-full flex items-center justify-center shadow-md border-2 transform transition-all duration-150",
                    pieceColor,
                    isSelected
                        ? "ring-[3px] ring-offset-1 ring-blue-500 scale-105 z-10"
                        : canMove
                        ? "cursor-pointer hover:scale-105"
                        : "cursor-not-allowed",
                    pieceOpacity,
                    "aspect-square",
                )}
            >
                {isKing && (
                    <Crown
                        className={cn("w-1/2 h-1/2", kingColor)}
                        strokeWidth={2.5}
                    />
                )}
            </div>
        );
    };

    // Determine label order based on orientation
    const displayColLabels = boardOrientation === "white"
        ? COL_LABELS
        : [...COL_LABELS].reverse();
    // Row labels need reversing based on orientation (white wants 8 at top, black wants 1 at top)
    const displayRowLabels = boardOrientation === "white"
        ? ROW_LABELS
        : [...ROW_LABELS].reverse();

    return (
        <div className="p-2 h-full w-full flex flex-col items-center justify-center bg-background">
            <Card className="w-auto max-w-full max-h-full flex flex-col shadow-lg bg-card p-3 sm:p-4">
                <CardHeader className="p-0 pb-2 border-b mb-2">
                    <CardTitle className="text-base font-medium flex items-center justify-between">
                        <span>Checkers</span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={resetGame}
                            className="gap-1 text-xs h-7"
                            disabled={isMultiJumping} // Disable reset mid-jump
                        >
                            <RefreshCcw className="h-3 w-3" /> Reset
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0 flex flex-col items-center">
                    {/* Game Info Bar */}
                    <div className="flex justify-between items-center w-full px-1 py-1 mb-1 text-xs sm:text-sm">
                        <div
                            className={cn(
                                "flex items-center gap-1.5 p-1 rounded font-medium",
                                currentPlayer === "black"
                                    ? "bg-neutral-200 dark:bg-neutral-700"
                                    : "text-muted-foreground",
                            )}
                        >
                            <div className="w-3 h-3 rounded-full bg-neutral-800 dark:bg-neutral-700 border border-black">
                            </div>
                            Black: {blackPieces}
                        </div>
                        <div
                            className={cn(
                                "font-semibold px-2 py-0.5 rounded text-center",
                                winner
                                    ? (winner === "white"
                                        ? "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/50"
                                        : "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/50")
                                    : currentPlayer === "white"
                                    ? "text-primary"
                                    : "text-primary",
                            )}
                        >
                            {winner
                                ? `${
                                    winner.charAt(0).toUpperCase() +
                                    winner.slice(1)
                                } Wins!`
                                : `${
                                    currentPlayer.charAt(0).toUpperCase() +
                                    currentPlayer.slice(1)
                                }'s Turn${isJumpForced ? " (Jump!)" : ""}`}
                        </div>
                        <div
                            className={cn(
                                "flex items-center gap-1.5 p-1 rounded font-medium",
                                currentPlayer === "white"
                                    ? "bg-neutral-200 dark:bg-neutral-700"
                                    : "text-muted-foreground",
                            )}
                        >
                            <div className="w-3 h-3 rounded-full bg-white dark:bg-gray-200 border border-neutral-400 dark:border-gray-500">
                            </div>
                            White: {whitePieces}
                        </div>
                    </div>

                    {/* Tip Bar */}
                    <div className="w-full text-center px-2 py-1 mb-2 text-xs text-muted-foreground border rounded-md bg-muted/50 flex items-center justify-center gap-1.5">
                        <Lightbulb className="h-3.5 w-3.5 flex-shrink-0" />
                        <span>{gameTip}</span>
                    </div>

                    {/* Board Container with Labels */}
                    <div className="w-full max-w-[480px] flex justify-center">
                        {/* Row Labels Left - Pushed out slightly by grid gap */}
                        <div className="flex flex-col justify-around text-xs font-medium text-muted-foreground mr-1.5 pt-[calc(100%/16)] pb-[calc(100%/16)]">
                            {displayRowLabels.map((label) => ( // Use displayRowLabels
                                <div
                                    key={`row-l-${label}`}
                                    className="flex-1 flex items-center justify-center"
                                >
                                    {label}
                                </div>
                            ))}
                        </div>

                        <div className="flex-grow flex flex-col">
                            {/* Column Labels Top */}
                            <div className="flex justify-around text-xs font-medium text-muted-foreground mb-1 ml-[calc(100%/16)] mr-[calc(100%/16)]">
                                {displayColLabels.map((label) => ( // Use displayColLabels
                                    <div
                                        key={`col-t-${label}`}
                                        className="flex-1 flex items-center justify-center"
                                    >
                                        {label}
                                    </div>
                                ))}
                            </div>

                            {/* Board Grid - Render based on VISUAL grid, translate to LOGICAL for data access */}
                            <div className="relative aspect-square w-full border-2 border-neutral-700 dark:border-neutral-600 shadow-inner grid grid-cols-8 grid-rows-8 bg-neutral-300 dark:bg-neutral-600">
                                {Array.from({ length: BOARD_SIZE }).map((
                                    _,
                                    visualRowIndex,
                                ) => Array.from({ length: BOARD_SIZE }).map(
                                    (_, visualColIndex) => {
                                        // Translate visual coords to logical coords for data fetching
                                        const {
                                            row: logicalRow,
                                            col: logicalCol,
                                        } = getLogicalCoords(
                                            visualRowIndex,
                                            visualColIndex,
                                            boardOrientation,
                                        );
                                        const square =
                                            board[logicalRow][logicalCol]; // Fetch data using logical coords

                                        const isPlayable =
                                            (visualRowIndex + visualColIndex) %
                                                    2 !== 0; // Playable squares based on visual grid pattern

                                        // Check if the LOGICAL position can move
                                        const currentPieceCanMove =
                                            activePlayerPieces.some((p) =>
                                                p.row === logicalRow &&
                                                p.col === logicalCol
                                            );

                                        // Determine if the square is a valid destination for the *currently selected* piece
                                        // Find the move whose LOGICAL end matches the current LOGICAL position
                                        const possibleMoveData =
                                            selectedPieceValidMoves.find((m) =>
                                                m.end.row === logicalRow &&
                                                m.end.col === logicalCol
                                            );
                                        // Get the VISUAL coordinates for this potential destination
                                        const visualDestCoords =
                                            possibleMoveData
                                                ? getVisualCoords(
                                                    possibleMoveData.end.row,
                                                    possibleMoveData.end.col,
                                                    boardOrientation,
                                                )
                                                : null;

                                        // Highlight if the CURRENT visual cell matches the VISUAL destination coords
                                        const isPossibleDestination =
                                            !!visualDestCoords &&
                                            visualDestCoords.row ===
                                                visualRowIndex &&
                                            visualDestCoords.col ===
                                                visualColIndex;

                                        const isJumpDestination =
                                            isPossibleDestination &&
                                            !!possibleMoveData?.jumped; // Use optional chaining on possibleMoveData

                                        // Determine cursor style based on LOGICAL piece state but applying to the VISUAL cell
                                        let cursorClass = "cursor-default";
                                        if (isPlayable && !winner) {
                                            if (!isMultiJumping) {
                                                if (
                                                    square?.startsWith(
                                                        currentPlayer,
                                                    ) && currentPieceCanMove
                                                ) {
                                                    cursorClass =
                                                        "cursor-pointer";
                                                } else if (
                                                    isPossibleDestination
                                                ) {
                                                    cursorClass =
                                                        "cursor-pointer";
                                                }
                                            } else {
                                                if (isPossibleDestination) {
                                                    cursorClass =
                                                        "cursor-pointer";
                                                }
                                            }
                                        }

                                        return (
                                            <div
                                                key={`${visualRowIndex}-${visualColIndex}`} // Key based on visual position
                                                className={cn(
                                                    "flex items-center justify-center relative",
                                                    isPlayable
                                                        ? "bg-neutral-500 dark:bg-neutral-700"
                                                        : "bg-neutral-100 dark:bg-neutral-400",
                                                    "transition-colors duration-100",
                                                    cursorClass,
                                                )}
                                                onClick={() => {
                                                    // Send VISUAL coordinates to handler
                                                    if (isPlayable && !winner) {
                                                        handleSquareClick(
                                                            visualRowIndex,
                                                            visualColIndex,
                                                        );
                                                    }
                                                }}
                                            >
                                                {selectedPiece &&
                                                    isPossibleDestination && ( // Render marker based on visual match
                                                        <div
                                                            className={cn(
                                                                "absolute w-1/3 h-1/3 rounded-full opacity-50 pointer-events-none z-20",
                                                                isJumpDestination
                                                                    ? "bg-green-500 dark:bg-green-400"
                                                                    : "bg-blue-500 dark:bg-blue-400",
                                                            )}
                                                        >
                                                        </div>
                                                    )}
                                                {renderPiece(
                                                    square, // Pass the logical square data
                                                    logicalRow, // Pass logical coords for state checking within renderPiece
                                                    logicalCol,
                                                )}
                                            </div>
                                        );
                                    },
                                ))}
                            </div>
                            {/* Column Labels Bottom */}
                            <div className="flex justify-around text-xs font-medium text-muted-foreground mt-1 ml-[calc(100%/16)] mr-[calc(100%/16)]">
                                {displayColLabels.map((label) => ( // Use displayColLabels
                                    <div
                                        key={`col-b-${label}`}
                                        className="flex-1 flex items-center justify-center"
                                    >
                                        {label}
                                    </div>
                                ))}
                            </div>
                        </div>
                        {/* Row Labels Right */}
                        <div className="flex flex-col justify-around text-xs font-medium text-muted-foreground ml-1.5 pt-[calc(100%/16)] pb-[calc(100%/16)]">
                            {displayRowLabels.map((label) => ( // Use displayRowLabels
                                <div
                                    key={`row-r-${label}`}
                                    className="flex-1 flex items-center justify-center"
                                >
                                    {label}
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="p-0 pt-2 text-xs text-muted-foreground text-center border-t mt-2">
                    {winner
                        ? "Game Over!"
                        : isMultiJumping
                        ? "Complete the jump sequence!"
                        : selectedPieceValidMoves.length > 0
                        ? "Select a destination square."
                        : isJumpForced
                        ? "Must make a jump! Select piece."
                        : "Select a piece to move."}
                </CardFooter>
            </Card>
        </div>
    );
};

export default CheckersApp;
