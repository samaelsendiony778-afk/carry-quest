export type Problem = { id: string; n: number; m: number };

export type Break = {
  ones: number;
  tens: number;
  onesProd: number;
  carry: number;
  onesDigit: number;
  tensSum: number;
  answer: number;
};

export function breakdown(n: number, m: number): Break {
  const ones = n % 10;
  const tens = Math.floor(n / 10);
  const onesProd = ones * m;
  const carry = Math.floor(onesProd / 10);
  const onesDigit = onesProd % 10;
  const tensSum = tens * m + carry;
  return { ones, tens, onesProd, carry, onesDigit, tensSum, answer: n * m };
}

export const LEARN: Problem = { id: "learn", n: 43, m: 6 };

export const PRACTICE: Problem[] = [
  { id: "p1", n: 37, m: 8 },
  { id: "p2", n: 58, m: 3 },
  { id: "p3", n: 54, m: 4 },
  { id: "p4", n: 72, m: 6 },
  { id: "p5", n: 93, m: 6 },
  { id: "p6", n: 85, m: 5 },
];

export function makeChallenge(count = 8): Problem[] {
  const out: Problem[] = [];
  const seen = new Set<string>();
  let guard = 0;
  while (out.length < count && guard < 400) {
    guard += 1;
    const n = 12 + Math.floor(Math.random() * 88);
    const m = 2 + Math.floor(Math.random() * 8);
    const key = `${n}x${m}`;
    if (breakdown(n, m).onesProd < 10 || seen.has(key)) continue;
    seen.add(key);
    out.push({ id: `c${out.length}-${key}`, n, m });
  }
  return out;
}

export function starsFor(misses: number, helped: boolean): number {
  if (helped) return 1;
  if (misses <= 0) return 3;
  if (misses === 1) return 2;
  return 1;
}
