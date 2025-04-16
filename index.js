require('dotenv').config();
const { Client, GatewayIntentBits, Events } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const PREFIX = '!';

// A few silly nicknames so each server gets a different "personality" for the bot.
const NICKNAMES = [
  'The Bone Counter',
  'Sir Rolls-a-Lot',
  'Fate Pending',
  'The Crit Whisperer',
  'Table Flipper'
];

// initiative[guildId] = [{ name, score }]
const initiative = {};

client.once(Events.ClientReady, (c) => {
  console.log(`Logged in as ${c.user.tag}`);
  client.guilds.cache.forEach((guild) => assignNickname(guild));
});

client.on(Events.GuildCreate, (guild) => assignNickname(guild));

async function assignNickname(guild) {
  try {
    const me = guild.members.me;
    if (!me) return;
    const nickname = NICKNAMES[Math.floor(Math.random() * NICKNAMES.length)];
    await me.setNickname(nickname);
  } catch (err) {
    console.log(`Could not set nickname in ${guild.name}: ${err.message}`);
  }
}

client.on(Events.MessageCreate, (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/\s+/);
  const command = args.shift().toLowerCase();

  if (command === 'roll') {
    handleRoll(message, args);
  } else if (command === 'init') {
    handleInitiative(message, args);
  } else if (command === 'help') {
    message.channel.send(helpText());
  }
});

function handleRoll(message, args) {
  const input = args[0];
  if (!input) {
    message.channel.send('Usage: `!roll 2d6` or `!roll d20`');
    return;
  }

  const match = input.match(/^(\d*)d(\d+)$/i);
  if (!match) {
    message.channel.send(`I do not know how to roll "${input}". Try something like \`2d6\`.`);
    return;
  }

  const count = match[1] ? parseInt(match[1], 10) : 1;
  const sides = parseInt(match[2], 10);

  if (count < 1 || count > 100 || sides < 2 || sides > 1000) {
    message.channel.send('Keep it reasonable, 1-100 dice, 2-1000 sides.');
    return;
  }

  const rolls = [];
  for (let i = 0; i < count; i++) {
    rolls.push(1 + Math.floor(Math.random() * sides));
  }

  const total = rolls.reduce((sum, value) => sum + value, 0);
  const breakdown = rolls.length > 1 ? ` (${rolls.join(' + ')})` : '';

  message.channel.send(`${message.author.username} rolls ${input}: **${total}**${breakdown}`);
}

function handleInitiative(message, args) {
  const guildId = message.guild ? message.guild.id : 'dm';
  if (!initiative[guildId]) {
    initiative[guildId] = [];
  }

  const sub = args.shift();

  if (sub === 'add') {
    const score = parseInt(args.pop(), 10);
    const name = args.join(' ');

    if (!name || isNaN(score)) {
      message.channel.send('Usage: `!init add <name> <score>`');
      return;
    }

    initiative[guildId].push({ name, score });
    initiative[guildId].sort((a, b) => b.score - a.score);
    message.channel.send(`Added **${name}** at initiative ${score}.`);
  } else if (sub === 'show') {
    if (initiative[guildId].length === 0) {
      message.channel.send('No one has rolled initiative yet. Try `!init add <name> <score>`.');
      return;
    }

    const lines = initiative[guildId].map((entry, i) => `${i + 1}. ${entry.name}: ${entry.score}`);
    message.channel.send(`**Initiative order**\n${lines.join('\n')}`);
  } else if (sub === 'clear') {
    initiative[guildId] = [];
    message.channel.send('Initiative order cleared.');
  } else {
    message.channel.send('Usage: `!init add <name> <score>`, `!init show`, or `!init clear`');
  }
}

function helpText() {
  return [
    '**Commands**',
    '`!roll 2d6`: roll dice',
    '`!init add <name> <score>`: add someone to initiative order',
    '`!init show`: show current initiative order',
    '`!init clear`: reset initiative order'
  ].join('\n');
}

client.login(process.env.DISCORD_TOKEN);
