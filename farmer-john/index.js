const path = require('path');
const separatedPath = process.cwd().split(path.sep);
const fs = require('fs');


require('dotenv').config({
  path: separatedPath.slice(0, separatedPath.indexOf('ccim') + 1).join(path.sep) + path.sep + '.env'
});

module.exports = () => {

  // find the folder and require the indexes to group.
  const getDirectories = function (source) {
    return fs.readdirSync(source, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
  }

  const farms = [];
  const directories = getDirectories(__dirname);
  for (const dir of directories) {
    const pth = './' + dir + '/index.js';
    if (fs.existsSync(path.resolve(__dirname, pth))) {
      const folderFarms = require(pth);
      const farm = {
        chain: dir,
        files: folderFarms
      }
      farms.push(farm);
    }
  }
  return farms;
  // Load the index files per folder and then include only the specific files on them in order to
  // get infos..

}
