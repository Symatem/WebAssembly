import BasicBackend from '../BasicBackend.js';

export default function(ontology, rand) {
    let triplePool = new Set();
    const symbolPool = [], maskByIndex = Object.keys(BasicBackend.queryMask);
    for(let i = 0; i < 10; ++i)
        symbolPool.push(ontology.createSymbol(4));

    return {
        'setTriple': () => {
            const triple = [rand.selectUniformly(symbolPool), rand.selectUniformly(symbolPool), rand.selectUniformly(symbolPool)],
                  tripleTag = triple.toString(),
                  tripleExists = triplePool.has(tripleTag),
                  linked = rand.selectUniformly([false, true]),
                  result = ontology.setTriple(triple, linked);
            if(linked)
                triplePool.add(tripleTag);
            else
                triplePool.delete(tripleTag);
            if((tripleExists != linked) != result) {
                console.error([...triplePool].sort().join(' '), triple, tripleExists, linked, result);
                return false;
            }
            return true;
        },
        'queryTriples': () => {
            const triple = [rand.selectUniformly(symbolPool), rand.selectUniformly(symbolPool), rand.selectUniformly(symbolPool)],
                  maskIndex = rand.range(0, 27),
                  mask = maskByIndex[maskIndex],
                  iterator = ontology.queryTriples(maskIndex, triple),
                  result = new Set(), expected = new Set();
            for(const tripleTag of triplePool) {
                const tripleFromPool = tripleTag.split(',');
                let select = true;
                for(let j = 0; j < 3; ++j) {
                    if(mask[j] == 'I')
                        tripleFromPool[j] = triple[j];
                    else if(mask[j] == 'M' && tripleFromPool[j] != triple[j]) {
                        select = false;
                        break;
                    }
                }
                if(select)
                    expected.add(tripleFromPool.toString());
            }
            let noErrorsOccured = true;
            while(true) {
                const element = iterator.next();
                if(element.done) {
                    if(element.value != result.size || element.value != expected.size)
                        noErrorsOccured = false;
                    break;
                }
                const tripleTag = element.value.toString();
                result.add(tripleTag);
                if(!expected.has(tripleTag))
                    noErrorsOccured = false;
            }
            if(!noErrorsOccured)
                console.error(triple, mask, [...triplePool].sort(), [...ontology.queryTriples(BasicBackend.queryMask.VVV, triple)].sort(), [...result].sort(), [...expected].sort());
            return noErrorsOccured;
        },
        'moveTriples': () => {
            const translationTable = {},
                  dstSymbols = [],
                  srcSymbols = new Set(symbolPool);
            for(let i = 0; i < 5; ++i) {
                const srcSymbol = rand.selectUniformly([...srcSymbols]),
                      dstSymbol = ontology.createSymbol(4);
                translationTable[srcSymbol] = dstSymbol;
                srcSymbols.delete(srcSymbol);
                dstSymbols.push(dstSymbol);
            }
            symbolPool.length = 0;
            for(const srcSymbol of srcSymbols)
                symbolPool.push(srcSymbol);
            for(const dstSymbol of dstSymbols)
                symbolPool.push(dstSymbol);
            const renamedTriplePool = new Set();
            for(const tripleTag of triplePool) {
                const triple = tripleTag.split(',');
                for(let i = 0; i < 3; ++i) {
                    const srcSymbol = triple[i],
                          dstSymbol = translationTable[srcSymbol];
                    triple[i] = (dstSymbol) ? dstSymbol : srcSymbol;
                }
                renamedTriplePool.add(triple.toString());
            }
            triplePool = renamedTriplePool;
            ontology.moveTriples(translationTable);
            const expected = [...triplePool].sort(),
                  result = [...ontology.queryTriples(BasicBackend.queryMask.VVV, [])].sort();
            let noErrorsOccured = (expected.length == result.length) && ontology.validateIntegrity();
            for(let i = 0; i < expected.length && noErrorsOccured; ++i)
                if(expected[i] != result[i].toString())
                    noErrorsOccured = false;
            if(!noErrorsOccured)
                console.error(result, expected);
            return noErrorsOccured;
        }
    };
}
