(function(GroupStore) {
    var logger, collection;
    const Data = require('./data'),
        Q = require('q'),
        ObjectId = require('mongodb').ObjectId;

    class Group extends Data {

        constructor(data) {
            super(collection, data);
            this._logger = logger.fork(data.name);
        }

        // returns the group owner
        getOwner() {
            return this.owner;
        }

        save() {
            return this._db.updateOne(this._query(), { $set: {name: this.name, owner: this.owner} })
                .then(() => this);
        }

        // TODO lookup the members from the users collections
        findMember() {
        }

        data() {
            return {
                name: this.name,
                _id: this._id
            };
        }

        save() {
            return this._db.save({
                name: this.name,
                owner: this.owner,
            })
            .then(result => {
                const id = result.ops[0]._id;
                this._id = id;
            })
            .then(() => this);
        }

        // generates a query that finds this entity in the db
        _query() {
            return {_id: this._id};
        }

        getId() {
            console.log('######### id is ', this._id);
            return this._id;
        }
    }

    GroupStore.init = function(_logger, db) {
        logger = _logger.fork('groups');
        collection = db.collection('groups');
    };

    // in: groupName and owner's username
    GroupStore.new = async function(name, owner) {
        logger.trace(`creating new group: ${owner}/${name}`);
        let curGroup = await this.findOne(name, owner);
        if (curGroup) throw new Error(`group ${owner}/${name} exists`);
        let group = new Group({
            name: name,
            owner: owner,
        });
        return group.save();
    };

    GroupStore.findOne = function(name, owner) {
        logger.trace(`getting ${owner}/${name}`);
        return collection.findOne({name, owner})
            .then(data => {
                if (data) {
                    return new Group(data);
                }
                return null;
            });
    };

    GroupStore.get = function(id) {
        logger.trace(`getting ${id}`);
        if (typeof id === 'string') id = ObjectId(id)
        return collection.findOne({_id: id})
            .then((data, error) => {
                if (data) {
                    return new Group(data);
                }
                logger.error(data, error);
                throw new Error(`group ${id} not found`);
            })

    };

    GroupStore.remove = function(id) {
        logger.info(`removing ${id}`);
        return collection.deleteOne({_id: id});
    };

    GroupStore.all = async function(owner) {
        let groupsArr = await collection.find({owner}).toArray();
        return groupsArr.map(group => new Group(group));
    };

})(exports);
