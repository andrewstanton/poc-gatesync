const fs = require("fs-extra");
const path = require("path");
const bson = require("bson");

class LocalProcess {
  /**
   * Constructor Function
   * @return {LocalProcess} - returns instance of LocalProcess class
   */
  constructor() {
    this.currentDir = process.cwd();
    this.tmpPath = path.join(this.currentDir, "/tmp");
    return this;
  }

  /**
   * Test to see if env exists
   * @return {boolean} - Returns boolean to see if env is setup
   */
  isEnvSetup() {
    const file = path.join(this.currentDir, "/.env");
    if (!fs.existsSync(file)) return false;

    // Get .env variables
    const {
      GATESYNC_FROM_URI,
      GATESYNC_FROM_DB,
      GATESYNC_TO_URI,
      GATESYNC_TO_DB,
    } = process.env;

    return GATESYNC_FROM_URI &&
      GATESYNC_FROM_DB &&
      GATESYNC_TO_URI &&
      GATESYNC_TO_DB
      ? true
      : false;
  }

  /**
   * Create tmp directory for storing files
   * if "tmp" folder exists it will be emptied
   * @return {string} - path to tmp directory
   */
  createTmpDir() {
    fs.emptyDirSync(this.tmpPath);
    return this.tmpPath;
  }

  /**
   * Removes tmp directory for storing files
   * @return {void}
   */
  removeTmpDir() {
    fs.removeSync(this.tmpPath);
    return;
  }

  /**
   * Write data to JSON file
   *
   * @param {string} name - name of JSON file
   * @param {object|array} data - Data to export to JSON file
   * @return {Promise} - writing to file Promise
   */
  writeJSONFile(name, data) {
    const file = path.join(this.tmpPath, `${name}.json`);
    return fs.writeFile(file, JSON.stringify(data));
  }

  /**
   * Write data to BSON file
   *
   * @param {string} name - name of JSON file
   * @param {object|array} data - Date To Export To JSON
   * @return {Promise} - Writing to file
   */
  writeBSONFile(name, data) {
    const file = path.join(this.tmpPath, `${name}.bson`);
    const bdata = bson.serialize(data);
    return fs.writeFile(file, bdata);
  }

  /**
   * Read in JSON data from tmp directory
   *
   * @param {string} name - JSON file name
   * @return {Promise} - Promise with parsed JSON data
   */
  readJsonFile(name) {
    const file = path.join(this.tmpPath, name);
    return new Promise(async (res, rej) => {
      try {
        if (fs.existsSync(file)) {
          const raw = await fs.readFile(file);
          return res(JSON.parse(raw));
        }

        res([]);
      } catch (err) {
        rej(err);
      }
    });
  }

  /**
   * Read in BSON data from tmp directory
   *
   * @param {string} name - BSON file name
   * @return {Promise} - Promise with parsed BSON data
   */
  readBsonFile(name) {
    const file = path.join(this.tmpPath, name);
    return new Promise(async (res, rej) => {
      try {
        if (fs.existsSync(file)) {
          const raw = await fs.readFile(file);
          const data = bson.deserialize(raw);

          return res(data);
        }

        res([]);
      } catch (err) {
        rej(err);
      }
    });
  }

  /**
   * Convert BSON Object to Array
   *
   * @param {Object} object
   * @return {array}
   */
  convertBSONObjectToArray(obj) {
    // Convert Object To Array
    const arr = [];
    Object.keys(obj).map((key) => {
      arr.push(obj[key]);
    });

    return arr;
  }

  /**
   * Get array of all files in directory
   * @return {array} - Return array with all files
   */
  getTmpDirectoryArray() {
    let arr = [];
    fs.readdirSync(this.tmpPath).forEach((file) => {
      arr.push(file);
    });

    return arr;
  }
}

module.exports = LocalProcess;
