var express = require("express");
var cors = require("cors");
var fs = require('fs');

var app = express();
app.use(cors());

/* Start the Server */

app.listen(8090, function() {
	console.log("It's Started on PORT 8090");
});

app.get('/', function(req, res) {

	res.sendfile('myfamily/index.html');
});

app.get('/documents', function(req, res) {

	var documents = JSON.parse(fs.readFileSync('documents.json', 'utf8'));
	res.end(JSON.stringify(documents));
});

app.get('/documents/:nodeIndex', function(req, res) {

	var nodeIndex = req.param('nodeIndex');

	var documents = JSON.parse(fs.readFileSync('documents.json', 'utf8'));
	var nodeDocuments = [];

	documents["data"].forEach(function(d) {

		var found = false;
		for (taggedIndex in d.tagged) {

			var taggedNode = d.tagged[taggedIndex];
			if (taggedNode["node"] == parseInt(nodeIndex)) {
				found = true;
				break;
			}
		}

		if (found) {
			nodeDocuments.push(d);
		}
	});

	res.end(JSON.stringify(nodeDocuments));
});

app.get('/graph', function(req, res) {

	var graph = JSON.parse(fs.readFileSync('graph.json', 'utf8'));
	res.end(JSON.stringify(graph));
});

app.get('/graph/:nodeIndex', function(req, res) {

	var nodeIndex = req.param('nodeIndex');
	var viewIndex = req.query.view;

	var graph = JSON.parse(fs.readFileSync('graph.json', 'utf8'));
	var profile = JSON.parse(fs.readFileSync('node_' + nodeIndex + '.json',
			'utf8'));

	var graphView = {
		nodes : [],
		links : []
	};

	var view = profile.views[viewIndex];

	for (nodeIndex in view.nodes) {

		var node = views.nodes[nodeIndex];
		graphView.nodes.push(node);
	}

	res.end(JSON.stringify(graphView));
});

app.get('/updateNode', function(req, res) {

	var label = req.query.label;
	var x = parseInt(req.query.x);
	var y = parseInt(req.query.y);

	var file = 'graph.json';

	var graph = JSON.parse(fs.readFileSync(file, 'utf8'));

	var links = graph.links;
	var nodes = graph.nodes;

	var found = false;
	for (nodeIndex in nodes) {

		var currentNode = nodes[nodeIndex];
		if (currentNode.label == label) {

			found = true;
			currentNode.x = x;
			currentNode.y = y;

			break;
		}
	}

	if (!found) {

		res.end("Node not found");

	} else {

		fs.writeFile(file, JSON.stringify({
			nodes : nodes,
			links : links
		}, null, "\t"), 'utf8');

		res.end(file + " updated");
	}
});

app.get('/updateDoc', function(req, res) {

	var node = req.query.node;
	var index = req.query.index;
	var x = parseInt(req.query.x);
	var y = parseInt(req.query.y);

	var file = 'documents.json';

	var parsedFile = JSON.parse(fs.readFileSync(file, 'utf8'));

	var docs = parsedFile.data;

	var found = false;
	var nodeFound = false;

	for (docIndex in docs) {

		var currentDoc = docs[docIndex];
		if (currentDoc.index == index) {

			found = true;

			for (taggedIndex in currentDoc.tagged) {

				var taggedNode = currentDoc.tagged[taggedIndex];
				if (taggedNode["node"] == parseInt(node)) {

					nodeFound = true;
					taggedNode["position"] = {
						"x" : x,
						"y" : y
					};
					break;
				}
			}
		}
	}

	if (!found || !nodeFound) {

		res.end("Document not updated");

	} else {

		fs.writeFile(file, JSON.stringify({
			data : docs
		}, null, "\t"), 'utf8');

		res.end(file + " updated");
	}
});
