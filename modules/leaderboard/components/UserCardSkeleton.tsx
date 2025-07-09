import TextSkeleton from '@modules/common/components/skeleton/TextSkeleton'
import React from 'react'

function UserCardSkeleton() {
    return (
        <div className="p-5 rounded flex items-center sm:gap-5 gap-2.5 shadow-2xs bg-bkg-light border border-border-light">
            <div className='flex items-center justify-center sm:w-[84px] w-[50px]'>
                <TextSkeleton sx="size-[25px]" />
            </div>
            <TextSkeleton sx="sm:size-[50px] size-[30px] rounded-full" />
            <TextSkeleton sx="sm:w-[100px] w-[50px] h-5" />
            <TextSkeleton sx="sm:w-[100px] w-[50px] h-5" />
            <TextSkeleton sx="sm:w-[100px] w-[50px] ml-auto h-5" />
        </div>
    )
}

export default UserCardSkeleton