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

app.get('/graph', function(req, res) {

	var graph = JSON.parse(fs.readFileSync('graph.json', 'utf8'));
	res.end(JSON.stringify(graph));
});

app.get('/updateNode', function(req, res) {

	var label = req.query.label;
	var x = parseInt(req.query.x);
	var y = parseInt(req.query.y);

	var graph = JSON.parse(fs.readFileSync('graph.json', 'utf8'));

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

		nodes.push({
			label : label,
			x : x,
			y : y
		});
	}

	fs.writeFile('graph.json', JSON.stringify({
		nodes : nodes,
		links : links
	}, null, "\t"), 'utf8');
	
	res.end("graph updated");
});
