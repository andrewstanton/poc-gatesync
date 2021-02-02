const LocalProcess = require("./localprocess");
const { MongoClient } = require("mongodb");
const ProgressBar = require("progress");
const bcrypt = require("bcrypt");

/**
 * User Creation Status
 * -- would be good as an Enum
 */
const USER_CREATE_STATUS = {
  NONE: "none",
  DUPLICATE: "duplicate",
  CREATED: "created",
};

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
    this.blacklistedCollection = ["sessions"];
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
    }
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
            })
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
   * Insert New User Into DB
   *
   * @param {MongoClient} db - database connection
   * @param {object} config - Configuration object from prompts
   * @return {Promise} - Return of query promise
   */
  insertNewUser(db, config) {
    return new Promise(async (res, rej) => {
      if (!config.user) {
        return res({
          status: USER_CREATE_STATUS.NONE,
        });
      }

      const { email, first_name, last_name, region } = config.user;
      const users = db.collection("users");
      const record = await users.findOne({ email });

      // Already in system
      if (record) {
        return res({
          status: USER_CREATE_STATUS.DUPLICATE,
        });
      }

      // Insert New User
      const pwd = Math.random().toString(36).slice(2);
      const hash = bcrypt.hashSync(pwd, 10);
      const uid = new Date().getTime();
      const security = [
        { module: "meetings", access: "full", level: "regional" },
        { module: "volunteers", access: "full", level: "regional" },
        { module: "inmates", access: "full", level: "regional" },
        { module: "facilities", access: "full", level: "regional" },
        { module: "experiences", access: "full", level: "regional" },
        { module: "statistics", access: "full", level: "regional" },
        { module: "correspondence", access: "full", level: "regional" },
        { module: "applicants", access: "full", level: "regional" },
        { module: "settings", access: "full", level: "regional" },
      ];

      const insertRecord = {
        userID: uid,
        username: email,
        email,
        password: hash,
        firstName: first_name,
        lastName: last_name,
        region,
        role: "regional",
        security,
        status: "verifying",
      };

      await users.insertOne(insertRecord);
      return res({
        status: USER_CREATE_STATUS.CREATED,
        pwd,
        uid,
        email,
      });
    });
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
      collections = this.filterCollections(collections);

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
            })
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
   * Remove Blacklisted Collections From Variable
   *
   * @param {array} collections - Collections From Database
   * @return {array} - Filtered Collections
   */
  filterCollections(collections) {
    return collections.filter((c) => !this.blacklistedCollection.includes(c));
  }

  /**
   * Import JSON files into database
   *
   * @param {array} collections - Collections to import
   * @param {object} config - Configuration Object
   * @return {Promise} - Promise after importing collections
   */
  importData(collections, config) {
    return new Promise(async (res, rej) => {
      collections = this.filterCollections(collections);

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
            })
        );

        // After Inserting All Records In
        Promise.all(promises)
          .then(async () => {
            // Insert New User
            const info = await this.insertNewUser(db, config);

            // Later can swap out for emailing information
            switch (info.status) {
              case USER_CREATE_STATUS.CREATED:
                console.log(`\nUser Account Created With This Login Info:`);
                console.log(`Email: ${info.email}`);
                console.log(`Password: ${info.pwd}\n`);
                break;
              case USER_CREATE_STATUS.DUPLICATE:
                console.log("User Account Already Exists In System");
                break;
            }

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
