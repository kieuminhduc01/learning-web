export {}; 

declare global {
  interface Date {
    format(formatStr: string): string;
  }
}

Date.prototype.format = function (formatStr: string): string {
  const pad = (n: number) => n.toString().padStart(2, '0');

  const map: Record<string, string | number> = {
    YYYY: this.getFullYear(),
    YY: this.getFullYear().toString().slice(-2),
    MM: pad(this.getMonth() + 1),
    DD: pad(this.getDate()),
    hh: pad(this.getHours()),
    mm: pad(this.getMinutes()),
    ss: pad(this.getSeconds()),
  };

  return formatStr.replace(/YYYY|YY|MM|DD|hh|mm|ss/g, (match) => map[match].toString());
};
