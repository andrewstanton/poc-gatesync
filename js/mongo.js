const LocalProcess = require("./localprocess");
const { MongoClient } = require("mongodb");

class MongoDB {
  /**
   * Setup class with connection to DB
   * @param {string} uri - connection URI
   * @param {string} db - database to connect to
   * @return {MongoDB} - returns instance of current class
   */
  constructor(uri, db) {
    this.setClient(uri);
    this.db = db;
    this.localProcess = new LocalProcess();
    return this;
  }

  /**
   * Connect To DB
   * @param {string} uri - connection URI
   * @param {object} options - options object for MongoClient
   * @return {void}
   */
  setClient(
    uri,
    options = {
      useUnifiedTopology: true,
    },
  ) {
    this.client = new MongoClient(uri, options);
  }

  /**
   * Get all collections in database
   *
   * @return {Promise} - Promise with either connection or error
   */
  getAllCollections() {
    return new Promise(async (res, rej) => {
      try {
        await this.client.connect();
        let arr = await this.client.db(this.db).listCollections().toArray();
        arr = arr.map((c) => c.name);
        res(arr);
      } catch (err) {
        rej(err);
      }
    });
  }

  /**
   * Remove collections from database copying into
   *
   * @param {MongoClient} db
   * @param {array} collections
   * @return {Promise} - Promise of removing collections
   */
  removeDuplicateCollections(db, collections) {
    return new Promise(async (res, rej) => {
      try {
        let arr = await db.listCollections().toArray();
        let promises = arr.map(
          async (c) =>
            new Promise(async (_res, _rej) => {
              try {
                if (collections.includes(c.name)) {
                  await db.dropCollection(c.name);
                }
              } catch (err) {
                _rej(err);
              }
            }),
        );

        Promise.all(promises).then(() => {
          res(true);
        });
      } catch (err) {
        rej(err);
      }
    });
  }

  /**
   * Gathers Collection Data into Array for JSON
   *
   * @param {sting} db
   * @param {string} collection
   * @return {Promise} - Return of query promise
   */
  collectionDataToArray(db, collection) {
    const query = {};
    return db.collection(collection).find(query).toArray();
  }

  /**
   * Export collections to json files
   *
   * @param {array} collections - Array of collection names
   * @return {Promise} - Promise when all JSON files have been written
   */
  exportCollectionsToJson(collections) {
    return new Promise(async (res, rej) => {
      try {
        await this.client.connect();
        const db = await this.client.db(this.db);

        // Loop thru collections
        let promises = collections.map(
          (c) =>
            new Promise(async (_res, _rej) => {
              try {
                const data = await this.collectionDataToArray(db, c);
                await this.localProcess.writeJSONFile(c, data);
                return _res(true);
              } catch (err) {
                _rej(err);
              }
            }),
        );

        // Wait Till All Promises Finish
        Promise.all(promises)
          .then(() => {
            res(true);
          })
          .catch((err) => rej(err));
      } catch (err) {
        return rej(err);
      }
    });
  }

  /**
   * Import JSON files into database
   *
   * @param {array} collections - Collections to import
   * @return {Promise} - Promise after importing collections
   */
  importJsonToCollections(collections) {
    return new Promise(async (res, rej) => {
      try {
        await this.client.connect();
        const db = this.client.db(this.db);

        // Loop thru collections and drop if exists
        await this.removeDuplicateCollections(db, collections);

        let promises = collections.map(
          (c) =>
            new Promise(async (_res, _rej) => {
              try {
                const data = await this.localProcess.readJsonFile(c);
                db.collection(c).insertMany(data);
                return _res(true);
              } catch (err) {
                _rej(err);
              }
            }),
        );

        Promise.all(promises).then(() => {
          return res(true);
        });
      } catch (err) {
        return rej(err);
      }
    });
  }
}

module.exports = MongoDB;
