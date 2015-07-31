var OK = 200;
var NOK = 400;

/*
 * Add a node or just a document for another node to the blacklist.
 */
exports.add = function(req, res) {

	var blockedUserId = req.param('blockedUser');
	var userId = req.param('user');
	var documentId = req.param('document');

	req
			.getConnection(function(err, connection) {

				var insertBlacklistItemQuery = "INSERT IGNORE INTO blacklist (user, blocked, document) VALUES("
						+ userId
						+ ", "
						+ blockedUserId
						+ ", "
						+ documentId
						+ ")";

				console.log(insertBlacklistItemQuery);

				req.getConnection(function(err, connection) {

					connection.query(insertBlacklistItemQuery, function(err,
							rows) {

						if (err) {

							console.log("Error Inserting : %s ", err);

						} else {

							if (rows.affectedRows > 0) {

								console.log("Blacklist item added");

								res.status(OK).json('result', {
									"msg" : "Blacklist item added"
								});

							} else {

								console.log("Blacklist item added");

								res.status(NOK).json('result', {
									"msg" : "Blacklist item not added"
								});
							}
						}
					});
				});
			});
};

/*
 * Add many nodes or a document for many nodes to the blacklist.
 */
exports.addMany = function(req, res) {

	var blockedUsers = req.body.blockedUsers;
	var userId = req.param('user');
	var documentId = req.param('document');

	addBlacklistedUsersForDocument(userId, documentId, blockedUsers, req,
			function(added) {

				if (added) {

					res.status(OK).json('result', {
						"msg" : "Blacklist items added"
					});

				} else {

					res.status(NOK).json('result', {
						"msg" : "Blacklist items not added"
					});
				}
			});
};

function addBlacklistedUsersForDocument(userId, documentId, blockedUsers, req,
		callback) {

	var values = "";
	var separator = "";

	for (blockedUserIndex in blockedUsers) {

		var blockedUser = blockedUsers[blockedUserIndex];
		values += separator + "(" + userId + ", " + blockedUser.id + ", "
				+ documentId + ")";

		separator = ", ";
	}

	if (values != "") {

		req
				.getConnection(function(err, connection) {

					var insertBlacklistItemsQuery = "INSERT IGNORE INTO blacklist (user, blocked, document) VALUES "
							+ values;

					console.log(insertBlacklistItemsQuery);

					req.getConnection(function(err, connection) {

						connection.query(insertBlacklistItemsQuery, function(
								err, rows) {

							if (err) {

								console.log("Error Inserting : %s ", err);

							} else {

								if (rows.affectedRows > 0) {

									console.log("Blacklist items added");

									callback(true);

								} else {

									console.log("Blacklist items not added");

									callback(false);
								}
							}
						});
					});
				});
	} else {

		callback(true);
	}
}

function removeBlacklistedUsersForDocument(userId, documentId, blockedUsers,
		req, callback) {

	var values = "";
	var separator = "";

	for (blockedUserIndex in blockedUsers) {

		var blockedUser = blockedUsers[blockedUserIndex];
		values += separator + "(" + userId + ", " + blockedUser.id + ", "
				+ documentId + ")";

		separator = ", ";
	}

	if (values != "") {
		req
				.getConnection(function(err, connection) {

					var insertBlacklistItemsQuery = "DELETE FROM blacklist WHERE (user, blocked, document) IN ("
							+ values + ")";

					console.log(insertBlacklistItemsQuery);

					req.getConnection(function(err, connection) {

						connection.query(insertBlacklistItemsQuery, function(
								err, rows) {

							if (err) {

								console.log("Error Deleting : %s ", err);

							} else {

								if (rows.affectedRows > 0) {

									console.log("Blacklist items deleted");

									callback(true);

								} else {

									console.log("Blacklist items not deleted");

									callback(false);
								}
							}
						});
					});
				});
	} else {

		callback(true);
	}
}

/*
 * Update blacklist for a document.
 */
exports.update = function(req, res) {

	var blockedUsers = req.body.blockedUsers;
	var userId = req.param('user');
	var documentId = req.param('document');

	getBlacklistedUsersForDocument(userId, documentId, req, function(
			blacklisted) {

		blockedUsersToAdd = [];

		for (blockedUsersIndex in blockedUsers) {

			var blockedUser = blockedUsers[blockedUsersIndex];
			var found = false;

			for (blacklistedIndex in blacklisted) {

				var actualBlacklistedUser = blacklisted[blacklistedIndex];

				if (actualBlacklistedUser.id == blockedUser.id) {

					found = true;
					break;
				}
			}

			if (!found) {

				blockedUsersToAdd.push(blockedUser);
			}
		}

		blockedUsersToRemove = [];

		for (blacklistedIndex in blacklisted) {

			var actualBlacklistedUser = blacklisted[blacklistedIndex];
			var found = false;

			for (blockedUsersIndex in blockedUsers) {

				var blockedUser = blockedUsers[blockedUsersIndex];

				if (blockedUser.id == actualBlacklistedUser.id) {

					found = true;
					break;
				}
			}

			if (!found) {

				blockedUsersToRemove.push(actualBlacklistedUser);
			}
		}

		addBlacklistedUsersForDocument(userId, documentId, blockedUsersToAdd,
				req, function(added) {

					if (added) {

						removeBlacklistedUsersForDocument(userId, documentId,
								blockedUsersToRemove, req, function(removed) {

									res.status(OK).json('result', {
										"msg" : "Blacklist items updated"
									});
								});

					} else {

						res.status(NOK).json('result', {
							"msg" : "Blacklist items not updated"
						});
					}
				});
	});

};

