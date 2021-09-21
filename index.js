// @ts-nocheck
const { App } = require("@slack/bolt");
const _ = require("lodash");
const secrets = require("./__secrets__");
const _request = require("request");
const util = require("util");
const fs = require("fs");
const delay = (ms) => new Promise((res) => setTimeout(res, ms));
const request = util.promisify(_request);
const store = require("./store.json");

function storePair({ pair }) {
  const body = { pair: [pair[0], pair[1]] };
  return body;
}

async function getPairs() {
  return store;
}

function alreadyPaired({ history, pair }) {
  for (const paired of history) {
    if (
      _.isEqual(
        new Set(paired.map((pair) => pair.id)),
        new Set(pair.map((p) => p.id))
      )
    ) {
      return true;
    }
  }
  return false;
}

function createPairs({ members, history }) {
  const pairs = [];
  const paired = new Set();
  for (const member1 of members) {
    for (const member2 of members) {
      if (
        member1.id === member2.id ||
        paired.has(member1.id) ||
        paired.has(member2.id)
      )
        continue;
      const pair = [
        { id: member1.id, name: member1.profile.real_name },
        { id: member2.id, name: member2.profile.real_name },
      ];
      if (!alreadyPaired({ history, pair })) {
        pairs.push(pair);
        paired.add(pair[0].id);
        paired.add(pair[1].id);
      } else {
        console.log("Skipping", pair);
      }
    }
  }
  return pairs;
}

// @ts-ignore
async function handler(local = false) {
  const app = new App({
    token: secrets.SLACK_BOT_TOKEN,
    socketMode: true,
    appToken: secrets.SLACK_APP_TOKEN,
    signingSecret: secrets.SLACK_SIGNING_SECRET,
  });
  app.message("pair", async (args) => {
    const { say, client } = args;
    const users = await client.users.list();
    const filteredUsers = users.members.filter(
      // @ts-ignore
      (user) => !user.deleted && !user.is_bot && user.is_email_confirmed
    );
    const existingPairs = await getPairs();
    // const existingPairs = [];
    const pairs = createPairs({
      members: filteredUsers,
      history: existingPairs.map((obj) => obj.pair),
    });

    const res = [];
    for (const pair of pairs) {
      res.push(storePair({ pair }));
      //   await delay(1500);
      await say({
        text: "New pair created",
        blocks: [
          {
            type: "section",
            text: {
              text: `Pairing ${pair[0].name} and ${pair[1].name}`,
              type: "mrkdwn",
            },
          },
        ],
      });
      const { channel } = await client.conversations.open({
        users: pair.map((p) => p.id).join(","),
      });
      await client.chat.postMessage({
        channel: channel.id,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `Hi ${pair[0].name} and ${pair[1].name}! You have been paired for today's virtual coffee round, go ahead and schedule a time to chat!`,
            },
          },
        ],
      });
    }
    const filename = __dirname + "/store.json";
    fs.writeFileSync(filename, JSON.stringify(res));
  });
  return app;
}

(async () => {
  const app = await handler(true);
  await app.start(3100);
  console.log("Running on port 3100");
})();
