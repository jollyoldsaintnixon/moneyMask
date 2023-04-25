const path = require('path');
const fs = require('fs');

// read content script files from the 'content-scripts' folder
const contentScriptsFolder = path.join(__dirname, '../contentScripts');
const contentScriptFiles = fs.readdirSync(contentScriptsFolder);

// create entry points for each content script file
const contentScriptEntries = contentScriptFiles.reduce((entries, file) => {
  if (file.startsWith('content-script-') && file.endsWith('.js')) {
    const name = path.basename(file, '.js');
    entries[name] = path.join(contentScriptsFolder, file);
  }
  return entries;
}, {});

module.exports = {
  entry: contentScriptEntries,
  output: {
    path: path.join(__dirname, '../dist'),
    filename: '[name].bundle.js',
  },
};