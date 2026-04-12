import { Card } from "../ui/card";
function StatCardSkeleton() {
    return (
        <Card
            className="rounded-2xl p-5 flex flex-row items-center gap-4"
            style={{ background: '#fff', boxShadow: '0 1px 4px rgba(19,27,46,0.06)', border: '1px solid #f1f5f9' }}
        >
            <div className="w-11 h-11 rounded-xl flex-shrink-0 animate-pulse" style={{ background: '#f0f2ff' }} />
            <div className="flex-1 space-y-2">
                <div className="h-3 w-20 rounded animate-pulse" style={{ background: '#f0f2ff' }} />
                <div className="h-5 w-28 rounded animate-pulse" style={{ background: '#f0f2ff' }} />
            </div>
        </Card>
    )
}

export default StatCardSkeleton;