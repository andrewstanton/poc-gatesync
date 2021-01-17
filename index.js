// 3rd Party Imports
require("dotenv").config();

// Local Imports
const Config = require("./js/config");
const MongoDB = require("./js/mongo");
const LocalProcess = require("./js/localprocess");

/**
 *
 * Main Function
 *
 */
async function main() {
  // Welcome Message
  console.log("* * * * * Welcome To GateSync * * * * *");

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

    // Test Connections
    db1.isConnected();
    db2.isConnected();

    // Get Collections as array
    const arr = await db1.getAllCollections();

    // Export Collection To JSON files
    await db1.exportCollectionsToJson(arr);

    // Import JSON into db2
    await db2.importJsonToCollections(arr);

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
