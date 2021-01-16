// 3rd Party Imports
require("dotenv").config();

// Local Imports
const survey = require("./js/survey");
const MongoDB = require("./js/mongo");

// Main Function For Sync
async function main() {
  // Welcome Message
  console.log("* * * * * Welcome To GateSync * * * * *");

  // Get Connection Details...
  // const connection = survey();

  // Setup MongoClient
  try {
    const mongo = new MongoDB("mongodb://localhost:27017", "gateaccess");
    const arr = await mongo.getAllCollections();
    console.log({ arr });
  } catch (err) {
    console.log("ERROR OCCURRED!");
    console.log({ err });
  }
}

// Run Program
main();
