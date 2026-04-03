import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface AffiliateAvatarProps {
    name: string
}

const AVATAR_COLORS = [
    { bg: 'bg-blue-100', text: 'text-blue-700' },
    { bg: 'bg-green-100', text: 'text-green-700' },
    { bg: 'bg-pink-100', text: 'text-pink-700' },
    { bg: 'bg-yellow-100', text: 'text-yellow-700' },
    { bg: 'bg-purple-100', text: 'text-purple-700' },
    { bg: 'bg-red-100', text: 'text-red-700' },
]

export function AffiliateAvatar({ name }: AffiliateAvatarProps) {
    const initials = name
        .split(' ')
        .map(w => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()

    const colorIdx = name.charCodeAt(0) % AVATAR_COLORS.length
    const colors = AVATAR_COLORS[colorIdx]

    return (
        <Avatar className="h-7 w-7">
            <AvatarFallback className={`${colors.bg} ${colors.text} text-xs font-bold`}>
                {initials}
            </AvatarFallback>
        </Avatar>
    )
}
