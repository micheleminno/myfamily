exports.getPosition = function(user, view, node, req, callback) {

	var selectPosition = 'SELECT * FROM views WHERE user = ' + user
			+ ' AND view = ' + view + ' AND node = ' + node;

	console.log(selectPosition);

	req.getConnection(function(err, connection) {

		connection.query(selectPosition, function(err, rows) {

			if (err) {

				console.log("Error Selecting : %s ", err);

			} else {

				if (rows.length > 0) {

					var x = rows[0]['x'];
					var y= rows[0]['y'];
					
					callback([x, y]);
					
				} else {

					callback(-1);
				}
			}
		});
	});
};

exports.updateNode = function(req, res) {

	var viewIndex = null;
	if (req.param('view')) {
		viewIndex = parseInt(req.param('view'));
	}

	var nodeIndex = null;
	if (req.query.node) {
		viewIndex = parseInt(req.query.node);
	}

	var x = null;
	if (req.query.x) {
		x = parseInt(req.query.x);
	}

	var y = null;
	if (req.query.y) {
		y = parseInt(req.query.y);
	}

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
};