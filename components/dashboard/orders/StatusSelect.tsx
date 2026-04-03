'use client'

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

const STATUS_OPTIONS = [
    { value: 'all', label: 'All Statuses' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'AWAITING_VERIFICATION', label: 'Awaiting' },
    { value: 'PROCESSING', label: 'Processing' },
    { value: 'SHIPPED', label: 'Shipped' },
    { value: 'COMPLETED', label: 'Delivered' },
    { value: 'CANCELLED', label: 'Cancelled' },
]

interface StatusSelectProps {
    value: string
    onChange: (value: string) => void
    className?: string
}

export function StatusSelect({ value, onChange, className }: StatusSelectProps) {
    return (
        <Select value={value} onValueChange={onChange}>
            <SelectTrigger className={className}>
                <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                        {option.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}
