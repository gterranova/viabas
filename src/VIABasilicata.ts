import * as fs from 'fs';
import * as path from 'path';
import * as _ from 'lodash';
import axios from 'axios';

const cheerio = require('cheerio');

import * as Handlebars from 'handlebars';

const util = require('util');
const sleep = util.promisify(setTimeout);

const baseUrl = 'http://valutazioneambientale.regione.basilicata.it/valutazioneambie/section.jsp';

let sections = {
    //'VIARegionaleConclusi': 100003,
    'VIARegionaleConclusi': 102925,
    //'VIARegionale2020': 120848,
    'VIARegionale2021': 124303,
    'ScreeningConclusi': 102920,
    //'Screening2019': 116701,
    //'Screening2020': 120849,
    'Screening2021': 124304,
}

function VIALink(section, page=1) {
    return `${baseUrl}?sec=${section}&otype=1011&page=${page}`;
}

async function updateVIA(outputFile: string) {
    let results = {};
    try {
        results = JSON.parse(fs.readFileSync(outputFile).toString());
    } catch {}

    try {
        for (let key in sections) {
            console.log("Section:", key);
            if (!results[key])
                results[key]= []

            const sectionNumber = sections[key];
            let currentPage = 1
            let totalPages = 1
    
            await sleep(100);
            while (currentPage <= totalPages) {
                //console.log("getting All Procedures...", getFabricListUrl("31"));
                const paur = await axios.get(VIALink(sectionNumber, currentPage));
                const $ = cheerio.load(paur.data.toString());
                if (totalPages == 1) {
                    const pager = $('ul[class=pager]');
                    totalPages = pager.children().length? pager.children().length - 2: 1;
                    console.log("Pages", totalPages)
                }
                console.log("Current page:", currentPage)
    
                const h2 = $('h2').children();
                //const descriptions = '';
    
                h2.map( i => {
                    const text = h2[i].children[0].data.trim().replace('\n', '\t');
                    //const description = descriptions[i]?.children[0]?.data;
                    if (h2[i].attribs.href) {
                        const link = 'http://valutazioneambientale.regione.basilicata.it/valutazioneambie/'+h2[i].attribs.href;
                        const id = link.toString().substr(link.indexOf('id=')+3);
                        const entry = _(results[key]).find({ id });
                        if (entry) {
                            Object.assign(entry, {id, link, text, isNew: false })
                        } else {
                            results[key].unshift({ id, link, text, isNew: true });                             
                        }
                    }
                })
                const totalEntries = results[key].length;
                for (let item of results[key]) {
                    const itemStr = JSON.stringify(item).toUpperCase();
                    if ((/FOTOV/.test(itemStr) || /EOLIC/.test(itemStr)) && (!key.includes('Conclusi') || item.isNew)) {
                        await sleep(100);
                        const detail = await axios.get(item.link);
                        const $ = cheerio.load(detail.data.toString());
                        const subtitles = $('p.subtitle');
                        item.subtitle = subtitles[0].children[0].data.trim().replace(/\n/g, '\t');
                        const long = $('div.long');
                        item.description = long[0].children[0].data.trim().replace(/\n/g, '\t');
                        const _attachments = $('li', 'div.attachment');
                        item.attachments = _.compact(_attachments.map( i => {
                            const aTag = _attachments[i].children[1];
                            if (aTag.attribs.href) {
                                const text = aTag.children[0].data;
                                const link = 'http://valutazioneambientale.regione.basilicata.it'+aTag.attribs.href;
                                return { text, link };
                            }
                        }));    
                        if (item.isNew)
                            console.log(`[${key}] proc: ${item.id} - ${item.text} (${results[key].indexOf(item)}/${totalEntries})`);
                    }
                }
                currentPage += 1;
            }    
        }
        fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));

    } catch (e) {
        console.error(e);
        return;
    }  
        
}

async function* getFiles(dir) {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
        let res = path.join(dir, item.name);
        if (!item.isDirectory()) {
            yield res;
        } else {
            yield* getFiles(res);
        }
    }
}

function analyzeData(data: any) {
    const items = []
    for (let key in sections) {
        if (data[key]) {
            for (let item of data[key]) {
                item.procedure = key;
                const itemStr = JSON.stringify(item).toUpperCase();
                if (/FOTOV/.test(itemStr) || /EOLIC/.test(itemStr)){ items.push(item); }
            }
        }
    }
    return {items};
}

async function processTemplates(dataFile: string, outputDir = 'output', templateDir = 'templates') {
    const data = analyzeData(JSON.parse(fs.readFileSync(dataFile).toString()));
    //fs.writeFileSync(dataFile+'.processed.json', JSON.stringify(data, null, 2));
    for await (const templateFile of getFiles(templateDir)) { 
        if (templateFile.endsWith('.tmpl')) {
            console.log("Processing", templateFile);
            // TODO: make subdirs if not exists
            const outputFile = templateFile.replace(templateDir, outputDir).replace(/\.[^/.]+$/, "");
            const templateData = fs.readFileSync(templateFile).toString();
            const template = Handlebars.compile(templateData);
            fs.writeFileSync(outputFile, template({data}).trim());  
        }
    };
}

export { updateVIA, processTemplates };
