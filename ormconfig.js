// const { dataSourceOptions } = require('./src/core/database/data-source');
const { dataSourceOptions } = require('./dist/core/database/data-source');

module.exports = {
    ...dataSourceOptions,
    entities: ['dist/**/*.entity.js'],
    migrations: ['dist/core/database/migrations/*.js'],
    seeds: ['dist/**/*{seed.ts,seed.js}'],
    factories: ['dist/**/*{factory.ts,factory.js}'],
};
