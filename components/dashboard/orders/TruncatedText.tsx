'use client'

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface TruncatedTextProps {
    text: string
    maxLength: number
    className?: string
    style?: React.CSSProperties
}

export function TruncatedText({ text, maxLength, className = '', style }: TruncatedTextProps) {
    const isTruncated = text.length > maxLength
    const displayText = isTruncated ? `${text.slice(0, maxLength)}...` : text

    if (!isTruncated) {
        return <span className={className} style={style}>{text}</span>
    }

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <span className={`cursor-pointer ${className}`} style={style}>{displayText}</span>
                </TooltipTrigger>
                <TooltipContent>
                    <p className="max-w-xs">{text}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}
