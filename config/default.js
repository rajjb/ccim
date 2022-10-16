const config = {
  app: {
    port: 5000,
    secret: process.env.SESSION_SECRET || 'test'
  },
  db: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_DATABASE,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    dialect: 'postgres',
    pool: {
      max: process.env.POOL_MAX || 40,
      min: process.env.POOL_MIN || 10,
      acquire: process.env.POOL_ACQUIRE || 30000,
      idle: process.env.POOL_IDLE || 10000,
    },
    logging: false
  },
  REDIS_CACHE_TTL: process.env.REDIS_CACHE_TTL || 600,
  web3Provider: process.env.WEB3_PROVIDER || null,
  redis: {
    host: 'localhost',
    port: 6379
  }
};

module.exports = config;
