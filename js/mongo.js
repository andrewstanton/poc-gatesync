const { MongoClient } = require("mongodb");

class MongoDB {
  /**
   * Setup class with connection to DB
   * @param {string} uri - connection URI
   * @param {string} db - database to connect to
   * @return {void}
   */
  constructor(uri, db) {
    console.log("CONSTRUCTOR");
    this.setClient(uri);
    this.db = db;
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
}

module.exports = MongoDB;
