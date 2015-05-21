var express = require("express");
var mysql = require('mysql');
var multer = require("multer");
var cors = require("cors");
var fs = require('fs');

var app = express();
app.use(cors());

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

app.listen(8090, function() {
	console.log("It's Started on PORT 8090");
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

app.get('/documents/:nodeIndex', document.view);

app.get('/documents/updateDocument', document.update);

// Graph
app.get('/graph/:nodeIndex', graph.view);

app.get('graph/addNode', graph.addNode);

app.get('graph/removeNode/:nodeIndex', graph.removeNode);

app.get('graph/updateNode/:nodeIndex', graph.updateNode);

// Views
app.get('view/:viewIndex/updateNode', view.updateNode);
