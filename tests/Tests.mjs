import {getTests as IdentityPoolTests} from './IdentityPoolTests.mjs';
import {getTests as SymbolDataTests} from './SymbolDataTests.mjs';
import {getTests as TripleAndQueryTests} from './TripleAndQueryTests.mjs';
import {getTests as NamespaceTests} from './NamespaceTests.mjs';
import {getTests as DiffTests} from './DiffTests.mjs';
const testBundles = [
    IdentityPoolTests,
    SymbolDataTests,
    TripleAndQueryTests,
    NamespaceTests,
    DiffTests
];

import {loaded, JavaScriptBackend, RustWasmBackend} from '../SymatemJS.mjs';
import PRNG from './PRNG.mjs';
const rand = new PRNG();
function runAll(seed) {
    if(!seed)
        seed = rand.buffer[0];
    console.log(`Seed: ${seed}`);
    for(const backend of [new JavaScriptBackend(), new RustWasmBackend()]) {
        backend.initPredefinedSymbols();
        rand.setSeed(seed);
        const tests = {};
        for(let testBundle of testBundles)
            Object.assign(tests, testBundle(backend, rand));
        console.log(`--- ${backend.constructor.name} ---`);
        for(const testName in tests) {
            console.time(testName);
            for(let i = 0; i < tests[testName][0]; ++i)
                if(!tests[testName][1]())
                    throw new Error('Test case failed');
            console.timeEnd(testName);
        }
    }
}
loaded.then(runAll);