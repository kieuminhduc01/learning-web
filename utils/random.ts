export {};
declare global {
  interface Math {
    randomBetween(min: number, max: number): number;
  }
}

Math.randomBetween = (min: number, max: number): number =>
   Math.floor(Math.random() * (max - min + 1)) + min;

