# GateSync Command

NodeJS program to quickly sync mongo databases for various environments
Either use .env or follow command prompts given in shell

# How Program Works

1. Run program with:

```
npm run start
```

2. If an `.env` file was setup following example provided in `.env.example` you will bypass the prompts on the screen

3. The program will connect to the _FROM_ mongodb which will export all collections to chunked JSON files

4. Then the program will connec to the _TO_ mongodb and import the chunked data

5. The `tmp` folder for storing JSON files will be deleted
