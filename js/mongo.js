const LocalProcess = require("./localprocess");
const { MongoClient } = require("mongodb");
const ProgressBar = require("progress");

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
    this.limit = 1000;
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
   * Test connection
   *
   * @return {Promise} - Promise is connection worked
   */
  isConnected() {
    return new Promise(async (res, rej) => {
      try {
        await this.client.connect();
        return res(true);
      } catch (err) {
        return rej(err);
      }
    });
  }

  /**
   * Export data to JSON files
   *
   * @return {Promise} - Promise that returns an array
   */
  exportData() {
    return new Promise(async (res, rej) => {
      try {
        await this.client.connect();
        const db = this.client.db(this.db);

        const arr = await this.getAllCollections(db);
        await this.exportCollectionsToJson(db, arr);

        res(arr);
      } catch (err) {
        rej(err);
      } finally {
        this.client.close();
      }
    });
  }

  /**
   * Get all collections in database
   *
   * @param {MongoClient} db - connection details
   * @return {Promise} - Promise with either connection or error
   */
  getAllCollections(db) {
    return new Promise(async (res, rej) => {
      try {
        let arr = await db.listCollections().toArray();
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
          (c) =>
            new Promise(async (_res, _rej) => {
              try {
                if (collections.includes(c.name)) {
                  await db.dropCollection(c.name);
                }
                return _res(true);
              } catch (err) {
                _rej(err);
              }
            }),
        );

        Promise.all(promises)
          .then(() => {
            return res(true);
          })
          .catch((err) => {
            return rej(err);
          });
      } catch (err) {
        rej(err);
      }
    });
  }

  /**
   * Gathers Collection Data into Array for JSON
   *
   * @param {MongoClient} db - database connection
   * @param {string} collection - Collection from mongodb
   * @param {number} skip - Skip number
   * @return {Promise} - Return of query promise
   */
  collectionDataToArray(db, collection, skip) {
    const query = {};
    return db
      .collection(collection)
      .find(query)
      .skip(skip)
      .limit(this.limit)
      .toArray();
  }

  /**
   * Export collections to json files
   *
   * @param {MongoClient} db - Connection to mongodb
   * @param {array} collections - Array of collection names
   * @return {Promise} - Promise when all JSON files have been written
   */
  exportCollectionsToJson(db, collections) {
    return new Promise(async (res, rej) => {
      const bar = new ProgressBar("Exporting: [:bar]", {
        total: collections.length,
      });

      try {
        // Loop thru collections
        let promises = collections.map(
          (c) =>
            new Promise(async (_res, _rej) => {
              try {
                const count = await db.collection(c).countDocuments();
                const loops = Math.ceil(count / this.limit);

                // Export Loops
                for (let i = 1; i <= loops; i++) {
                  const skip = this.limit * (i - 1);
                  const data = await this.collectionDataToArray(db, c, skip);
                  await this.localProcess.writeJSONFile(`${c}-${i}`, data);
                }

                // Increase
                bar.tick();

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
  importData(collections) {
    return new Promise(async (res, rej) => {
      try {
        await this.client.connect();
        const db = this.client.db(this.db);

        // Loop thru collections and drop if exists
        await this.removeDuplicateCollections(db, collections);

        const files = this.localProcess.getTmpDirectoryArray();

        const bar = new ProgressBar("Importing: [:bar]", {
          total: files.length,
        });
        let promises = files.map(
          (f) =>
            new Promise(async (_res, _rej) => {
              const nameArr = f.split("-");
              let c = nameArr[0];

              try {
                const data = await this.localProcess.readJsonFile(f);
                await db.collection(c).insertMany(data);

                // Increase Bar
                bar.tick();

                return _res(true);
              } catch (err) {
                _rej(err);
              }
            }),
        );

        Promise.all(promises)
          .then(() => {
            this.client.close();
            return res(true);
          })
          .catch((err) => {
            return rej(err);
          });
      } catch (err) {
        return rej(err);
      }
    });
  }
}

module.exports = MongoDB;
