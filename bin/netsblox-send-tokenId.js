
// // #!/usr/bin/env node
// /* eslint-disable no-console*/

require('epipebomb')();  // Allow piping to 'head'
const Storage = require('../src/server/storage/storage'),
    Logger = require('../src/server/logger'),
    Users = require('../src/server/storage/users'),
    logger = new Logger('netsblox:cli:add-user'),
    storage = new Storage(logger),
    Command = require('commander').Command,
    program = new Command();

program.arguments('<userName> <tokenID>');
program.parse(process.argv);

// List all the groups
const username = program.args[0];
const tokenID = program.args[1];


// function callThis(Text){
//     var fs = require('fs');
//     fs.writeFile('/Users/mehmetcelepkolu/Desktop/a3.txt', (new Date())+"\r\n", function (err) {
//     fs.appendFile('/Users/mehmetcelepkolu/Desktop/a3.txt', username+"\r\n");
//     fs.appendFile('/Users/mehmetcelepkolu/Desktop/a3.txt', tokenID+"\r\n");
//     fs.appendFile('/Users/mehmetcelepkolu/Desktop/a3.txt', Text+"\r\n");

//     });
// }
// // callThis("some Test")

storage.connect()
    .then(() => Users.get(username))
    .then(user => {
        return user.recordTokenID(tokenID);
    })
    .then(() => callThis("Test file"))
    .then(() => storage.disconnect())
    .catch(err => {
        console.error(err);
        return storage.disconnect();
    });
// /* eslint-enable no-console*/

