const fs = require("fs-extra");
const path = require("path");

class LocalProcess {
  /**
   * Constructor Function
   *
   * @return {LocalProcess} - returns instance of LocalProcess class
   */
  constructor() {
    this.currentDir = process.cwd();
    this.tmpPath = path.join(this.currentDir, "/tmp");
    return this;
  }

  /**
   * Create tmp directory for storing files
   * if "tmp" folder exists it will be emptied
   *
   * @return {string} - path to tmp directory
   */
  createTmpDir() {
    fs.emptyDirSync(this.tmpPath);
    return this.tmpPath;
  }

  /**
   * Write data to JSON file
   *
   * @param {string} name - name of JSON file
   * @param {object|array} data - Data to export to JSON file
   *
   * @return {Promise} - writing to file Promise
   */
  writeJSONFile(name, data) {
    const file = path.join(this.tmpPath, `${name}.json`);
    return fs.writeFile(file, JSON.stringify(data));
  }

  /**
   * Read in JSON data from tmp directory
   *
   * @param {string} name - JSON file name
   * @return {Promise} - Promise with parsed JSON data
   */
  readJsonFile(name) {
    const file = path.join(this.tmpPath, `${name}.json`);
    return new Promise(async (res, rej) => {
      try {
        if (fs.existsSync(file)) {
          // console.log(`EXISTS: ${file}`);
          const raw = await fs.readFile(file);
          return res(JSON.parse(raw));
        }

        // console.log(`DOES NOT EXIST: ${file}`);
        res([]);
      } catch (err) {
        rej(err);
      }
    });
  }
}

module.exports = LocalProcess;
