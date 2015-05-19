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

app.get('/documents/tagged/:nodeIndex', function(req, res) {

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

app.get('/documents/:nodeIndex', function(req, res) {

	var nodeIndex = req.param('nodeIndex');
	var viewIndex = req.query.view;

	var documents = JSON.parse(fs.readFileSync('documents.json', 'utf8'));
	var profile = JSON.parse(fs.readFileSync('node_' + nodeIndex + '.json',
			'utf8'));
	
	var view = profile.views[viewIndex];
	var viewNodeIds = [];
	
	for (nodeIndex in view.nodes) {

		var node = view.nodes[nodeIndex];
		viewNodeIds.push(node.index);
	}
	
	var nodeDocuments = [];

	documents["data"].forEach(function(d) {

		var found = false;
		for (taggedIndex in d.tagged) {

			var taggedNode = d.tagged[taggedIndex];
			if (viewNodeIds.indexOf(taggedNode["node"]) > -1) {
				
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
	var nodeIndexesMap = {};

	for (nodeIndex in view.nodes) {

		var node = view.nodes[nodeIndex];

		for (graphNodeIndex in graph.nodes) {

			var graphNode = graph.nodes[graphNodeIndex];

			if (graphNode.index == node.index) {

				node.originalIndex = graphNodeIndex;
				break;
			}
		}

		node.index = parseInt(nodeIndex);
		nodeIndexesMap[node.originalIndex] = nodeIndex;

		node.label = graph.nodes[node.originalIndex].label;
		node.person = graph.nodes[node.originalIndex].person;
		node.img = graph.nodes[node.originalIndex].img;
		node.fixed = true;

		graphView.nodes.push(node);
	}

	for (linkIndex in graph.links) {

		var link = graph.links[linkIndex];
		var sourceIndex = link.source;
		var targetIndex = link.target;

		var sourceIncluded = false;
		for (nodeIndex in graphView.nodes) {

			var node = view.nodes[nodeIndex];
			if (node.originalIndex == sourceIndex) {

				sourceIncluded = true;
				break;
			}
		}

		var targetIncluded = false;
		for (nodeIndex in graphView.nodes) {

			var node = view.nodes[nodeIndex];
			if (node.originalIndex == targetIndex) {

				targetIncluded = true;
				break;
			}
		}

		if (sourceIncluded && targetIncluded) {

			link.source = parseInt(nodeIndexesMap[link.source]);
			link.target = parseInt(nodeIndexesMap[link.target]);

			graphView.links.push(link);
		}
	}

	res.end(JSON.stringify(graphView));
});

app.get('/addNode', function(req, res) {

	var type = req.query.type;
	var sourceIndex = parseInt(req.query.source);
	var targetIndex = parseInt(req.query.target);

	var graphFile = 'graph.json';
	var graph = JSON.parse(fs.readFileSync(graphFile, 'utf8'));

	var nextNodeIndex = graph.nodes.length;
	var isPerson = type == "person" ? true : false;
	var label = "";

	if (isPerson) {

		if (sourceIndex) {

			label = "New child";
		} else if (targetIndex) {

			label = "New parent";
		}
	} else {

		label = "New family node";
	}

	graph.nodes.push({
		index : nextNodeIndex,
		label : label,
		img : "",
		person : isPerson
	});

	if (sourceIndex) {

		graph.links.push({
			source : sourceIndex,
			target : nextNodeIndex
		});
	} else if (targetIndex) {

		graph.links.push({
			source : nextNodeIndex,
			target : targetIndex
		});
	}

	fs.writeFile(graphFile, JSON.stringify(graph, null, "\t"), 'utf8');

	// TODO
	// add to the right views (family, pedigree, extended) too - of all
	// users.
	// A view of user U must be updated with new node N if N must be in
	// that
	// view of U.
	// Es.: N is a brother of U and the view is family.
	// Now added always to the extended family view

	var graphViewFile = 'node_3.json';
	var graphView = JSON.parse(fs.readFileSync(graphViewFile, 'utf8'));

	var nextNodeIndex = graphView.views[2].nodes.length;

	var linkedNodeIndex = sourceIndex ? sourceIndex : targetIndex;
	var x = graphView.views[2].nodes[linkedNodeIndex]["x"];
	var y = graphView.views[2].nodes[linkedNodeIndex]["y"];

	var randomOffset = Math.random() * 100 - 50;

	var newNodeX = x + randomOffset;

	var newNodeY = sourceIndex ? y - randomOffset : y + randomOffset;

	graphView.views[2].nodes.push({
		index : nextNodeIndex,
		x : newNodeX,
		y : newNodeY
	});

	fs.writeFile(graphViewFile, JSON.stringify(graphView, null, "\t"), 'utf8');

	res.end(graphFile + " and " + graphViewFile + " updated");
});

app
		.get(
				'/removeNode/:nodeIndex',
				function(req, res) {

					var nodeIndex = parseInt(req.param('nodeIndex'));

					var graphFile = 'graph.json';
					var graph = JSON.parse(fs.readFileSync(graphFile, 'utf8'));
					var nodeIndexesToDecrement = [];

					var found = false;

					var clonedNodes = graph.nodes.slice();

					for (currentNodeIndex in clonedNodes) {

						var currentNode = clonedNodes[currentNodeIndex];

						if (found) {

							nodeIndexesToDecrement.push(currentNode.index);
							graph.nodes[currentNodeIndex - 1]["index"]--;

						} else if (currentNode.index == nodeIndex) {

							graph.nodes.splice(currentNodeIndex, 1);
							found = true;
						}
					}

					console.log(nodeIndexesToDecrement);

					var clonedLinks = graph.links.slice();

					var decrement = 0;

					for (currentLinkIndex in clonedLinks) {

						var currentLink = clonedLinks[currentLinkIndex];

						if (currentLink.source == nodeIndex
								|| currentLink.target == nodeIndex) {

							graph.links.splice(currentLinkIndex - decrement, 1);
							decrement++;

						} else {

							if (nodeIndexesToDecrement
									.indexOf(currentLink.source) > -1) {

								graph.links[currentLinkIndex - decrement]["source"]--;
							}
							if (nodeIndexesToDecrement
									.indexOf(currentLink.target) > -1) {

								graph.links[currentLinkIndex - decrement]["target"]--;
							}
						}
					}

					fs.writeFile(graphFile, JSON.stringify(graph, null, "\t"),
							'utf8');

					// Now removed always from the extended family view

					var graphViewFile = 'node_3.json';
					var graphView = JSON.parse(fs.readFileSync(graphViewFile,
							'utf8'));

					var found = false;

					var clonedViewNodes = graphView.views[2].nodes.slice();

					for (currentViewNodeIndex in clonedViewNodes) {

						var currentNode = clonedViewNodes[currentViewNodeIndex];

						if (found) {

							graphView.views[2].nodes[currentViewNodeIndex - 1]["index"]--;
						} else if (currentNode.index == nodeIndex) {

							graphView.views[2].nodes.splice(
									currentViewNodeIndex, 1);
							found = true;
						}
					}

					fs.writeFile(graphViewFile, JSON.stringify(graphView, null,
							"\t"), 'utf8');

					res.end(graphFile + " and " + graphViewFile + " updated");
				});

app.get('/updateNode/:nodeIndex', function(req, res) {

	var nodeIndex = parseInt(req.param('nodeIndex'));
	var label = req.query.label;

	var file = 'graph.json';

	var graph = JSON.parse(fs.readFileSync(file, 'utf8'));

	var found = false;
	for (nodesIndex in graph.nodes) {

		var currentNode = graph.nodes[nodesIndex];
		if (currentNode.index == nodeIndex) {

			found = true;
			currentNode.label = label;

			break;
		}
	}

	if (!found) {

		res.end("Node not found");

	} else {

		fs.writeFile(file, JSON.stringify(graph, null, "\t"), 'utf8');

		res.end(file + " updated");
	}
});

app.get('/:viewIndex/updateNode', function(req, res) {

	var viewIndex = parseInt(req.param('viewIndex'));
	var nodeIndex = parseInt(req.query.nodeIndex);
	var x = parseInt(req.query.x);
	var y = parseInt(req.query.y);

	var file = 'node_3.json';

	var graph = JSON.parse(fs.readFileSync(file, 'utf8'));

	var graphView = graph.views[viewIndex];
	var nodes = graphView.nodes;

	var found = false;
	for (nodesIndex in nodes) {

		var currentNode = nodes[nodesIndex];
		if (currentNode.index == nodeIndex) {

			found = true;
			currentNode.x = x;
			currentNode.y = y;

			break;
		}
	}

	if (!found) {

		res.end("Node not found");

	} else {

		fs.writeFile(file, JSON.stringify(graph, null, "\t"), 'utf8');

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
