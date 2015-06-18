var express = require("express");
var connection = require('express-myconnection');
var mysql = require('mysql');
var multer = require("multer");
var cors = require("cors");
var fs = require('fs');
var bodyParser = require('body-parser');

var document = require('./document.js');
var graph = require('./graph.js');
var view = require('./view.js');

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
	database : "my-family"
};

var connection = connection(mysql, connectionConfig, 'request');

app.use(connection);

var done = false;

app.use(multer({

	dest : './docs/',

	rename : function(fieldname, filename) {

		return filename;
	},

	onFileUploadStart : function(file) {

		console.log(file.originalname + ' is starting ...');
	},

	onFileUploadComplete : function(file) {

		console.log(file.fieldname + ' uploaded to ' + file.path);
		done = true;
	}
}));

/* Start the Server */

app.listen(8091, function() {
	console.log("It's Started on PORT 8091");
});

app.get('/', function(req, res) {

	res.sendfile('myfamily/index.html');
});

app.post('/profileImage/:nodeIndex', function(req, res) {

	console.log("uploading profile image...");

	var nodeIndex = req.param('nodeIndex');

	if (done == true) {

		console.log(req.files);
		var graphFile = 'graph.json';

		var graph = JSON.parse(fs.readFileSync(graphFile, 'utf8'));

		var nodes = graph.nodes;
		for (currentNodeIndex in nodes) {

			var node = nodes[currentNodeIndex];
			if (node.index == nodeIndex) {

				if (node.img && node.img != "") {

					// Remove the current profile image
					fs.unlinkSync(__dirname + "/docs/" + node.img);
				}

				node.img = req.files.userProfileImage.originalname;
			}
		}

		fs.writeFile(graphFile, JSON.stringify(graph, null, "\t"), 'utf8');

		res.end("Profile image uploaded.");
	}
});

// Documents
app.get('/documents', document.list);

app.post('/documents/:node', document.view);

app.get('/documents/update', document.update);

// Graph

app.get('/:user/graph/view/:node', graph.view);

app.get('/:user/graph/add', graph.addNode);

app.get('/:user/graph/remove/:node', graph.removeNode);

app.get('/:user/graph/update/:node', graph.updateNode);

app.get('/:user/graph/persons', graph.persons);

// Views
app.get('/:user/view/:view/update', view.updateNode);
