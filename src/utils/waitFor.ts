export function waitFor(ms: number): Promise<never> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
