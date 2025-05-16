import { cn } from "@/infrastructure/lib/utils";

interface LoadingSpinnerProps {
    className?: string;
    size?: "sm" | "md" | "lg";
}

export const LoadingSpinner = ({
    className,
    size = "md",
}: LoadingSpinnerProps) => {
    const sizeClasses = {
        sm: "h-6 w-6 border-2",
        md: "h-10 w-10 border-4",
        lg: "h-16 w-16 border-4",
    };

    return (
        <div
            className={cn(
                "inline-block animate-spin rounded-full border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]",
                "border-primary", // Use theme primary color
                sizeClasses[size],
                className,
            )}
            role="status"
        >
            <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
                Loading...
            </span>
        </div>
    );
};

export default LoadingSpinner;
