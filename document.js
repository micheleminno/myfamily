var OK = 200;

/*
 * Get all documents related to a specific node (as owner or as tagged).
 */
exports.list = function(req, res) {

	var relation = req.query.relation;
	var nodeIndex = req.query.node;

	if (relation == 'owner') {

		var query = 'SELECT * FROM documents WHERE owner = ' + nodeIndex;

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
	} else if (relation == 'tagged') {

		// TODO
	}
};

exports.view = function(req, res) {

	// TODO
};

exports.update = function(req, res) {

	// TODO
};