var OK = 200;
var NOK = 400;

exports.getPosition = function(user, view, node, req, callback) {

	var selectPosition = 'SELECT * FROM views WHERE user = ' + user
			+ ' AND view = ' + view + ' AND node = ' + node;

	req.getConnection(function(err, connection) {

		connection.query(selectPosition, function(err, rows) {

			if (err) {

				console.log("Error Selecting : %s ", err);

			} else {

				if (rows.length > 0) {

					var x = rows[0]['x'];
					var y = rows[0]['y'];

					var position = [ x, y ];

					console.log("Position of node " + node + ": " + position);
					callback([ node, position ]);

				} else {

					callback([ node, -1 ]);
				}
			}
		});
	});
};

exports.updateNode = function(req, res) {

	var viewIndex = parseInt(req.param('view'));
	var user = parseInt(req.param('user'));
	var nodeIndex = parseInt(req.query.node);
	var x = parseInt(req.query.x);
	var y = parseInt(req.query.y);

	var updateNodeQuery = "INSERT INTO views VALUES(" + user + ", " + viewIndex
			+ ", " + nodeIndex + ", " + x + ", " + y
			+ ") ON DUPLICATE KEY UPDATE x = " + x + ", y = " + y;

	console.log(updateNodeQuery);

	req.getConnection(function(err, connection) {

		connection.query(updateNodeQuery, function(err, rows) {

			if (err) {

				console.log("Error Inserting : %s ", err);

			} else {

				if (rows.affectedRows > 0) {

					console.log("Node with id " + nodeIndex + " updated");

					res.status(OK).json('result', {
						"msg" : "node updated"
					});

				} else {

					console.log("Node with id " + nodeIndex + " updated");

					res.status(OK).json('result', {
						"msg" : "node updated"
					});
				}
			}
		});
	});
};