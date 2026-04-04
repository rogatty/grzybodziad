/** Returns true when the primary pointing device is touch (phone/tablet). */
export function isMobile(): boolean {
    return window.matchMedia('(pointer: coarse)').matches;
}
