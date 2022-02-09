/**
 * Custom angular webpack configuration
 */
const JavaScriptObfuscator = require('webpack-obfuscator');
module.exports = (config, options) => {
   
    if (config.mode === 'production') {
        config.plugins.push(new JavaScriptObfuscator({
            // rotateUnicodeArray: true,
            unicodeEscapeSequence: false,
            compact: true,
            controlFlowFlattening: true,
            controlFlowFlatteningThreshold: 0.75,
            // deadCodeInjection: true,
            // deadCodeInjectionThreshold: 0.4,
            debugProtection: false,
            debugProtectionInterval: false,
            disableConsoleOutput: false,
            identifierNamesGenerator: 'hexadecimal',
            log: false,
            seed: 1,
            renameGlobals: false,
            rotateStringArray: true,
            selfDefending: true
        }, ['exclde.js', 'index.html']));
    }
    return config;
}