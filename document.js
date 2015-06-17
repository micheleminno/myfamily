var OK = 200;

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

		query = 'SELECT * FROM tags WHERE node = ' + nodeIndex;
	}

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

exports.view = function(req, res) {

	var nodeIndex = req.param('node');
	var viewNodes = req.body.nodes;

	console.log(JSON.stringify(viewNodes));

	var documents = [];
	var requests = 0;

	for (nodeIndex in viewNodes) {

		requests++;
		var query = 'SELECT * FROM tags WHERE node = ' + nodeIndex;
		req.getConnection(function(err, connection) {

			connection.query(query, function(err, rows) {

				requests--;

				if (err) {

					console.log("Error Selecting : %s ", err);

				} else {

					for ( var rowIndex in rows) {

						documents.push(rows[rowIndex]);
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

exports.update = function(req, res) {

	// TODO
};