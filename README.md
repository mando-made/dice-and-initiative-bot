# dice-and-initiative-bot

This started as a one-liner. My tabletop group runs on Discord and I got
tired of people rolling dice in some other app and reporting the number, so
I wrote a bot that does `!roll 2d6` in the channel. Then I kept adding to it
until it also tracked initiative order and gave itself a different name in
every server it joined.

## What it does

- `!roll 2d6` or `!roll d20`, rolls and shows the breakdown
- `!init add <name> <score>`, adds someone to the initiative order
- `!init show`, prints the current order, highest first
- `!init clear`, resets it for the next encounter
- `!help`, lists all of the above

## How I built it

The dice parser is the heart of the `!roll` command. I match the standard
`NdM` notation with a small regex, default the count to 1 if it is left off
(so `!roll d20` works), and then clamp the numbers so nobody can ask it to
roll a million thousand-sided dice and hang the bot:

```js
const match = input.match(/^(\d*)d(\d+)$/i);
const count = match[1] ? parseInt(match[1], 10) : 1;
const sides = parseInt(match[2], 10);
```

Initiative tracking just keeps an array per server, sorted by score
whenever someone is added, so `!init show` is always in the right order
without re-sorting on read.

The per-server nickname was the bit I added purely for fun. When the bot
joins a server it picks a random title from a short list ("The Bone
Counter", "Sir Rolls-a-Lot", and so on), so it never feels like the exact
same bot twice.

## Setup

```
npm install
cp .env.example .env
```

I put a bot token from the Discord developer portal into `.env`, then:

```
npm start
```

## Notes

Built on discord.js v14. I looked at discord.js's own guide for the basic
command-handling pattern, then added the initiative tracking and the
nickname quirk on top. Note that the message commands need the Message
Content intent switched on for the bot in the Discord developer portal.
