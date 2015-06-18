var OK = 200;
var NOK = 400;

/*
 * Get all documents related to a specific node (as owner or as tagged).
 */
exports.list = function(req, res) {

	var relation = req.query.relation;
	var nodeIndex = req.query.node;

	var query = null;

	if (relation == 'owner') {

		query = 'SELECT * FROM documents WHERE owner = ' + nodeIndex;

	} else if (relation == 'tagged') {

		query = 'SELECT * FROM tags JOIN documents ON tags.document = documents.id WHERE node = '
				+ nodeIndex;
	}

	console.log(query);

	req.getConnection(function(err, connection) {

		connection.query(query, function(err, rows) {

			if (err) {

				console.log("Error Selecting : %s ", err);

			} else {

				var documents = [];

				for ( var rowIndex in rows) {

					documents.push(rows[rowIndex]);
				}

				res.status(OK).json('documents', {
					documents : documents
				});
			}
		});
	});
};

/*
 * Get all documents which have at least one person tagged among all nodes in a
 * view.
 */
exports.view = function(req, res) {

	var nodeIndex = req.param('node');
	var viewNodes = req.body.nodes;

	console.log("viewNodes amount: " + viewNodes.length);

	var documents = [];
	var requests = 0;

	for (nodeIndex in viewNodes) {

		var node = viewNodes[nodeIndex];

		requests++;

		var query = 'SELECT * FROM tags WHERE node = ' + node.originalId;

		req.getConnection(function(err, connection) {

			connection.query(query, function(err, rows) {

				requests--;

				if (err) {

					console.log("Error Selecting : %s ", err);

				} else {

					for ( var rowIndex in rows) {

						var row = rows[rowIndex];
						documents.push(row);

						console.log("Document " + JSON.stringify(row)
								+ " added");
					}

					if (requests == 0) {

						res.status(OK).json('documents', {
							documents : documents
						});
					}
				}
			});
		});
	}
};

/*
 * Update the position of a document in a specific node details.
 */
exports.update = function(req, res) {

	var node = req.query.node;
	var index = req.query.index;
	var x = parseInt(req.query.x);
	var y = parseInt(req.query.y);
	var position = "POINT(" + x + ", " + y + ")";

	var updateDocumentQuery = 'UPDATE tags SET position = ' + position
			+ ' WHERE document = ' + index + ' AND node = ' + node;

	console.log(updateDocumentQuery);
	
	req.getConnection(function(err, connection) {

		connection.query(updateDocumentQuery, function(err, rows) {

			if (err) {

				console.log("Error Selecting : %s ", err);

			} else {

				if (rows.affectedRows > 0) {

					console.log("Document " + index + " updated");

					res.status(OK).json('result', {
						"msg" : "Document " + index + " updated"
					});

				} else {

					console.log("Document " + index + " not updated");

					res.status(NOK).json(
							'result',
							{
								"msg" : "Document " + index
										+ " or node tagged " + node
										+ " not found"
							});
				}
			}
		});
	});
};