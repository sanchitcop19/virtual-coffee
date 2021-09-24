# virtual-coffee

This repository contains a minimal slackbot that attempts to replicate some of donut's functionality (for free). The purpose is to schedule 1:1 conversations between people in the same workspace. It can currently only be run locally and doesn't do match except create conversations with unique pairs.

## Instructions

You'll need to create a \_\_secrets\_\_.js file. This file contains the variables SLACK_SIGNING_SECRET, SLACK_BOT_TOKEN and SLACK_APP_TOKEN. These variables are available in your Slack API console, refer to Slack's documentation for information on where to find them.

From the base of the repo, execute:

`node index.js`

This starts a server on port 3100. The server currently listens for a message containing the text "pair", which triggers the pairing of individuals. This message can be sent in any channel the bot is a part of.

The handler stores pairings in a remote DB so that the same people are not matched again.

## Coming next

- Deployment to slack app store
- GCal integration
- Zoom integration
