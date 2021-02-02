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

      // Env Variables
      const {
        GATESYNC_FROM_URI,
        GATESYNC_FROM_DB,
        GATESYNC_TO_URI,
        GATESYNC_TO_DB,
        GATESYNC_USER_EMAIL,
        GATESYNC_USER_FIRST_NAME,
        GATESYNC_USER_LAST_NAME,
        GATESYNC_USER_REGION,
      } = process.env;

      /**
       * User Details To Create User
       * @var {boolean|object} user - Details For User To Insert
       */
      const user =
        GATESYNC_USER_EMAIL &&
        GATESYNC_USER_FIRST_NAME &&
        GATESYNC_USER_LAST_NAME &&
        GATESYNC_USER_REGION
          ? {
              email: GATESYNC_USER_EMAIL.toLowerCase(),
              first_name: GATESYNC_USER_FIRST_NAME,
              last_name: GATESYNC_USER_LAST_NAME,
              region: GATESYNC_USER_REGION,
            }
          : false;

      return {
        from_uri: GATESYNC_FROM_URI,
        from_db: GATESYNC_FROM_DB,
        to_uri: GATESYNC_TO_URI,
        to_db: GATESYNC_TO_DB,
        user,
      };
    } else {
      console.log("No valid .env found :-(");
      return this.survey();
    }
  }

  /**
   * Prompts questions for mongo configuration
   * @return {object} - returns survery configuration
   */
  survey() {
    console.log("Enter Mongo Connection Details:");
    const from_uri = prompt("Enter From MongoDB URI: ");
    const from_db = prompt("Enter From MongoDB Database Name: ");
    const to_uri = prompt("Enter To MongoDB URI: ");
    const to_db = prompt("Enter To MongoDB Database Name: ");

    // Configuration for setting up new user
    let user = prompt("Would you like to create a new user? [Y]/n");
    if (user === "n") {
      user = false;
    }
    // Configuration Prompts For New User
    else {
      const email = prompt("Enter Email For New GA Account: ").toLowerCase();
      const first_name = prompt("Enter First Name: ");
      const last_name = prompt("Enter Last Name: ");

      /**
       * Get Acceptable Region
       */
      let region;
      const acceptable = ["East", "West"];
      const acceptString = acceptable.join(", ");
      while (!region) {
        let res = prompt(
          `What Region Is Account Connected To? (${acceptString})`
        ).toLowerCase();
        res = `${res.charAt(0).toUpperCase()}-${res.slice(1)}`;
        if (acceptable.includes(res)) {
          region = res;
        }
      }

      user = {
        email,
        first_name,
        last_name,
        region,
      };
    }

    // Return Details
    return {
      from_uri,
      from_db,
      to_uri,
      to_db,
      user,
    };
  }
}

module.exports = Config;
