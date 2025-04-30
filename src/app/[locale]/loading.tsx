import LoadingSpinner from "@/components/shared/LoadingSpinner";

export default function Loading() {
    // You can add any UI inside Loading, including a Skeleton.
    return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-lg text-foreground">Loading...</p>
        </div>
    );
}
 