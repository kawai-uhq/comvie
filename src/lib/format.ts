/** 31648 -> "31.6k" */
export const votesShort = (n?: number) => (!n ? '' : n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n));
