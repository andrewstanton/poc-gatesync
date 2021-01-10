// 3rd Party Imports
require("dotenv").config();

// Local Imports
const color = require("./js/colors");
const survey = require("./js/survey");
const mongo = require("./js/mongo");

// Main Function For Sync
function main() {
  // Welcome Message
  console.log(
    color.bg.White,
    color.fg.Black,
    "* * * * * Welcome To GateSync * * * * *",
    color.Reset,
  );
  console.log("\n");

  // Get Connection Details...
  const connection = survey();

  console.log({ connection });
}

// Run Program
main();
