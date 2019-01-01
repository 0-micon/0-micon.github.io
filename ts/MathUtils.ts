namespace MathUtils {
/*\
 * Returns a random number between minValue (inclusive) and maxValue (exclusive)
\*/
  export function randomNumber(minValue: number, maxValue: number): number {
    return Math.random() * (maxValue - minValue) + minValue;
  }
  export function randomIneger(minValue: number, maxValue: number): number {
    return Math.floor(Math.random() * (maxValue - minValue)) + minValue;
  }
}
