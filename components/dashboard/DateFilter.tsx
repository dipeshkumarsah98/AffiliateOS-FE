'use client'

import { useState } from 'react'
import { Calendar as CalendarIcon, Check } from 'lucide-react'
import { format } from 'date-fns'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

export interface DateRange {
    from: Date | undefined
    to: Date | undefined
}

export interface DateFilterValue {
    type: 'today' | 'last_week' | 'last_month' | 'custom'
    range: DateRange
}

interface DateFilterProps {
    value: DateFilterValue
    onChange: (value: DateFilterValue) => void
    className?: string
}

const PRESET_OPTIONS = [
    { label: 'Today', value: 'today' as const },
    { label: 'Last Week', value: 'last_week' as const },
    { label: 'Last Month', value: 'last_month' as const },
    { label: 'Custom Range', value: 'custom' as const },
]

function getPresetRange(type: DateFilterValue['type']): DateRange {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    switch (type) {
        case 'today':
            return { from: today, to: today }
        case 'last_week': {
            const lastWeek = new Date(today)
            lastWeek.setDate(today.getDate() - 7)
            return { from: lastWeek, to: today }
        }
        case 'last_month': {
            const lastMonth = new Date(today)
            lastMonth.setMonth(today.getMonth() - 1)
            return { from: lastMonth, to: today }
        }
        default:
            return { from: undefined, to: undefined }
    }
}

export function DateFilter({ value, onChange, className }: DateFilterProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [tempRange, setTempRange] = useState<DateRange>(value.range)

    const handlePresetSelect = (type: DateFilterValue['type']) => {
        if (type === 'custom') {
            // Just switch to custom mode, don't close
            onChange({ type, range: value.range })
        } else {
            const range = getPresetRange(type)
            onChange({ type, range })
            setIsOpen(false)
        }
    }

    const handleCustomApply = () => {
        if (tempRange.from && tempRange.to) {
            onChange({ type: 'custom', range: tempRange })
            setIsOpen(false)
        }
    }

    const displayText = () => {
        if (value.type === 'custom' && value.range.from && value.range.to) {
            return `${format(value.range.from, 'MMM dd')} - ${format(value.range.to, 'MMM dd')}`
        }
        const preset = PRESET_OPTIONS.find(p => p.value === value.type)
        return preset?.label || 'Date Range'
    }

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        'justify-start text-left font-normal',
                        !value.range.from && 'text-muted-foreground',
                        className
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {displayText()}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <div className="flex">
                    {/* Left side: Presets */}
                    <div className="border-r p-2 space-y-1 min-w-[140px]">
                        {PRESET_OPTIONS.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => handlePresetSelect(option.value)}
                                className={cn(
                                    'w-full px-3 py-2 text-sm text-left rounded-md hover:bg-accent transition-colors flex items-center justify-between',
                                    value.type === option.value && 'bg-accent font-medium'
                                )}
                            >
                                {option.label}
                                {value.type === option.value && (
                                    <Check className="h-4 w-4 text-primary" />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Right side: Calendar (shown only for custom) */}
                    {value.type === 'custom' && (
                        <div className="p-3">
                            <Calendar
                                mode="range"
                                selected={{ from: tempRange.from, to: tempRange.to }}
                                onSelect={(range) => {
                                    if (range) {
                                        setTempRange({ from: range.from, to: range.to })
                                    }
                                }}
                                numberOfMonths={1}
                                captionLayout="dropdown-months"
                            />
                            <div className="flex gap-2 pt-3 border-t mt-3">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => {
                                        setTempRange({ from: undefined, to: undefined })
                                        setIsOpen(false)
                                    }}
                                >
                                    Clear
                                </Button>
                                <Button
                                    size="sm"
                                    className="flex-1"
                                    onClick={handleCustomApply}
                                    disabled={!tempRange.from || !tempRange.to}
                                >
                                    Apply
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    )
}
