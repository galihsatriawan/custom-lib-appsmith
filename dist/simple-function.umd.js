!function(e,t){"object"==typeof exports&&"undefined"!=typeof module?module.exports=t():"function"==typeof define&&define.amd?define(t):(e="undefined"!=typeof globalThis?globalThis:e||self).simpleFunction=t()}(this,(function(){"use strict";return{async fetchJsContent(e){const t=await fetch(e);if(!t.ok)throw new Error(`Failed to fetch JS content from ${e}`);return t.text()}}}));
