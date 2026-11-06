export interface AlignmentOptions {
  insertCost?: number;
  deleteCost?: number;
  substituteCost?: number;
  maxCells?: number;
}
export type EditOperation =
  | { kind: 'equal'; value: string }
  | { kind: 'insert'; value: string }
  | { kind: 'delete'; value: string }
  | { kind: 'replace'; from: string; to: string };
export interface AlignmentResult {
  distance: number;
  operations: EditOperation[];
}
export function alignSequences(
  source: string,
  target: string,
  options: AlignmentOptions = {},
): AlignmentResult {
  if (typeof source !== 'string' || typeof target !== 'string')
    throw new TypeError('Expected strings');
  const insert = options.insertCost ?? 1,
    remove = options.deleteCost ?? 1,
    substitute = options.substituteCost ?? 1,
    maxCells = options.maxCells ?? 1000000;
  for (const cost of [insert, remove, substitute])
    if (!Number.isFinite(cost) || cost < 0)
      throw new RangeError('Costs must be finite and nonnegative');
  if (!Number.isSafeInteger(maxCells) || maxCells < 1 || maxCells > 10000000)
    throw new RangeError('Invalid maxCells');
  if (source.length > maxCells * 2 || target.length > maxCells * 2)
    throw new RangeError('Input length limit exceeded');
  const a = Array.from(source),
    b = Array.from(target),
    width = b.length + 1;
  if ((a.length + 1) * width > maxCells) throw new RangeError('Alignment cell budget exceeded');
  const table = new Float64Array((a.length + 1) * width);
  const finite = (n: number): number => {
    if (!Number.isFinite(n)) throw new RangeError('Alignment cost overflow');
    return n;
  };
  for (let i = 1; i <= a.length; i++) table[i * width] = finite(i * remove);
  for (let j = 1; j <= b.length; j++) table[j] = finite(j * insert);
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++) {
      const diagonal = finite(
        table[(i - 1) * width + j - 1]! + (a[i - 1] === b[j - 1] ? 0 : substitute),
      );
      const deletion = finite(table[(i - 1) * width + j]! + remove),
        insertion = finite(table[i * width + j - 1]! + insert);
      table[i * width + j] = Math.min(diagonal, deletion, insertion);
    }
  const operations: EditOperation[] = [];
  let i = a.length,
    j = b.length;
  while (i > 0 || j > 0) {
    const value = table[i * width + j]!;
    if (
      i > 0 &&
      j > 0 &&
      value === table[(i - 1) * width + j - 1]! + (a[i - 1] === b[j - 1] ? 0 : substitute)
    ) {
      operations.push(
        a[i - 1] === b[j - 1]
          ? { kind: 'equal', value: a[i - 1]! }
          : { kind: 'replace', from: a[i - 1]!, to: b[j - 1]! },
      );
      i--;
      j--;
    } else if (i > 0 && value === table[(i - 1) * width + j]! + remove) {
      operations.push({ kind: 'delete', value: a[i - 1]! });
      i--;
    } else {
      operations.push({ kind: 'insert', value: b[j - 1]! });
      j--;
    }
  }
  operations.reverse();
  return { distance: table[a.length * width + b.length]!, operations };
}