/*
 * Remove an item from the blacklist.
 */
exports.remove = function(req, res) {

	var blockedUserId = req.param('blockedUser');
	var userId = req.param('user');
	var documentId = req.param('document');

	req
			.getConnection(function(err, connection) {

				var removeFromBlacklistItemQuery = "DELETE FROM blacklist WHERE user = "
						+ userId + " AND blocked = " + blockedUserId;

				if (documentId) {

					removeFromBlacklistItemQuery += " AND document = "
							+ documentId;
				}

				console.log(removeFromBlacklistItemQuery);

				req.getConnection(function(err, connection) {

					connection.query(removeFromBlacklistItemQuery, function(
							err, rows) {

						if (err) {

							console.log("Error Inserting : %s ", err);

						} else {

							if (rows.affectedRows > 0) {

								console.log("Blacklist item removed");

								res.status(OK).json('result', {
									"msg" : "Blacklist item removed"
								});

							} else {

								console.log("Blacklist item removed");

								res.status(NOK).json('result', {
									"msg" : "Blacklist item not removed"
								});
							}
						}
					});
				});
			});
};

/*
 * Get all blacklisted nodes related to a specific user.
 */
exports.listNodes = function(req, res) {

	var userId = req.param('user');

	var selectBlacklistedQuery = "SELECT blocked FROM blacklist WHERE user = "
			+ userId + " AND document = -1";

	console.log(selectBlacklistedQuery);

	req.getConnection(function(err, connection) {

		connection.query(selectBlacklistedQuery, function(err, rows) {

			if (err) {

				console.log("Error Selecting : %s ", err);

			} else {

				var blacklisted = [];

				for ( var rowIndex in rows) {

					blacklisted.push(rows[rowIndex]['blocked']);
				}

				console.log("res.: " + JSON.stringify(blacklisted));
				res.status(OK).json('blacklisted', blacklisted);
			}
		});
	});
};

function getBlacklistedUsersForDocument(userId, documentId, req, callback) {

	var selectBlacklistedQuery = "SELECT b.blocked as id, n.label as label "
			+ "FROM blacklist as b JOIN nodes as n ON b.blocked = n.id WHERE user = "
			+ userId + " AND document = " + documentId;

	console.log(selectBlacklistedQuery);

	req.getConnection(function(err, connection) {

		connection.query(selectBlacklistedQuery, function(err, rows) {

			if (err) {

				console.log("Error Selecting : %s ", err);

			} else {

				var blacklisted = [];

				for ( var rowIndex in rows) {

					blacklisted.push(rows[rowIndex]);
				}

				callback(blacklisted);
			}
		});
	});
}

/*
 * Get all blacklisted users related to a specific document of a user.
 */
exports.listUsersForDocument = function(req, res) {

	var userId = req.param('user');
	var docId = req.param('document');

	getBlacklistedUsersForDocument(userId, docId, req, function(blacklisted) {

		res.status(OK).json('blacklisted', blacklisted);
	});
};

/*
 * Get all users who blacklisted this user.
 */
exports.listBlacklistingUsers = function(req, res) {

	var userId = req.param('user');

	var selectBlacklistingQuery = "SELECT user FROM blacklist WHERE blocked = "
			+ userId + " AND document = -1";

	console.log(selectBlacklistingQuery);

	req.getConnection(function(err, connection) {

		connection.query(selectBlacklistingQuery, function(err, rows) {

			if (err) {

				console.log("Error Selecting : %s ", err);

			} else {

				var blacklisting = [];

				for ( var rowIndex in rows) {

					blacklisting.push(rows[rowIndex]['user']);
				}

				console.log("res.: " + JSON.stringify(blacklisting));
				res.status(OK).json('blacklisting', blacklisting);
			}
		});
	});
};

/*
 * Get all forbidden documents for a specific user.
 */
exports.listForbiddenDocuments = function(req, res) {

	var userId = req.param('user');

	var selectForbiddenDocumentsQuery = "SELECT document as id FROM blacklist WHERE blocked = "
			+ userId + " AND document != -1";

	console.log(selectForbiddenDocumentsQuery);

	req.getConnection(function(err, connection) {

		connection.query(selectForbiddenDocumentsQuery, function(err, rows) {

			if (err) {

				console.log("Error Selecting : %s ", err);

			} else {

				var forbiddenDocs = [];

				for ( var rowIndex in rows) {

					forbiddenDocs.push(rows[rowIndex]);
				}

				console.log("res.: " + JSON.stringify(forbiddenDocs));
				res.status(OK).json('forbiddenDocs', forbiddenDocs);
			}
		});
	});
};