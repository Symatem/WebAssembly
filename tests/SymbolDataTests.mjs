import {Utils, SymbolInternals} from '../src/SymatemJS.mjs';

export function getTests(backend, rand) {
    const namespaceIdentity = SymbolInternals.identityOfSymbol(backend.createSymbol(backend.metaNamespaceIdentity)),
          destination = backend.createSymbol(namespaceIdentity),
          source = backend.createSymbol(namespaceIdentity);

    function bitStringOfSymbol(symbol) {
        const dataLength = backend.getLength(symbol),
              dataBytes = backend.readData(symbol, 0, dataLength);
        return Utils.asBitString(dataBytes, dataLength);
    }

    function fillSymbol(symbol) {
        const dataLength = rand.range(0, 512),
              dataBytes = rand.bytes(Math.ceil(dataLength/32)*4);
        dataBytes[Math.floor(dataLength/8)] &= ~((-1)<<(dataLength%8));
        for(let i = Math.floor(dataLength/8)+1; i < dataBytes.length; ++i)
            dataBytes[i] = 0;
        backend.setLength(symbol, dataLength);
        backend.writeData(symbol, 0, dataLength, dataBytes);
        return [bitStringOfSymbol(symbol), dataLength, rand.range(0, dataLength)];
    }

    function addBracesAt(string, offset, length) {
        return [string.substr(0, offset), '[', string.substr(offset, length), ']', string.substr(offset+length)].join('');
    }

    const tests = {
        'decreaseLength': [1000, () => new Promise((resolve, reject) => {
            const [destinationString, destinationLength, destinationOffset] = fillSymbol(destination),
                  length = rand.range(0, destinationLength-destinationOffset),
                  expectedString = [destinationString.substr(0, destinationOffset), destinationString.substr(destinationOffset+length)].join('');
            const success = backend.creaseLength(destination, destinationOffset, -length),
                  resultString = bitStringOfSymbol(destination);
            if(!success || expectedString != resultString)
                throw new Error('decreaseLength', success,
                    destinationOffset, destinationLength, length,
                    addBracesAt(destinationString, destinationOffset, length),
                    addBracesAt(expectedString, destinationOffset, 0),
                    addBracesAt(resultString, destinationOffset, 0)
                );
            resolve();
        })],
        'increaseLength': [1000, () => new Promise((resolve, reject) => {
            const [destinationString, destinationLength, destinationOffset] = fillSymbol(destination),
                  length = rand.range(0, 512),
                  expectedString = [destinationString.substr(0, destinationOffset), new Array(length).fill('0').join(''), destinationString.substr(destinationOffset)].join('');
            const success = backend.creaseLength(destination, destinationOffset, length),
                  resultString = bitStringOfSymbol(destination);
            if(!success || expectedString != resultString)
                throw new Error('increaseLength', success,
                    destinationOffset, destinationLength, length,
                    addBracesAt(destinationString, destinationOffset, 0),
                    addBracesAt(expectedString, destinationOffset, length),
                    addBracesAt(resultString, destinationOffset, length)
                );
            resolve();
        })],
        'readData': [2000, () => new Promise((resolve, reject) => {
            const [sourceString, sourceLength, sourceOffset] = fillSymbol(source),
                  length = rand.range(0, sourceLength-sourceOffset),
                  expectedString = sourceString.substr(sourceOffset, length);
            const result = backend.readData(source, sourceOffset, length),
                  resultString = Utils.asBitString(result, length);
            if(!result || expectedString != resultString)
                throw new Error('readData',
                    sourceOffset, sourceLength, length,
                    addBracesAt(sourceString, sourceOffset, length),
                    expectedString,
                    resultString
                );
            resolve();
        })],
        'writeData': [1200, () => new Promise((resolve, reject) => {
            const [destinationString, destinationLength, destinationOffset] = fillSymbol(destination),
                  sourceLength = rand.range(0, Math.min(destinationLength-destinationOffset)),
                  sourceBuffer = rand.bytes(Math.ceil(sourceLength/32)*4),
                  sourceString = Utils.asBitString(sourceBuffer, sourceLength),
                  expectedString = [destinationString.substr(0, destinationOffset), sourceString.substr(0, sourceLength), destinationString.substr(destinationOffset+sourceLength)].join('');
            const success = backend.writeData(destination, destinationOffset, sourceLength, sourceBuffer),
                  resultString = bitStringOfSymbol(destination);
            if(!success || expectedString != resultString)
                throw new Error('writeData', success,
                    destinationOffset, destinationLength, sourceLength,
                    sourceString,
                    addBracesAt(destinationString, destinationOffset, sourceLength),
                    addBracesAt(expectedString, destinationOffset, sourceLength),
                    addBracesAt(resultString, destinationOffset, sourceLength)
                );
            resolve();
        })],
        'replaceData': [1000, () => new Promise((resolve, reject) => {
            const [destinationString, destinationLength, destinationOffset] = fillSymbol(destination),
                  [sourceString, sourceLength, sourceOffset] = fillSymbol(source),
                  length = rand.range(0, Math.min(destinationLength-destinationOffset, sourceLength-sourceOffset)),
                  expectedString = [destinationString.substr(0, destinationOffset), sourceString.substr(sourceOffset, length), destinationString.substr(destinationOffset+length)].join('');
            const success = backend.replaceData(destination, destinationOffset, source, sourceOffset, length),
                  resultString = bitStringOfSymbol(destination);
            if(!success || expectedString != resultString)
                throw new Error('replaceData', success,
                    destinationOffset, destinationLength, sourceOffset, sourceLength, length,
                    addBracesAt(sourceString, sourceOffset, length),
                    addBracesAt(destinationString, destinationOffset, length),
                    addBracesAt(expectedString, destinationOffset, length),
                    addBracesAt(resultString, destinationOffset, length)
                );
            resolve();
        })],
        // TODO: bitwiseCopy with destination == source is not implemented yet
        // TODO: 'replaceDataSimultaneously': () => {}
        'IEEE754-64': [1000, () => new Promise((resolve, reject) => {
            const dataValue = rand.nextFloat();
            backend.setData(destination, dataValue);
            if(dataValue != backend.getData(destination))
                throw new Error('IEEE754-64', dataValue, backend.getData(destination), backend.getRawData(destination).buffer);
            resolve();
        })]
    };
    for(const sign of [1, -1]) {
        for(let i = 3; i < 7; ++i) {
            const bits = 1<<i,
                  testName = (sign == 1) ? `BinaryNumber-${bits}` : `TwosComplement-${bits}`;
            tests[testName] = [1000, () => new Promise((resolve, reject) => {
                const dataValue = sign*parseInt('0x'+Utils.encodeAsHex(rand.bytes(bits/8)));
                backend.setData(destination, dataValue);
                if(dataValue != backend.getData(destination))
                    throw new Error(testName, dataValue, backend.getData(destination), backend.getRawData(destination).buffer);
                resolve();
            })];
        }
    }
    return tests;
}
