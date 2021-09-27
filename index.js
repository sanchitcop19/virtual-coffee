/* eslint-disable indent */
/* eslint-disable no-await-in-loop */
/* eslint-disable function-paren-newline */
/* eslint-disable comma-dangle */
/* eslint-disable implicit-arrow-linebreak */
/* eslint-disable no-shadow */
/* eslint-disable no-continue */
/* eslint-disable operator-linebreak */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-use-before-define */
/* eslint-disable quotes */
const { App } = require("@slack/bolt");
const _ = require("lodash");
const fs = require("fs");
const secrets = require("./__secrets__");
const store = require("./store.json");

async function handler() {
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
            (user) => !user.deleted && !user.is_bot && user.is_email_confirmed
        );

        const { pairs, existingPairs } = generatePairs({
            users: filteredUsers,
        });

        const pairInstances = await initiateConversation({
            pairs,
            client,
            say,
        });

        const filename = `${__dirname}/store.json`;
        fs.writeFileSync(
            filename,
            JSON.stringify([...pairInstances, ...existingPairs])
        );
    });
    return app;
}

async function initiateConversation({ pairs, client, say }) {
    const res = [];
    for (const pair of pairs) {
        res.push(getPairInstance({ pair }));

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
    return res;
}

function generatePairs({ users }) {
    const existingPairs = getMatchedPairs();
    return {
        pairs: createPairs({
            members: users,
            history: existingPairs.map((obj) => obj.pair),
        }),
        existingPairs,
    };
}

function createPairs({ members, history }) {
    const pairs = [];
    const paired = new Set();

    for (const member1 of members) {
        for (const member2 of members) {
            // skip if we are looking at the same user or
            // if the user been paired with somebody else in this round
            if (
                member1.id === member2.id ||
                paired.has(member1.id) ||
                paired.has(member2.id)
            ) {
                continue;
            }

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

function alreadyPaired({ history, pair }) {
    return history.some((historyPair) =>
        _.isEqual(
            new Set(historyPair.map((pair) => pair.id)),
            new Set(pair.map((p) => p.id))
        )
    );
}

function getPairInstance({ pair }) {
    return { pair: [pair[0], pair[1]] };
}

function getMatchedPairs() {
    return store;
}

(async () => {
    const app = await handler(true);
    await app.start(3100);
    console.log("Running on port 3100");
})();
