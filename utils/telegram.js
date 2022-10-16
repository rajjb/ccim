const TelegramBot = require('node-telegram-bot-api');
const token = '1957616589:AAFhM4yatYCMvUeZEF6hTA4srMvFs_vgIrc';
const models = require('../models');
const logger = require('./logger');
const _defaultChatId = "-522750849";

module.exports.sendMessage = async (message, chatId) => {
  if (!chatId) {
    chatId = _defaultChatId;
  }

  try {
    const bot = new TelegramBot(token);
    await bot.sendMessage(chatId, message);
  } catch (err) {
    logger.error(`${JSON.stringify(err, Object.getOwnPropertyNames(err))}`, 'Send Telegram Message');
    await models.messages.create({
      message,
      type: telegram
    });
  }

};
