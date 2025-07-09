import { cn } from '@lib/utils/style'
import React from 'react'

type Props = {
    sx?: string,
    children: React.ReactNode
}

function SectionCard({ children, sx }: Props) {
    return (
        <section className={cn('p-5 sm:p-10 rounded-large bg-bkg-light flex flex-col gap-10 shadow-2xs', sx)}>
            {children}
        </section>
    )
}

export default SectionCard
