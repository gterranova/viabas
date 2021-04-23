#!/usr/bin/env node

import * as fs from 'fs';
import { join } from 'path';

import { updateVIA, processTemplates } from './VIABasilicata';

var program = require('commander');

function isDir(path) {
    try {
        return fs.lstatSync(path).isDirectory();
    } catch (e) {
        // lstatSync throws an error if path doesn't exist
        return false;
    }
}
async function updateData(options: any) { // jshint ignore:line

    if (!isDir(options.outputdir)) {
        return program.outputHelp();
    }
    updateVIA(join(options.outputdir, options.filename));
}

async function processData(options: any) { // jshint ignore:line

    if (!isDir(options.outputdir)) {
        return program.outputHelp();
    }
    processTemplates(options.filename, options.outputdir, options.templatedir);
}

async function main() {
    program
    .version('1.0.0')
    .description('VIA/PAUR Basilicata')

    program
    .command('update')
    .option('-o, --outputdir [outputdir]', 'Output dir', 'output')
    .option('-f, --filename [filename]', 'Output filename', 'output.json')
    .action( updateData );

    program
    .command('process')
    .option('-f, --filename [filename]', 'Output filename', 'output/output.json')
    .option('-t, --templatedir [templatedir]', 'Template dir', 'templates')
    .option('-o, --outputdir [outputdir]', 'Output dir', 'output')
    .action( processData );
   
  await program.parseAsync(process.argv);
}

main();
