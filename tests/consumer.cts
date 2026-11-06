import {
  alignSequences,
  type AlignmentOptions,
  type EditOperation,
  type AlignmentResult,
} from '@lp-labs/sequence-alignment';
export type PublicTypes = [AlignmentOptions, EditOperation, AlignmentResult];
void alignSequences;
const result: AlignmentResult = alignSequences('a', 'b', { substituteCost: 2 });
const ops: EditOperation[] = result.operations;
void ops;
// @ts-expect-error costs are numeric
alignSequences('a', 'b', { deleteCost: '1' });
