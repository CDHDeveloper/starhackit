'use strict';
let _ = require('lodash');
let fs = require('fs');
let path = require('path');
let Sequelize = require('sequelize');

export default function Data(config) {
  let log = require('logfilename')(__filename);
  let dbConfig = config.db;
  let sequelizeOption = {
    underscored: true,
    pool: {
      idle: 60000,
      max: 100
    }
  };
  let sequelize = new Sequelize(dbConfig.url, {...sequelizeOption, ...dbConfig.options});
  let modelsMap = {};

  let data = {
    sequelize,
    Sequelize,
    registerModelsFromDir(baseDir, name) {
        log.debug(`registerModelFromDir: ${baseDir} in ${name}`);
        let dirname = path.join(baseDir, name);
        fs.readdirSync(dirname)
          .filter(function (file) {
            return (file.indexOf('.') !== 0) && (file.slice(-3) === '.js');
          })
          .forEach(function (file) {
            log.debug("model file: ", file);
            data.registerModel(dirname, file);
          });
      },

      registerModel(dirname, modelFile) {
        log.debug("registerModel ", modelFile);
        let model = sequelize['import'](path.join(dirname, modelFile));
        modelsMap[model.name] = model;
      },

      associate() {
        log.debug("associate");
        Object.keys(modelsMap).forEach(function (modelName) {
          if (modelsMap[modelName].associate) {
            modelsMap[modelName].associate(modelsMap);
          }
        });
      },
      models() {
        return sequelize.models;
      },
      async start(app) {
        log.info("db start");
        let option = {
          force: false
        };
        await sequelize.sync(option);
        await this.seedIfEmpty(app);
        log.info("db started");
      },

      async stop() {
        log.info("db stop");
      },

      async seed(app) {
        log.info("seed");
        let option = {
          force: true
        };
        await sequelize.sync(option);
        await this.seedDefault(app);
        log.info("seeded");
      },

      async seedDefault(app) {
        log.debug("seedDefault");
        const plugins = app.plugins.get();
        for (let name in plugins) {
          log.debug("seedDefault plugin ", name);
          const {seedDefault} = plugins[name]
          if (_.isFunction(seedDefault)) {
            await seedDefault();
          }
        }
      },
      async seedIfEmpty(app) {
        log.info("seedIfEmpty");
        let count = await sequelize.models.User.count();
        if (count > 0) {
          log.info("seedIfEmpty #users: ", count);
        } else {
          return this.seedDefault(app);
        }
      }
  };
  return data;
};
