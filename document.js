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

		// Heritage
		if (nodeIndex == -1) {

			query = 'SELECT * FROM tags RIGHT JOIN documents ON tags.document = documents.id WHERE node IS NULL';

		} else {

			query = 'SELECT * FROM tags JOIN documents ON tags.document = documents.id WHERE node = '
					+ nodeIndex;
		}

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
	var documentIds = [];

	var requests = 0;

	for (nodeIndex in viewNodes) {

		var node = viewNodes[nodeIndex];

		requests++;

		var query = 'SELECT d.id, t.node, d.title, d.date, d.file FROM tags as t JOIN documents as d '
				+ 'ON t.document = d.id WHERE t.node = ' + node.originalId;

		req
				.getConnection(function(err, connection) {

					connection
							.query(
									query,
									function(err, rows) {

										requests--;

										if (err) {

											console.log(
													"Error Selecting : %s ",
													err);

										} else {

											for ( var rowIndex in rows) {

												var row = rows[rowIndex];
												var documentId = row.id;

												if (documentIds
														.indexOf(documentId) == -1) {

													documentIds
															.push(documentId);
													row.node = [ row.node ];
													documents.push(row);
													console
															.log("Document added: "
																	+ JSON
																			.stringify(row));
												} else {

													for (documentIndex in documents) {

														var document = documents[documentIndex];
														if (document.id == documentId) {

															document.node
																	.push(row.node);

															console
																	.log("Tag added to an already added document: "
																			+ JSON
																					.stringify(document));
															break;
														}
													}

												}
											}

											if (requests == 0) {

												res
														.status(OK)
														.json(
																'documents',
																{
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

function insertTag(document, node, req, callback) {

	var insertQuery = "INSERT INTO tags VALUES(" + document + ", " + node
			+ ", NULL)";

	console.log(insertQuery);

	req.getConnection(function(err, connection) {

		connection.query(insertQuery, function(err, rows) {

			if (err) {

				console.log("Error Inserting : %s ", err);

			} else {

				if (rows.affectedRows > 0) {

					console.log("New tag inserted");
					callback(1);

				} else {

					console.log("New tag not inserted");
					callback(-1);
				}
			}
		});
	});
};

function insertDocument(title, date, file, owner, tagged, req, callback) {

	req.getConnection(function(err, connection) {

		connection.query("SELECT MAX(id) as maxId from documents", function(
				err, rows) {

			if (err) {

				console.log("Error Selecting : %s ", err);

			} else {

				if (rows.length > 0) {

					var maxId = parseInt(rows[0]['maxId']) + 1;

					var insertQuery = "INSERT INTO documents VALUES(" + maxId
							+ ", '" + title + "', '" + date + "', '" + file
							+ "', " + owner + ")";

					console.log(insertQuery);

					req.getConnection(function(err, connection) {

						connection.query(insertQuery, function(err, rows) {

							if (err) {

								console.log("Error Inserting : %s ", err);

							} else {

								if (rows.affectedRows > 0) {

									console.log("New document with id " + maxId
											+ " inserted");

									var requests = 0;
									if(tagged.indexOf(owner) == -1) {
										
										tagged.push(owner);
									}
									
									for (taggedIndex in tagged) {

										requests++;
										var taggedNode = tagged[taggedIndex];

										insertTag(maxId, taggedNode, req, function(
												tagInserted) {

											//TODO check tag inserted
											
											requests--;

											if (requests == 0) {

												callback(1);
											}
										});
									}
								} else {

									console.log("New document with id " + maxId
											+ " not inserted");
									callback(-1);
								}
							}
						});
					});

				} else {

					callback(-1);
				}
			}
		});
	});
};

/*
 * Add a new document.
 */
exports.add = function(req, res) {

	var file = req.query.file;
	var title = req.query.title;
	var owner = req.query.owner;
	
	var date = null;
	if (req.query.date) {

		date = req.query.date;
	}

	var tagged = null;
	if (req.query.tagged) {

		tagged = JSON.parse(req.query.tagged);
	}

	insertDocument(title, date, file, owner, tagged, req, function(inserted) {

		if (inserted == -1) {

			res.status(NOK).json('result', {
				"msg" : "document not added"
			});
		} else {

			res.status(OK).json('result', {
				"msg" : "document updated"
			});

		}
	});
};