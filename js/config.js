const prompt = require("prompt-sync")({ sigint: true });
const LocalProcess = require("./localprocess");

/**
 * Configuration Gathering
 */
class Config {
  /**
   * Constructor Setup
   *
   * @return {object} - configuration details
   */
  constructor() {
    return this.gatherMongoDetails();
  }

  /**
   * Gather MongoDB config details
   *
   * @return {object} - configuration mongodb details
   */
  gatherMongoDetails() {
    const hasEnv = new LocalProcess().isEnvSetup();
    if (hasEnv) {
      console.log("Local valid .env found! :-)");
      return {
        from_uri: process.env.GATESYNC_FROM_URI,
        from_db: process.env.GATESYNC_FROM_DB,
        to_uri: process.env.GATESYNC_TO_URI,
        to_db: process.env.GATESYNC_TO_DB,
      };
    } else {
      console.log("No valid .env found :-(");
      return this.survey();
    }
  }

  /**
   * Prompts questions for mongo configuration
   *
   * @return {object} - returns survery configuration
   */
  survey() {
    console.log("Enter Mongo Connection Details:");
    var from_uri = prompt("Enter From MongoDB URI: ");
    var from_db = prompt("Enter From MongoDB Database Name: ");
    var to_uri = prompt("Enter To MongoDB URI: ");
    var to_db = prompt("Enter To MongoDB Database Name: ");

    // Return Details
    return {
      from_uri,
      from_db,
      to_uri,
      to_db,
    };
  }
}

module.exports = Config;
