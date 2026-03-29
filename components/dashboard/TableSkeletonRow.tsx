import { TableCell, TableRow } from '@/components/ui/table'

type TableSkeletonRowProps = {
    cellWidths: number[]
}

export function TableSkeletonRow({ cellWidths }: TableSkeletonRowProps) {
    return (
        <TableRow className="border-b" style={{ borderBottomColor: '#f4f5ff' }}>
            {cellWidths.map((w, i) => (
                <TableCell key={i} className="py-5 px-6">
                    <div
                        className="h-3.5 rounded-md animate-pulse"
                        style={{ width: `${w}px`, background: '#f0f2ff' }}
                    />
                </TableCell>
            ))}
        </TableRow>
    )
}
