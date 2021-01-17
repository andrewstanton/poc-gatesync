// 3rd Party Imports
require("dotenv").config();

// Local Imports
const survey = require("./js/survey");
const MongoDB = require("./js/mongo");
const LocalProcess = require("./js/localprocess");

// Main Function For Sync
async function main() {
  // Welcome Message
  console.log("* * * * * Welcome To GateSync * * * * *");

  // Get Connection Details...
  // const connection = survey();

  // Setup tmp directory
  const local = new LocalProcess();
  local.createTmpDir();

  // Setup MongoClient
  try {
    // Connect to db1
    const db1 = new MongoDB("mongodb://localhost:27017", "gateaccess");

    // Get Collections as array
    const arr = await db1.getAllCollections();

    // Export Collection To JSON files
    await db1.exportCollectionsToJson(arr);

    // Connect To db2
    const db2 = new MongoDB("mongodb://localhost:27017", "gateaccess2");

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
