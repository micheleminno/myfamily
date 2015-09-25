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

		query = "SELECT d.id, d.title, t1.position, d.date, d.file, d.owner, "
				+ "GROUP_CONCAT(t2.node SEPARATOR ', ') as taggedNodeIds, "
				+ "GROUP_CONCAT(n.label SEPARATOR '\", \"') as taggedNodeLabels, "
				+ "GROUP_CONCAT(k.id SEPARATOR ', ') as keywordIds, "
				+ "GROUP_CONCAT(k.value SEPARATOR '\", \"') as keywordValues "
				+ "FROM tags as t1 JOIN documents as d ON t1.document = d.id "
				+ "JOIN tags as t2 ON t2.document = d.id JOIN nodes as n ON t2.node = n.id "
				+ "LEFT JOIN keywords as k ON k.document = d.id "
				+ "WHERE t1.node = " + nodeIndex + " GROUP BY d.id";
	}

	console.log(query);

	req.getConnection(function(err, connection) {

		connection.query(query, function(err, rows) {

			if (err) {

				console.log("Error Selecting : %s ", err);

			} else {

				var documents = [];

				for ( var rowIndex in rows) {

					var row = rows[rowIndex];

					setObjects(row, 'taggedNodeIds', 'taggedNodeLabels',
							'taggedNodes');

					setObjects(row, 'keywordIds', 'keywordValues', 'keywords');

					documents.push(row);
				}

				res.status(OK).json('documents', {
					documents : documents
				});
			}
		});
	});
};

function setObjects(row, idsField, labelsField, aggregateField) {

	if (row[idsField] && row[labelsField]) {

		var idsString = "[" + row[idsField] + "]";

		var labelsString = "[\"" + row[labelsField] + "\"]";

		var ids = JSON.parse(idsString);
		var labels = JSON.parse(labelsString);

		// remove duplicates

		ids = ids.filter(function(elem, pos) {
			return ids.indexOf(elem) == pos;
		});

		labels = labels.filter(function(elem, pos) {
			return labels.indexOf(elem) == pos;
		});

		row[aggregateField] = [];
		for (idIndex in ids) {

			row[aggregateField].push({
				id : ids[idIndex],
				label : labels[idIndex]
			});
		}

		delete row[idsField];
		delete row[labelsField];
	}
}

/*
 * Get all documents in the heritage container which are owned by one of the
 * given nodes.
 */
