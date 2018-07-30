// endpoints for managing groups
'use strict';

const Logger = require('../logger'),
    logger = new Logger('netsblox:api:Groups'),
    // Storage = require('../src/server/storage/storage'),
    // storage = new Storage(logger),
    Users = require('../storage/users'),
    Groups = require('../storage/groups');

// assuming group names are unique (id)
// TODO check if user has access to the group
// TODO group-user association as admin or teacher

module.exports = [
    {
        URL: 'groups',
        Method: 'GET',
        middleware: ['isLoggedIn'],
        Handler: async function(req) {
            // gets a list of groups
            let owner = req.session.username;
            let groups = await Groups.all(owner);
            return groups.map(grp => grp.data());
        }
    },
    {
        // get group details, only the owner can
        // CHECK maybe the users want to see this too
        URL: 'groups/:id',
        Method: 'GET',
        middleware: ['isLoggedIn', 'isGroupOwner'],
        Handler: async function(req) {
            // a specific group's details: (which only include members)
            const groupId = req.params.id;
            let group = await Groups.get(groupId);
            return group.data();
        }
    },
    {
        // get group members
        URL: 'groups/:id/members',
        Method: 'GET',
        middleware: ['isLoggedIn', 'isGroupOwner'],
        Handler: async function(req) {
            // a specific group's details: (which only include members)
            const groupId = req.params.id,
                owner = req.session.username;
            // TODO search the users for matching group id and return
            let users = await Users.find({groupId: {$eq: groupId}});
            return users;
        }
    },
    {
        URL: 'groups',
        Method: 'POST',
        middleware: ['isLoggedIn'],
        Handler: async function(req) {
            // create a new group
            let groupName = req.body.name;
            if (!groupName) throw new Error('group name is required');
            let owner = req.session.username;
            logger.info('creating group', groupName, 'with owner', owner);
            let group = await Groups.new(groupName, owner);
            return group.data();
        }
    },
    {
        // add new members
        URL: 'groups/:id/members',
        Method: 'POST',
        middleware: ['isLoggedIn', 'isGroupOwner'],
        Handler: function(req) {
            let username = req.body.username,
                password = req.body.password,
                email = req.body.email,
                groupId = req.params.id,
                user;
            return Users.get(username)
                .then(_user => {
                    user = _user;
                    if (user) {
                        throw new Error('user already exists');
                    }
                    user = Users.newWithPassword(
                        username,
                        email,
                        groupId,
                        password,
                    );
                    return user.save();
                });
        }
    },
    {
        URL: 'groups/:id',
        Method: 'DELETE',
        middleware: ['isLoggedIn', 'isGroupOwner'],
        Handler: function(req) {
            // delete a group
            let groupName = req.params.name;
            logger.info('removing group', groupName);
            return Groups.remove(groupName);
        }
    },
].map(route => { // handle the actual sending of the results
    let handler = route.Handler;
    route.Handler = (req, res) => {
        handler(req, res)
            .then(val => {
                if (typeof val === 'object') {
                    res.status(200).json(val);
                } else {
                    res.status(200).send(val);
                }
            })
            .catch(e => {
                logger.error(e);
                // WARN could potentially leak information
                res.status(500).send(e.message);
            });
    };
    return route;
});