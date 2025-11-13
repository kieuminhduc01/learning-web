export { };

const formatTime = (date: Date, formatStr: string): string => {
  const pad = (n: number) => n.toString().padStart(2, '0');
  console.log("Date", date);
  const map: Record<string, string | number> = {
    YYYY: date.getFullYear(),
    YY: date.getFullYear().toString().slice(-2),
    MM: pad(date.getMonth() + 1),
    DD: pad(date.getDate()),
    hh: pad(date.getHours()),
    mm: pad(date.getMinutes()),
    ss: pad(date.getSeconds()),
  };

  return formatStr.replace(/YYYY|YY|MM|DD|hh|mm|ss/g, (match) => map[match].toString());
}

const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export { formatTime,addDays };