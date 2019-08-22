#! /bin/bash

mkdir -p dist dist/tests
FILES="*.js tests/*.js"
for src in $FILES
do
    dst="${src%.js}.mjs"
    cp $src dist/$dst
    if [[ "$OSTYPE" == "linux-gnu" ]]; then
        sed -i -E 's/\.js/.mjs/g' dist/$dst
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' -E 's/\.js/.mjs/g' dist/$dst
    else
        echo 'Unsupported OS'
    fi
done