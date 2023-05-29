const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs')

const APP = express();
const PORT = process.env.port || 3000;

const isoTimeStringToFileName = (isoDateString) => isoDateString?.replaceAll(':', '-').split('.')[0]
const twoDArrayToCSV = (twoDArr) => twoDArr.map(arr => { arr.push('\n'); return arr.join() }).join('')

const writeToCSVFile = (path, headers, content) => {
  try {
    headers.push('\n')
    fs.writeFileSync(path, headers.join(), { flag: 'a' })
    fs.writeFileSync(path, twoDArrayToCSV(content), { flag: 'a+' })
  } catch (err) {
    console.error(err)
  }
}

const scrapeWeb = (website, listItemLocation, headers, parseFn, myPath) => {
  try {
    axios(website).then((response) => {
      const data = response.data;
      let $ = cheerio.load(data)
      let content = []
      const listItems = $(listItemLocation)
      console.log('length:', listItems.length)
      listItems.each(parseFn($, content, true))

      console.log(website)
      writeToCSVFile(myPath, headers, content)
    });
  } catch (error) {
    console.log(error.message);
  }
}

APP.listen(PORT, () => {
  console.log(`server is running on PORT:${PORT}`);
});

const GPU_PERFORMANCE = {
  URL: 'https://www.videocardbenchmark.net/high_end_gpus.html',
  LIST_ITEM_PATH: '#mark > div > div.chart_body > ul > li',
  EXTRACT_FN:
    ($, items, withLogging) => (index, el) => {
      const cleanedData = $(el).text()
        .replaceAll(',', '')
        .replaceAll('\n','')
        .replaceAll('\t','')
        .split('  ')
        .filter(str => str.length > 1)
      if (withLogging) console.log(cleanedData)
      return items.push(cleanedData)
    },
  HEADERS: [ 'Name', 'ScorePct', 'Score', 'Price' ],
  RESULT_FILE_PATH: `data/pc-parts/videocardbenchmark-PERFORMANCE/${isoTimeStringToFileName(new Date().toISOString())}.csv`
}

const CPU_PERFORMANCE = {
  URL: 'https://www.cpubenchmark.net/high_end_cpus.html',
  LIST_ITEM_PATH: '#mark > div > div.chart_body > ul > li',
  EXTRACT_FN:
    ($, items, withLogging) => (index, el) => {
      const cleanedData = $(el).text()
        .replaceAll(',', '')
        .replaceAll('\n','')
        .replaceAll('\t','')
        .split(/\(|\)|\$|NA/)
        .filter(str => str.length > 1)
      if (withLogging) console.log(cleanedData)
      return items.push(cleanedData)
    },
  HEADERS: [ 'Name', 'ScorePct', 'Score', 'Price' ],
  RESULT_FILE_PATH: `data/pc-parts/cpubenchmark-PERFORMANCE/${isoTimeStringToFileName(new Date().toISOString())}.csv`
}

const CPU_CROSS_PLATFORM = {
  URL: 'https://www.cpubenchmark.net/cross-platform.html',
  LIST_ITEM_PATH: 'div.charts > #combined > div > div.chart_body > ul > li',
  EXTRACT_FN:
    ($, items, withLogging) => (index, el) => {
      const cleanedData = $(el).text()
        .replaceAll(',', '')
        .replaceAll('\n','')
        .replaceAll('\t','')
        .split('  ')
        .filter(str => str.length > 1)
      if (withLogging) console.log(cleanedData)
      return items.push(cleanedData)
    },
  HEADERS: [ 'Type', 'Name', 'ScorePct', 'X-Platform-Score' ],
  RESULT_FILE_PATH: `data/pc-parts/cpubenchmark-X_PLATFORM_PERFORMANCE/${isoTimeStringToFileName(new Date().toISOString())}.csv`
}

scrapeWeb(
  GPU_PERFORMANCE.URL,
  GPU_PERFORMANCE.LIST_ITEM_PATH,
  GPU_PERFORMANCE.HEADERS,
  GPU_PERFORMANCE.EXTRACT_FN,
  GPU_PERFORMANCE.RESULT_FILE_PATH
)

scrapeWeb(
  CPU_PERFORMANCE.URL,
  CPU_PERFORMANCE.LIST_ITEM_PATH,
  CPU_PERFORMANCE.HEADERS,
  CPU_PERFORMANCE.EXTRACT_FN,
  CPU_PERFORMANCE.RESULT_FILE_PATH
)

scrapeWeb(
  CPU_CROSS_PLATFORM.URL,
  CPU_CROSS_PLATFORM.LIST_ITEM_PATH,
  CPU_CROSS_PLATFORM.HEADERS,
  CPU_CROSS_PLATFORM.EXTRACT_FN,
  CPU_CROSS_PLATFORM.RESULT_FILE_PATH
)

// const scrapeAll = (configsArr) => configsArr.forEach(conf => scrapeWeb({...conf}))
//
// scrapeAll([GPU_PERFORMANCE, CPU_PERFORMANCE,CPU_CROSS_PLATFORM])