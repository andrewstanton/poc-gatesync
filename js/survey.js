const prompt = require("prompt-sync")();

/**
 * Asks user db connection details
 *
 * @return {Object} connection details
 */
module.exports = () => {
  console.log("Connection Details To Pull Data From");
  const fromDb = prompt("Enter Connection String One:\n");

  console.log("Connection Details To Insert Data Into");
  const toDb = prompt("Enter Connection String One:\n");

  // Return Details
  return {
    fromDb,
    toDb,
  };
};
