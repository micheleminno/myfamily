var express = require("express");
var connection = require('express-myconnection');
var mysql = require('mysql');
var multer = require("multer");
var cors = require("cors");
var bodyParser = require('body-parser');

var user = require('./node_code/user.js');
var document = require('./node_code/document.js');
var graph = require('./node_code/graph.js');
var view = require('./node_code/view.js');
var event = require('./node_code/event.js');
var notification = require('./node_code/notification.js');
var blacklist = require('./node_code/blacklist.js');
var bookmark = require('./node_code/bookmark.js');

var app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended : true
}));

var connectionConfig = {

	host : "localhost",
	user : "root",
	password : "password",
	database : "myfamily"
};

var connection = connection(mysql, connectionConfig, 'single');

app.use(connection);

var multerConfig = {

	dest : __dirname + '/docs/',
	rename : function(fieldname, filename) {
		return filename;
	},

	onFileUploadStart : function(file) {
		console.log(file.originalname + ' uploading to ' + file.path);
	},

	onFileUploadComplete : function(file) {
		console.log(file.fieldname + ' uploaded to ' + file.path);
	}
};

app.use(multer(multerConfig));

/* Start the Server */

app.listen(8091, function() {
	console.log("It's Started on PORT 8091");
});

app.get('/', function(req, res) {

	res.sendfile('server_index.html');
});

// User
app.get('/user/getRegistered', user.getRegistered);
app.get('/user/register', user.register);
app.get('/user/update', user.update);

// Documents
app.get('/documents', document.list);
app.post('/heritage/documents', document.heritageList);
app.post('/:user/documents', document.view);
app.get('/documents/:document', document.get);
app.get('/documents/:document/updatePosition', document.updatePosition);
app.get('/documents/:document/update', document.update);
app.get('/documents/:document/remove', document.remove);
app.get('/documents/add/document', document.add);
app.post('/documents/upload', document.upload);

// Graph
app.get('/:user/graph/view', graph.view);
app.get('/:user/graph/add', graph.addNode);
app.get('/:user/graph/remove/:node', graph.removeNode);
app.get('/:user/graph/update/:node', graph.updateNode);
app.post('/:user/graph/profileImage/:node', graph.updateProfileImage);
app.get('/graph/namesakes', graph.namesakes);
app.get('/graph/addPerson', graph.addPerson);

// Views
app.get('/:user/view/:view/update', view.updateNode);

// Events
app.get('/:user/events/add/:entityType/:entityId', event.add);
app.get('/:user/events/remove/:entityType/:entityId', event.remove);
app.post('/events', event.list);

// Notifications
app.post('/:user/notifications/add', notification.add);
app.get('/:user/notifications/remove', notification.remove);
app.get('/notifications/remove/:entityType/:entityId',
		notification.removeForEntity);
app.get('/:user/notifications/:status', notification.list);
app.get('/:user/notifications/:event/setStatus', notification.setStatus);

// Blacklists
app.get('/:user/blacklists/add/:blockedUser/:document', blacklist.add);
app.post('/:user/blacklists/add/:document', blacklist.addMany);
app.post('/:user/blacklists/update/:document', blacklist.update);
app.get('/:user/blacklists/remove/:blockedUser/:document', blacklist.remove);
app.get('/:user/blacklists/nodes', blacklist.listNodes);
app.get('/:user/blacklists/:document', blacklist.listUsersForDocument);
app.get('/:user/blacklistingUsers', blacklist.listBlacklistingUsers);
app.get('/:user/forbiddenDocuments', blacklist.listForbiddenDocuments);

// Bookmarks
app.get('/:user/bookmarks', bookmark.list);
app.get('/:user/bookmarks/add/:document', bookmark.add);
app.get('/:user/bookmarks/remove/:document', bookmark.remove);
