const START_TIMESTAMP = Date.now();

export function getUptime() {
    const uptime = Date.now() - START_TIMESTAMP;

    const ms = uptime % 1000;
    const s = Math.floor((uptime / 1000) % 60);
    const m = Math.floor((uptime / (1000 * 60)) % 60);
    const h = Math.floor((uptime / (1000 * 60 * 60)) % 24);
    const d = Math.floor(uptime / (1000 * 60 * 60 * 24));

    return { d, h, m, s, ms };
}
