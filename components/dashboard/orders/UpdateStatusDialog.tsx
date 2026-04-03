'use client'

import { useState } from 'react'

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'

import { useUpdateOrderStatus } from '@/hooks/use-orders'

const STATUS_TRANSITIONS: Record<string, { value: string; label: string }[]> = {
    PENDING: [
        { value: 'AWAITING_VERIFICATION', label: 'Awaiting Verification' },
        { value: 'CANCELLED', label: 'Cancel Order' },
    ],
    AWAITING_VERIFICATION: [
        { value: 'VERIFIED', label: 'Verified' },
        { value: 'CANCELLED', label: 'Cancel Order' },
    ],
    VERIFIED: [
        { value: 'PROCESSING', label: 'Processing' },
        { value: 'CANCELLED', label: 'Cancel Order' },
    ],
    PROCESSING: [
        { value: 'SHIPPED', label: 'Shipped' },
        { value: 'CANCELLED', label: 'Cancel Order' },
    ],
    SHIPPED: [{ value: 'COMPLETED', label: 'Delivered' }],
}

interface UpdateStatusDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    orderId: string
    currentStatus: string
}

export function UpdateStatusDialog({
    open,
    onOpenChange,
    orderId,
    currentStatus,
}: UpdateStatusDialogProps) {
    const [selected, setSelected] = useState('')
    const mutation = useUpdateOrderStatus()

    const upperStatus = currentStatus.toUpperCase()
    const options = STATUS_TRANSITIONS[upperStatus] ?? []

    const handleConfirm = () => {
        if (!selected) return
        mutation.mutate(
            { orderId, status: selected },
            {
                onSuccess: () => {
                    setSelected('')
                    onOpenChange(false)
                },
            },
        )
    }

    const isCancelAction = selected === 'CANCELLED'

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Update Order Status</DialogTitle>
                    <DialogDescription>
                        Choose the next status for this order. This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-3">
                    <Select value={selected} onValueChange={setSelected}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select new status" />
                        </SelectTrigger>
                        <SelectContent>
                            {options.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                        variant="outline"
                        onClick={() => {
                            setSelected('')
                            onOpenChange(false)
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant={isCancelAction ? 'destructive' : 'default'}
                        disabled={!selected || mutation.isPending}
                        onClick={handleConfirm}
                    >
                        {mutation.isPending ? 'Updating...' : 'Confirm'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
