# @lp-labs/sequence-alignment

Weighted Unicode code-point Levenshtein alignment with executable edit scripts. Zero runtime and peer dependencies. MIT. Node.js 18+; ES2022-compatible browser runtimes with BigInt where used. No browser globals accessed at import.

## Install

```sh
npm install @lp-labs/sequence-alignment
```

## Quick start

```js
import { alignSequences } from '@lp-labs/sequence-alignment';
const result = alignSequences('cat', 'cut');
console.log(result.distance, result.operations); // 1, equal/replace/equal
```

ES modules use named imports above. CommonJS uses `const { alignSequences } = require('@lp-labs/sequence-alignment');`. Both formats ship declarations.

## Public API and customization

- `AlignmentOptions`: `insertCost?`, `deleteCost?`, `substituteCost?` default 1, and `maxCells?` default 1,000,000 (maximum 10,000,000).
- `EditOperation`: discriminated union of `equal {value}`, `insert {value}`, `delete {value}`, `replace {from,to}`, each including `kind`.
- `AlignmentResult`: `distance`, `operations` in forward execution order.
- `alignSequences(source,target,options?): AlignmentResult`. Consume source sequentially: equal emits and consumes, insert emits only, delete consumes only, replace consumes from and emits to. Each operation covers one code point.

All runtime exports and public declaration types are listed above. Options are per call/instance; no global configuration.

## Errors, ownership and limits

Weighted Levenshtein O(mn) time/storage, budget exactly (m+1)(n+1). Strings are Unicode code-point sequences, not grapheme clusters; no normalization. Diagonal, deletion, insertion is tie precedence during traceback. TypeError for nonstrings; RangeError for bad costs/budgets, input/cell exhaustion or any encountered cost overflow, even a nonwinning candidate. Costs are finite doubles, so rounding applies. Fresh operation objects; no input mutation.

Algorithms are synchronous and CPU/memory bounded by the stated limits, not cancellable or real-time. Validation does not sandbox hostile getters, proxies, callbacks or infinite iterables. TypeScript signatures are the supported input contract. No I/O, network, persistence or cryptographic guarantees.

## Development

```sh
npm ci --offline
npm run build
npm run typecheck
npm test
npm run format:check
```

Strict TypeScript, ESM/CommonJS, bare installed-package consumers with negative type assertions, and deterministic reference-oracle tests are included. Only TypeScript and Prettier are development dependencies.

## Support

If this library is useful to you, consider supporting its maintenance with a [donation via PayPal](https://www.paypal.me/LibinPrasanth).

## Author

Created by [Libin Prasanth](https://www.linkedin.com/in/libinprasanth/). Connect on LinkedIn for updates and discussion.
