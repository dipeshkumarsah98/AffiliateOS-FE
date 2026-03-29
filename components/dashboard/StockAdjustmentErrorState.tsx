import { Topbar } from "@/components/layout/Topbar";

type StockAdjustmentErrorStateProps = {
    message: string;
};

export function StockAdjustmentErrorState({
    message,
}: StockAdjustmentErrorStateProps) {
    return (
        <div className="flex flex-col min-h-screen" style={{ background: "#f8faff" }}>
            <Topbar title="Stock Adjustment" description="" />
            <div className="flex-1 flex items-center justify-center px-4">
                <p className="text-center" style={{ color: "#dc2626" }}>
                    {message}
                </p>
            </div>
        </div>
    );
}
