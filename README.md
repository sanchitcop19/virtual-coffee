# virtual-coffee

This repository contains a minimal slackbot that attempts to replicate some of donut's functionality (for free). The purpose is to schedule 1:1 conversations between people in the same workspace. It can currently only be run locally and doesn't do match except create conversations with unique pairs. 

## Instructions

From the base of the repo, execute:

`node index.js`

This starts a server on port 3100. The server currently listens for a message containing the text "pair", which triggers the pairing of individuals. This message can be sent in any channel the bot is a part of.  

The handler stores pairings in a local JSON object so that the same people are not matched again. I store the store.json in this repo since I'm too lazy to hook up an actual database, make sure to replace that object or hook up a DB before running the server.

