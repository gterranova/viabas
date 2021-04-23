# Basilicata Enviromental procedures 

Viabas is a simple tool performing data mining on environmental procedures before Basilicata Region.

Information are stored in json format, allowing further processing of the information retrieved. E.g.

``` json
{
  "VIARegionaleConclusi": [
    {
      "id": "123456",
      "link": "[...]",
      "text": "Progetto di una centrale idroelettrica [...]",
      "isNew": true,
      "subtitle": "[...]",
      "description": "[...]",
      "attachments": [
        {
          "text": "[...]",
          "link": "[...]"
        }
      ]
    },
    [...]
  ]
}
```     

## Installation

1) Download and install Node.js;
2) Download or clone this repository and execute `npm run build` from the package directory;
3) (Optional) execute `npm install -g` to install viabas globally.

## Usage

### Warning: This is a proof-of-concept. You are kindly advised to use the tool responsibly and to avoid generating unnecessary traffic on the Region EIA portal.

``` bash
$ viabas

Usage: viabas [options] [command]

VIA/PAUR Basilicata

Options:
  -V, --version      output the version number
  -h, --help         display help for command

Commands:
  update [options]
  process [options]
  help [command]     display help for command
```

``` bash
$ viabas help update

Usage: viabas update [options]

Options:
  -o, --outputdir [outputdir]  Output dir (default: "output")
  -f, --filename [filename]    Output filename (default: "output.json")
  -h, --help                   display help for command

```

### Data processing

The tool can provide the retrieved data as input to any templates file in a specified folder, to generate CSV, HTML, MD or other text formats.
Simply execute `viabas process -f [path of the generated json file] -o [output folder] -t [path of the templates folder]`.

Each template must be in a format compatible with [handlebarsjs](https://handlebarsjs.com/).
The example template included in the package's "templates" folder would convert the retrieved data in a csv file (e.g. for further processing in an excel spreadsheet):

``` csv
"Procedure","ID","Link","Title","Subtitle","Description","Started","Ended","Status"
{{#each data.items}}
"{{procedure}}","{{id}}","{{{link}}}","{{text}}","{{subtitle}}","{{description}}","{{started}}","{{ended}}","{{status}}"
{{/each}}
```

More complex data processing is left to the users.

## License

Copyright (c) 2021, Gianpaolo Terranova. (MIT License)