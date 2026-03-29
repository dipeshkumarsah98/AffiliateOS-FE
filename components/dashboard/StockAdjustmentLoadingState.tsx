import { Topbar } from "@/components/layout/Topbar";

export function StockAdjustmentLoadingState() {
    return (
        <div className="flex flex-col min-h-screen" style={{ background: "#f8faff" }}>
            <Topbar title="Stock Adjustment" description="" />
            <div className="flex-1 flex items-center justify-center">
                <p style={{ color: "#9ca3af" }}>Loading stock movements...</p>
            </div>
        </div>
    );
}
