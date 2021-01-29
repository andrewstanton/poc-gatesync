// Third Party Invites
require("dotenv").config();

// Local Imports
const Color = require("./js/colors");
const Config = require("./js/config");
const MongoDB = require("./js/mongo");
const LocalProcess = require("./js/localprocess");

/**
 * Main Function
 */
async function main() {
  // Welcome Message
  console.log("* * * * * Welcome To GateSync * * * * *\n");

  // Setup tmp directory
  const local = new LocalProcess();
  local.createTmpDir();

  // Get MongoDB Config Details
  const config = new Config();

  // Setup MongoClient
  try {
    // Connect to databases
    const db1 = new MongoDB(config.from_uri, config.from_db);
    const db2 = new MongoDB(config.to_uri, config.to_db);

    // Export All Data To JSON Files
    const arr = await db1.exportData();

    // Import JSON into mongo
    await db2.importData(arr);

    // Remove Tmp Directory
    local.removeTmpDir();

    // Completed Migration
    console.log("MIGRATION COMPLETE!");
    process.exit();
  } catch (err) {
    console.log("ERROR OCCURRED!");
    console.log({ err });
  }
}

// Run Program
main();
