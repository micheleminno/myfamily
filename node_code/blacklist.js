var OK = 200;
var NOK = 400;

/*
 * Add a new item to the blacklist.
 */
exports.add = function(req, res) {

	var blockedEntityId = req.param('blockedEntity');
	var userId = req.param('user');
	var entityType = req.param('entityType');

	req
			.getConnection(function(err, connection) {

				var insertBlacklistItemQuery = "INSERT IGNORE INTO blacklist (user, blocked, type) VALUES("
						+ userId
						+ ", "
						+ blockedEntityId
						+ ", '"
						+ entityType
						+ "')";

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
 * Remove an item from the blacklist.
 */
exports.remove = function(req, res) {

	var blockedEntityId = req.param('blockedEntity');
	var userId = req.param('user');
	var entityType = req.param('entityType');

	req
			.getConnection(function(err, connection) {

				var removeFromBlacklistItemQuery = "DELETE FROM blacklist WHERE user = "
						+ userId
						+ " AND blocked = "
						+ blockedEntityId
						+ " AND type = '" + entityType + "'";

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
 * Get all blacklisted items related to a specific user.
 */
exports.list = function(req, res) {

	var userId = req.param('user');
	var entityType = req.param('entityType');

	var selectBlacklistedQuery = "SELECT blocked FROM blacklist WHERE user = "
			+ userId + " AND type = '" + entityType + "'";

	console.log(selectBlacklistedQuery);

	req.getConnection(function(err, connection) {

		connection.query(selectBlacklistedQuery, function(err, rows) {

			if (err) {

				console.log("Error Selecting : %s ", err);

			} else {

				var blacklisted = [];

				for ( var rowIndex in rows) {

					console.log(JSON.stringify(rows[rowIndex]));
					blacklisted.push(rows[rowIndex]['blocked']);
				}

				res.status(OK).json('blacklisted', blacklisted);
			}
		});
	});
};
