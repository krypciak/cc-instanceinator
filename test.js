#!/bin/node
import { startCrossnode } from '../crossnode/crossnode.js'
startCrossnode({
    test: true,
    determinism: true,
    ccloader2: true,
    nukeImageStack: true,
    
    modWhitelist: ['cc-session'],
    extensionWhitelist: [],
    modTestWhitelist: ['cc-session'],
})

