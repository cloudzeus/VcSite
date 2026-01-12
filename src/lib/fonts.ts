import localFont from 'next/font/local'

export const cfHelvetica = localFont({
    src: [
        {
            path: '../../public/fonts/CFHelExtLig.ttf',
            weight: '300',
            style: 'normal',
        },
        {
            path: '../../public/fonts/CFHelLig.ttf',
            weight: '400',
            style: 'normal',
        },
        {
            path: '../../public/fonts/CFHelMed.ttf',
            weight: '500',
            style: 'normal',
        },
        {
            path: '../../public/fonts/CFHelBol.ttf',
            weight: '700',
            style: 'normal',
        },
        {
            path: '../../public/fonts/CFHelExtBol.ttf',
            weight: '800',
            style: 'normal',
        },
    ],
    variable: '--font-cf-helvetica',
})

export const cfHelveticaCondensed = localFont({
    src: [
        {
            path: '../../public/fonts/CFHelConReg.ttf',
            weight: '400',
            style: 'normal',
        }
    ],
    variable: '--font-cf-helvetica-condensed',
})
