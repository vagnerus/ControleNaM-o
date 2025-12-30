
'use client';

import type { CreditCard } from "@/lib/types";
import { cn } from "@/lib/utils";

const AmexIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <path d="M0.200271 2.22695H31.7997V29.773H0.200271V2.22695Z" fill="#006FCF"/>
        <path d="M12.383 15.6565L14.7179 11.2368H11.9863L9.65137 15.6565L11.9863 20.0762H14.7179L12.383 15.6565ZM16.002 11.2368L12.9463 17.0728V20.0762H15.1116L15.4807 19.3496H18.8926V20.0762H21.0579V11.2368H16.002ZM19.6239 15.6565C19.6239 14.5471 18.9141 13.8291 17.8428 13.8291H16.002V17.4839H17.8428C18.9141 17.4839 19.6239 16.7659 19.6239 15.6565Z" fill="white"/>
    </svg>
);

const MastercardIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3org/2000/svg" {...props}>
        <path d="M13.8667 16C13.8667 19.4673 11.0673 22.2667 7.6 22.2667C4.13269 22.2667 1.33333 19.4673 1.33333 16C1.33333 12.5327 4.13269 9.73333 7.6 9.73333C11.0673 9.73333 13.8667 12.5327 13.8667 16Z" fill="#EB001B"/>
        <path d="M24.4 22.2667C27.8673 22.2667 30.6667 19.4673 30.6667 16C30.6667 12.5327 27.8673 9.73333 24.4 9.73333C20.9327 9.73333 18.1333 12.5327 18.1333 16C18.1333 19.4673 20.9327 22.2667 24.4 22.2667Z" fill="#F79E1B"/>
        <path d="M16 16C16 19.4673 14.5473 22.562 12.2507 24.8C10.155 22.75 8.784 20.088 8.448 17.1333H15.9893C15.9947 17.1333 16 17.1333 16 17.1333V16ZM16.0107 14.8667H8.448C8.784 11.912 10.155 9.25002 12.2507 7.20002C14.5473 9.43802 16 12.5327 16 16V14.8667H16.0107Z" fill="#FF5F00"/>
    </svg>
);

const VisaIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <path d="M0.200195 2.22656H31.8V29.7726H0.200195V2.22656Z" fill="white"/>
        <path d="M12.029 21.6885L14.6469 10.3115H17.7026L15.0847 21.6885H12.029ZM20.6728 10.3115L18.423 18.2568L17.9622 16.3262C17.756 15.5369 17.4878 14.7363 17.1664 13.9248C17.0409 13.5928 16.8948 13.2608 16.7279 12.9287L16.9254 13.7993L19.2603 10.3115H20.6728ZM25.0441 21.6885H27.9942L25.3763 10.3115H22.7274C22.2562 10.3115 21.8471 10.5986 21.6802 10.9932L17.8488 21.6885H20.9897L21.3692 20.354L22.2356 20.354L22.5038 21.6885H25.0441ZM23.2396 17.9258L23.9458 14.5693L24.5784 17.9258H23.2396ZM10.5186 10.3115L7.90069 21.6885H4.84497L7.46288 10.3115H10.5186Z" fill="#1434CB"/>
    </svg>
);

const OtherIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
);


type BrandIconProps = {
    brand: CreditCard['brand'];
    className?: string;
};

export function BrandIcon({ brand, className }: BrandIconProps) {
    const commonClasses = "h-10 w-auto text-primary-foreground";
    switch (brand) {
        case 'visa':
            return <VisaIcon className={cn(commonClasses, className)} />;
        case 'mastercard':
            return <MastercardIcon className={cn(commonClasses, className)} />;
        case 'amex':
            return <AmexIcon className={cn(commonClasses, className)} />;
        default:
            return <OtherIcon className={cn(commonClasses, "h-6 w-6", className)} />;
    }
}
