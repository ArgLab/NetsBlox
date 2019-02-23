'use strict';
var MongoClient = require('mongodb').MongoClient,
    RPCStore = require('../rpc/storage'),
    Users = require('./users'),
    Q = require('q'),
    Projects = require('./projects'),
    Groups = require('./groups'),
    UserActions = require('./user-actions'),
    Messages = require('./messages'),
    PublicProjects = require('./public-projects');

const ProjectActions = require('./project-actions');

var Storage = function(logger) {
    this._logger = logger.fork('storage');

    this.users = null;
    this.projects = null;
    this.connected = false;
};

Storage.getDatabaseFromURI = function(mongoURI) {
    return mongoURI.replace(/^(mongodb:\/\/)?[a-zA-Z0-9-_:\.]+\/?/, '') || 'admin';
};

Storage.prototype.connect = function(mongoURI) {
    mongoURI = mongoURI || process.env.MONGO_URI || process.env.MONGOLAB_URI || 'mongodb://localhost:27017/flecksDB';
    const dbName = 'flecksDB';
    return Q(MongoClient.connect(mongoURI))
        .then(client => {
            const db = client.db(dbName);
            this.connected = true;
            this.users = Users;
            this.projects = Projects;
            Users.init(this._logger, db);
            Projects.init(this._logger, db);
            Groups.init(this._logger, db);
            RPCStore.init(this._logger, db);
            UserActions.init(this._logger, db);
            PublicProjects.init(this._logger, db);
            Messages.init(this._logger, db);
            ProjectActions.init(this._logger, db);
            this.publicProjects = PublicProjects;

            this._db = db;
            this._client = client;
            this._logger.info(`Connected to ${mongoURI}`);
            return db;
        })
        .catch(err => {
            /* eslint-disable no-console */
            console.error(`Could not connect to mongodb at ${mongoURI}.`);
            console.error('To connect to a different mongo instance, set MONGO_URI to the mongo uri and try again:');
            console.error('');
            console.error('    MONGO_URI=mongodb://some.ip.address:27017/ netsblox start');
            console.error('');
            console.error('or, if running from the root of the netsblox project:');
            console.error('');
            console.error('    MONGO_URI=mongodb://some.ip.address:27017/ ./bin/netsblox start');
            console.error('');
            /* eslint-enable no-console */
            throw err;
        });
};

Storage.prototype.disconnect = function() {
    return this._client.close(true);
};

module.exports = Storage;
