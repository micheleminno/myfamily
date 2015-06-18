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

function getCurrentImage(node, req, callback) {

	var selectNode = 'SELECT * FROM nodes WHERE id = ' + node;

	req.getConnection(function(err, connection) {

		connection.query(selectNode, function(err, rows) {

			if (err) {

				console.log("Error Selecting : %s ", err);

			} else {

				if (rows.length > 0) {

					var node = rows[0];

					callback(node.img);
				}
			}
		});
	});
}
app.post('/profileImage/:node', function(req, res) {

	console.log("uploading profile image...");

	var node = req.param('node');

	if (done == true) {

		console.log(req.files);

		getCurrentImage(node, req, function(previousImage) {

			graph.updateNodeInDB(node, 'img',
					req.files.userProfileImage.originalname, req, function(
							updated) {

						if (updated) {

							if (previousImage && previousImage != "") {

								fs.unlinkSync(__dirname + "/docs/"
										+ previousImage);

								console.log("Previous image " + previousImage
										+ " removed");
							}

							res.end("Profile image uploaded.");
						}
					});
		});
	}
});

// Documents
app.get('/documents', document.list);

app.post('/documents/:node', document.view);

app.get('/documents/update', document.update);

// Graph

app.get('/:user/graph/view', graph.view);

app.get('/:user/graph/add', graph.addNode);

app.get('/:user/graph/remove/:node', graph.removeNode);

app.get('/:user/graph/update/:node', graph.updateNode);

app.get('/:user/graph/persons', graph.persons);

// Views
app.get('/:user/view/:view/update', view.updateNode);
