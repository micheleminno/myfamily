var express = require("express");
var connection = require('express-myconnection');
var mysql = require('mysql');
var multer = require("multer");
var cors = require("cors");
var bodyParser = require('body-parser');

var document = require('./document.js');
var graph = require('./graph.js');
var view = require('./view.js');
var event = require('./event.js');

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

	dest : './docs/',
	rename : function(fieldname, filename) {
		return filename;
	},

	onFileUploadStart : function(file) {
		console.log(file.originalname + ' upload is starting...');
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

	res.sendfile('index.html');
});

// Documents
app.get('/documents', document.list);

app.post('/documents/:node', document.view);

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

//Events
app.get('/events/add/:entityType/:entityId', event.add);
