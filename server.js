// eslint-disable-next-line no-unused-vars
require('dotenv').config();

// Sentry error logging/tracking.
// Different config depending on whether this is a cron instance of the BE API.
const cronService = require('./cron');

cronService();
