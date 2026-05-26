// TSX trading-hours utility. Currently informational — Yahoo doesn't
// rate-limit hard enough to care. Kept around for the future when we
// might want to gate a paid backup source on it.

const TSX_OPEN_HOUR = 9;
const TSX_OPEN_MINUTE = 15;
const TSX_CLOSE_HOUR = 16;
const TSX_CLOSE_MINUTE = 15;

function nowInET(): Date {
  const now = new Date();
  return new Date(
    now.toLocaleString("en-US", { timeZone: "America/New_York" })
  );
}

export function isMarketOpen(): boolean {
  const et = nowInET();
  const day = et.getDay();
  if (day === 0 || day === 6) return false;
  const mins = et.getHours() * 60 + et.getMinutes();
  const open = TSX_OPEN_HOUR * 60 + TSX_OPEN_MINUTE;
  const close = TSX_CLOSE_HOUR * 60 + TSX_CLOSE_MINUTE;
  return mins >= open && mins <= close;
}

export function isExtendedHours(): boolean {
  const et = nowInET();
  const day = et.getDay();
  if (day === 0 || day === 6) return false;
  const mins = et.getHours() * 60 + et.getMinutes();
  const close = TSX_CLOSE_HOUR * 60 + TSX_CLOSE_MINUTE;
  return mins > close && mins <= 18 * 60;
}
