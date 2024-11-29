# 🤖 briannah bot

this repository contains the code for the powerful **briannah bot**.

## 📋 features

This allows any AI Agent and farcaster user to interact with the Brian APIs to generate transactions.

it's extremely scalable due to the usage of **Redis** queues if enabled, allowing the bot to handle multiple requests at the same time without any issues whatsoever.

## 📦 installation

to install the bot, you need to follow these steps:

1. clone the repository

```bash
git clone https://github.com/builders-garden/brianker-bot.git
cd brianker-bot
```

2. install the dependencies using your package manager of choice

```bash
bun install # using bun
npm install # using npm
yarn install # using yarn
pnpm install # using pnpm
```

1. copy the `.env.example` file to `.env` and fill in the required fields. check the **configuration** section below for more information

```bash
cp .env.example .env
```

4. build and start the bot

```bash
bun run build && bun run start # using bun
npm run build && npm run start # using npm
yarn build && yarn start # using yarn
pnpm build && pnpm start # using pnpm
```

the bot should be running in the port of your choice (or `3000` if default).

in production enviroments it's better to use a process manager like **PM2** to keep the bot running in the background.

```bash
npm install -g pm2
bun build && bun start --name brianker # using bun
npm run build && pm2 start dist/index.js --name brianker # using npm
yarn build && pm2 start dist/index.js --name brianker # using yarn
pnpm build && pm2 start dist/index.js --name brianker # using pnpm
```

## ⚙️ configuration

the only configuration needed for this bot is the `.env` file. 

if you want to enable the **Redis** queues, you need to add the following environment variables:

```bash
REDIS_HOST="" # redis host
REDIS_PORT="" # redis port
```

this will allow the bot to connect to your Redis instance and start using the queues. if the queues are not enabled, the bot will work as a normal **Express** server and send the messages istantly. **this is not recommended for production environments**.

## 📡 webhooks

### `POST /webhooks/farcaster`

this endpoint is used to receive the mentions from warpcast and twitter and to generate a tx from the cast.

```

## 📝 license

this project is licensed under the **MIT License**. check the [LICENSE.md](/LICENSE.md) file for more information.