exports.heritageList = function(req, res) {

	var viewNodes = req.body.nodes;

	var nodesIds = viewNodes.map(function(n) {
		return n.originalId;
	});

	var query = "SELECT d.id, d.title, t1.position, d.date, d.file, d.owner, "
			+ "GROUP_CONCAT(t2.node SEPARATOR ', ') as taggedNodeIds, "
			+ "GROUP_CONCAT(n.label SEPARATOR '\", \"') as taggedNodeLabels, "
			+ "GROUP_CONCAT(k.id SEPARATOR ', ') as keywordIds, "
			+ "GROUP_CONCAT(k.value SEPARATOR '\", \"') as keywordValues "
			+ "FROM tags as t1 JOIN documents as d ON t1.document = d.id "
			+ "JOIN tags as t2 ON t2.document = d.id JOIN nodes as n ON t2.node = n.id "
			+ "LEFT JOIN keywords as k ON k.document = d.id "
			+ "WHERE t1.node = -1 AND d.owner IN (" + nodesIds.join()
			+ ") GROUP BY d.id";

	console.log(query);

	req.getConnection(function(err, connection) {

		connection.query(query, function(err, rows) {

			if (err) {

				console.log("Error Selecting : %s ", err);

			} else {

				var documents = [];

				for ( var rowIndex in rows) {

					var row = rows[rowIndex];

					setObjects(row, 'taggedNodeIds', 'taggedNodeLabels',
							'taggedNodes');

					setObjects(row, 'keywordIds', 'keywordValues', 'keywords');

					documents.push(row);
				}

				console.log("Heritage docs: " + JSON.stringify(documents));

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

	var userId = req.param("user");
	var offset = req.query.offset;
	var size = req.query.size;
	var keywords = req.query.keywords;
	var sortField = req.query.sort;
	var filter = req.query.filter;
	var excludedNodeIds = req.query.excludedNodeIds;

	var subsetResults = "";

	if (offset != null && size != null) {

		subsetResults = "LIMIT " + size + " OFFSET " + offset;
	}

	var keywordsFilter = "";

	if (keywords != null) {

		keywordsFilter = " AND d.title LIKE CONCAT('%', '" + keywords
				+ "', '%')";
	}

	var sortBy = "";

	if (sortField != null) {

		if (sortField == "date") {

			sortBy = "ORDER BY d.date ";
		}
	}

	var filterPart = "";
	var filterPartSelect = "";

	if (filter != null) {

		filterPartSelect = "b.document as bookmarked, ";
		filterPart = "JOIN bookmarks as b ON b.user = " + userId
				+ " AND b.document = d.id ";

		if (filter == "All") {

			filterPart = "LEFT " + filterPart;
		}
	}

	var excludedNodeIdsPart = "";

	if (excludedNodeIds != null) {

		excludedNodeIdsPart = " AND t1.node NOT IN (" + excludedNodeIds + ")";
	}

	var viewNodes = req.body.nodes;

	var nodesIds = viewNodes.map(function(n) {
		return n.originalId;
	});

	nodeIdsString = '(' + nodesIds.join() + ')';

	var query = "SELECT SQL_CALC_FOUND_ROWS d.id, d.title, t.position, d.date, d.file, d.owner, "
			+ filterPartSelect
			+ "GROUP_CONCAT(t.node SEPARATOR ', ') as taggedNodeIds, "
			+ "GROUP_CONCAT(n.label SEPARATOR '\", \"') as taggedNodeLabels, "
			+ "GROUP_CONCAT(k.id SEPARATOR ', ') as keywordIds, "
			+ "GROUP_CONCAT(k.value SEPARATOR '\", \"') as keywordValues "
			+ "FROM tags as t JOIN documents as d ON t.document = d.id "
			+ "JOIN nodes as n ON t.node = n.id "
			+ "LEFT JOIN keywords as k ON k.document = d.id "
			+ filterPart
			+ "WHERE t.node IN "
			+ nodeIdsString
			+ keywordsFilter
			+ excludedNodeIdsPart + " GROUP BY d.id " + sortBy + subsetResults;

	console.log(query);

	req.getConnection(function(err, connection) {

		connection.query(query, function(err, rows) {

			if (err) {

				console.log("Error Selecting : %s ", err);

			} else {

				connection.query("SELECT FOUND_ROWS() as total", function(err,
						info) {

					var total = info[0]['total'];
					var documents = [];

					for ( var rowIndex in rows) {

						var row = rows[rowIndex];

						setObjects(row, 'taggedNodeIds', 'taggedNodeLabels',
								'taggedNodes');

						setObjects(row, 'keywordIds', 'keywordValues',
								'keywords');

						documents.push(row);
					}

					// documents.sort(function(a, b) { return a.id - b.id; });

					console.log("Sorted: " + JSON.stringify(documents));

					res.status(OK).json('documents', {
						documents : documents,
						total : total
					});
				});

			}
		});
	});
};

function deleteDocKeywords(req, docIndex, callback) {

	var deleteKeywordsQuery = "DELETE FROM keywords WHERE document = "
			+ docIndex;

	console.log(deleteKeywordsQuery);

	req.getConnection(function(err, connection) {

		connection.query(deleteKeywordsQuery, function(err, rows) {

			if (err) {

				console.log("Error Deleting : %s ", err);

			} else {

				if (rows.affectedRows > 0) {

					console
							.log("Keywords of document " + docIndex
									+ " deleted");

					callback(1);
				}
			}
		});
	});
}

function deleteDocTags(req, docIndex, callback) {

	var deleteTagsQuery = "DELETE FROM tags WHERE document = " + docIndex;
	console.log(deleteTagsQuery);

	req.getConnection(function(err, connection) {

		connection.query(deleteTagsQuery, function(err, rows) {

			if (err) {

				console.log("Error Deleting : %s ", err);

			} else {

				if (rows.affectedRows > 0) {

					console.log("Tags of document " + docIndex + " deleted");
				}

				callback(1);
			}

		});
	});
}

function deleteDocument(docIndex, req, callback) {

	var deleteDocQuery = "DELETE FROM documents WHERE id = " + docIndex;
	console.log(deleteDocQuery);

	req.getConnection(function(err, connection) {

		connection.query(deleteDocQuery, function(err, rows) {

			if (err) {

				console.log("Error Deleting : %s ", err);

			} else {

				if (rows.affectedRows > 0) {

					console.log("Document " + docIndex + " deleted");

					deleteDocTags(req, docIndex, function(res) {

						if (res == 1) {

							deleteDocKeywords(req, docIndex, function() {

								callback(1);
							});
						} else {
							callback(0);
						}
					});

				} else {

					console.log("Document " + docIndex + " not deleted");
					callback(0);
				}
			}
		});
	});
};

/*
 * Remove a document.
 */
exports.remove = function(req, res) {

	var docIndex = parseInt(req.param('document'));

	deleteDocument(docIndex, req, function(deleted) {

		if (deleted) {

			res.status(OK).json('result', {
				"msg" : "Document removed"
			});
		} else {

			res.status(NOK).json('result', {
				"msg" : "Document not removed"
			});
		}

	});
};

/*
 * Update the position of a document in a specific node details.
 */
exports.updatePosition = function(req, res) {

	var node = req.query.node;
	var index = parseInt(req.param('document'));
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

function insertNewTags(taggedIds, rows, docIndex, req, callback) {

	var newTags = [];

	for (tagsIndex in taggedIds) {

		var found = false;
		for (rowIndex in rows) {

			var row = rows[rowIndex];

			if (taggedIds[tagsIndex] == row['node']) {

				found = true;
				break;
			}
		}

		if (!found) {

			newTags.push(taggedIds[tagsIndex]);
		}
	}

	console.log("New tags: " + JSON.stringify(newTags));

	if (newTags.length > 0) {

		var multipleInsertQuery = "INSERT IGNORE INTO tags VALUES ";

		var separator = '';
		for (tagsIndex in newTags) {

			multipleInsertQuery += separator + '(' + docIndex + ', '
					+ newTags[tagsIndex] + ', NULL)';
			separator = ', ';
		}

		console.log(multipleInsertQuery);

		req.getConnection(function(err, connection) {

			connection.query(multipleInsertQuery, function(err, rows) {

				if (err) {

					console.log("Error Inserting : %s ", err);
					callback(-1);

				} else {

					if (rows.affectedRows > 0) {

						callback(1);
					}
				}
			});
		});
	} else {

		callback(1);
	}
};

function insertNewKeywords(keywords, rows, docIndex, req, callback) {

	var newKeywords = [];

	for (keywordIndex in keywords) {

		var found = false;
		for (rowIndex in rows) {

			var row = rows[rowIndex];

			if (keywords[keywordIndex]['label'] == row['value']) {

				found = true;
				break;
			}
		}

		if (!found) {

			newKeywords.push(keywords[keywordIndex]['label']);
		}
	}

	console.log("New keywords: " + JSON.stringify(newKeywords));

	if (newKeywords.length > 0) {

		var multipleInsertQuery = "INSERT IGNORE INTO keywords VALUES ";

		var separator = '';
		for (keywordsIndex in newKeywords) {

			multipleInsertQuery += separator + "(NULL, '"
					+ newKeywords[keywordsIndex] + "', " + docIndex + ")";
			separator = ', ';
		}

		console.log(multipleInsertQuery);

		req.getConnection(function(err, connection) {

			connection.query(multipleInsertQuery, function(err, rows) {

				if (err) {

					console.log("Error Inserting : %s ", err);
					callback(-1);

				} else {

					if (rows.affectedRows > 0) {

						callback(1);
					}
				}
			});
		});
	} else {

		callback(1);
	}
};

function removeOldTags(taggedIds, rows, docIndex, req, callback) {

	var oldTags = [];

	for (rowIndex in rows) {

		var row = rows[rowIndex];

		var found = false;
		for (tagsIndex in taggedIds) {

			if (taggedIds[tagsIndex] == row['node']) {

				found = true;
				break;
			}
		}

		if (!found && row['node'] != -1) {

			oldTags.push(row['node']);
		}
	}

	console.log("Old tags: " + JSON.stringify(oldTags));

	if (oldTags.length > 0) {

		var multipleDeleteQuery = "DELETE FROM tags WHERE (document, node) IN (";

		var separator = '';
		for (tagsIndex in oldTags) {

			multipleDeleteQuery += separator + '(' + docIndex + ', '
					+ oldTags[tagsIndex] + ')';
			separator = ', ';
		}

		multipleDeleteQuery += ')';

		console.log(multipleDeleteQuery);

		req.getConnection(function(err, connection) {

			connection.query(multipleDeleteQuery, function(err, rows) {

				if (err) {

					console.log("Error deleting : %s ", err);
					callback(-1);

				} else {

					if (rows.affectedRows > 0) {

						callback(1);
					}
				}
			});
		});
	} else {

		callback(1);
	}
};

function removeOldKeywords(keywords, rows, docIndex, req, callback) {

	var oldKeywords = [];

	for (rowIndex in rows) {

		var row = rows[rowIndex];

		var found = false;
		for (keywordIndex in keywords) {

			if (keywords[keywordIndex]['label'] == row['value']) {

				found = true;
				break;
			}
		}

		if (!found && row['value'] != -1) {

			oldKeywords.push(row['value']);
		}
	}

	console.log("Old keywords: " + JSON.stringify(oldKeywords));

	if (oldKeywords.length > 0) {

		var multipleDeleteQuery = "DELETE FROM keywords WHERE (document, value) IN (";

		var separator = '';
		for (keywordIndex in oldKeywords) {

			multipleDeleteQuery += separator + "(" + docIndex + ", '"
					+ oldKeywords[keywordIndex] + "')";
			separator = ', ';
		}

		multipleDeleteQuery += ')';

		console.log(multipleDeleteQuery);

		req.getConnection(function(err, connection) {

			connection.query(multipleDeleteQuery, function(err, rows) {

				if (err) {

					console.log("Error deleting : %s ", err);
					callback(-1);

				} else {

					if (rows.affectedRows > 0) {

						callback(1);
					}
				}
			});
		});
	} else {

		callback(1);
	}
};

function updateKeywords(req, docIndex, callback) {

	var getKeywordsQuery = 'SELECT * from keywords WHERE document = '
			+ docIndex;

	console.log(getKeywordsQuery);

	req.getConnection(function(err, connection) {

		connection.query(getKeywordsQuery,
				function(err, rows) {

					if (err) {

						console.log("Error Selecting : %s ", err);

					} else {

						var keywords = req.query.keywords;

						console.log("Keywords after edit: "
								+ JSON.stringify(keywords));

						var keywords = JSON.parse(req.query.keywords);

						insertNewKeywords(keywords, rows, docIndex, req,
								function(res) {

									if (res == -1) {

										callback(-1);

									} else {

										removeOldKeywords(keywords, rows,
												docIndex, req, function(res) {

													callback(res);

												});
									}
								});
					}
				});
	});
}

function updateTaggedAndKeywords(docIndex, req, callback) {

	var getTagsQuery = 'SELECT * from tags WHERE document = ' + docIndex;

	console.log(getTagsQuery);

	req.getConnection(function(err, connection) {

		connection.query(getTagsQuery, function(err, rows) {

			if (err) {

				console.log("Error Selecting : %s ", err);

			} else {

				console.log("Tags after edit: " + JSON.stringify(taggedIds));

				var taggedIds = JSON.parse(req.query.tagged);

				insertNewTags(taggedIds, rows, docIndex, req, function(res) {

					if (res == -1) {

						callback(-1);

					} else {

						removeOldTags(taggedIds, rows, docIndex, req, function(
								res) {

							if (res == -1) {

								callback(-1);

							} else if (req.query.keywords) {
								updateKeywords(req, docIndex, function(res) {

									callback(res);
								});
							} else {

								callback(1);
							}
						});
					}
				});
			}
		});
	});
};

/*
 * Update info of a document.
 */
exports.update = function(req, res) {

	var index = parseInt(req.param('document'));

	var separator = '';
	var titleQuerySegment = '';
	if (req.query.title) {

		titleQuerySegment = "title = '" + req.query.title + "'";
		separator = ', ';
	}

	var dateQuerySegment = '';
	if (req.query.date) {

		dateQuerySegment = "date = STR_TO_DATE('" + req.query.date
				+ "', '%d/%m/%Y')";

	} else {

		separator = '';
	}

	if (titleQuerySegment != '' || dateQuerySegment != '') {

		var updateDocumentQuery = 'UPDATE documents SET ' + titleQuerySegment
				+ separator + dateQuerySegment + ' WHERE id = ' + index;

		console.log(updateDocumentQuery);

		req.getConnection(function(err, connection) {

			connection.query(updateDocumentQuery, function(err, rows) {

				if (err) {

					console.log("Error Selecting : %s ", err);

				} else {

					if (rows.affectedRows > 0) {

						console.log("Title and date of document updated");

						if (req.query.tagged || req.query.keywords) {

							updateTaggedAndKeywords(index, req, function(
									inserted) {

								if (inserted == 1) {

									console.log("Document " + index
											+ " updated");

									res.status(OK).json(
											'result',
											{
												"msg" : "Document " + index
														+ " updated"
											});
								} else {

									console.log("Document " + index
											+ " not updated");

									res.status(NOK).json(
											'result',
											{
												"msg" : "Document " + index
														+ " not updated"
											});
								}
							});

						} else {

							console.log("Document " + index + " updated");

							res.status(OK).json('result', {
								"msg" : "Document " + index + " updated"
							});
						}

					} else {

						console.log("Document " + index + " not updated");

						res.status(NOK).json('result', {
							"msg" : "Document " + index + " not updated"
						});
					}
				}
			});
		});
	} else {

		if (req.query.tagged || req.query.keywords) {

			updateTaggedAndKeywords(index, req, function(inserted) {

				if (inserted == 1) {

					console.log("Document " + index + " updated");

					res.status(OK).json('result', {
						"msg" : "Document " + index + " updated"
					});
				} else {

					console.log("Document " + index + " not updated");

					res.status(NOK).json('result', {
						"msg" : "Document " + index + " not updated"
					});
				}
			});
		}
	}

};

/*
 * Get a document with all its tagged persons.
 */
exports.get = function(req, res) {

	var index = parseInt(req.param('document'));

	var getDocumentQuery = 'SELECT t.document, d.title, d.date, d.file, d.owner, t.node, n.id, n.label FROM tags as t JOIN documents as d '
			+ 'ON t.document = d.id LEFT JOIN nodes as n ON t.node = n.id WHERE d.id = '
			+ index;

	console.log(getDocumentQuery);

	req.getConnection(function(err, connection) {

		connection.query(getDocumentQuery, function(err, rows) {

			if (err) {

				console.log("Error Selecting : %s ", err);

			} else {

				if (rows.length > 0) {

					console.log("Document " + index + " retrieved");

					var firstRow = rows[0];
					var tagged = [];

					for ( var rowIndex in rows) {

						row = rows[rowIndex];
						tagged.push({
							id : row.node,
							label : row.label
						});
					}

					var document = {
						id : firstRow.document,
						title : firstRow.title,
						date : firstRow.date,
						file : firstRow.file,
						owner : firstRow.owner,
						taggedNodes : tagged
					};

					res.status(OK).json('result', {
						"document" : document
					});

				} else {

					console.log("Document " + index + " not retrieved");

					res.status(NOK).json('result', {
						"document" : -1
					});
				}
			}
		});
	});
};

function insertTags(docIndex, tagged, req, callback) {

	var multipleInsertQuery = "INSERT IGNORE INTO tags VALUES ";

	var separator = '';
	for (tagsIndex in tagged) {

		multipleInsertQuery += separator + '(' + docIndex + ', '
				+ tagged[tagsIndex] + ', NULL)';
		separator = ', ';
	}

	console.log(multipleInsertQuery);

	req.getConnection(function(err, connection) {

		connection.query(multipleInsertQuery, function(err, rows) {

			if (err) {

				console.log("Error Inserting : %s ", err);
				callback(-1);

			} else {

				callback(1);
			}
		});
	});
}

function insertKeywords(docIndex, keywords, req, callback) {

	var multipleInsertQuery = "INSERT IGNORE INTO keywords VALUES ";

	var separator = '';
	for (keywordsIndex in keywords) {

		multipleInsertQuery += separator + "(NULL, '" + keywords[keywordsIndex]
				+ "', " + docIndex + ")";
		separator = ', ';
	}

	console.log(multipleInsertQuery);

	req.getConnection(function(err, connection) {

		connection.query(multipleInsertQuery, function(err, rows) {

			if (err) {

				console.log("Error Inserting : %s ", err);
				callback(-1);

			} else {

				callback(1);
			}
		});
	});
}

function insertDocument(title, date, file, owner, tagged, keywords, req,
		callback) {

	var insertQuery = "INSERT INTO documents VALUES(NULL, '" + title
			+ "', STR_TO_DATE('" + date + "', '%d/%m/%Y'), '" + file + "', "
			+ owner + ")";

	console.log(insertQuery);

	req.getConnection(function(err, connection) {

		connection.query(insertQuery, function(err, info) {

			if (err) {

				console.log("Error Inserting : %s ", err);
				console.log("New document not inserted");
				callback(null);

			} else {

				console.log("New document with id " + info.insertId
						+ " inserted");

				var addedDocument = {
					id : info.insertId,
					title : title,
					date : date,
					file : file,
					owner : owner
				};

				if (tagged) {

					insertTags(info.insertId, tagged, req, function(res) {

						if (keywords) {

							insertKeywords(info.insertId, keywords, req,
									function(res) {

										callback(addedDocument);

									});
						} else {

							callback(addedDocument);
						}
					});
				}
				
				else {
					
					callback(addedDocument);
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

	var keywords = null;
	if (req.query.keywords) {

		keywords = JSON.parse(req.query.keywords);
	}

	insertDocument(title, date, file, owner, tagged, keywords, req, function(
			insertedDoc) {

		if (!insertedDoc) {

			res.status(NOK).json('result', {
				"msg" : "document not added"
			});
		} else {

			res.status(OK).json('result', insertedDoc);

		}
	});
};

exports.upload = function(req, res) {

	console.log("uploading document...");
	res.status(OK).json('result', {
		status : 'ok'
	});
};