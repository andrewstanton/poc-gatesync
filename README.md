# GateSync Command

NodeJS program to quickly sync mongo databases for various environments
Either use .env or follow command prompts given in shell

## Todo

- [ ] Checking if env is setup in local directory else follow next shell prompts
- [ ] Shell asking for db1 conection details (example: atlas connection)
- [ ] Test connection for db1
- [ ] Shell asking for db2 connection details (example: local db)
- [ ] Test connection for db2
- [ ] Loop thru connections for db1 and download to json in tmp directory
- [ ] Close db1 connection
- [x] Loop thru json files in tmp directory and insert into db2
- [x] Cleanup files by deleting tmp directory

Note: Would be nice to have some color messages along with a loading bar based on the number of tables that are getting inserted into db

Note: Need a way to prevent accidentally swapping connections and inserting downloaded data into live connection
