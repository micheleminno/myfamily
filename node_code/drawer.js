var OK = 200;
var NOK = 400;

exports.add = function(req, res) {

	var userId = parseInt(req.param('user'));

	var label = req.query.label;
	var tagged = req.query.tagged;

	var insertDrawerQuery = "INSERT INTO drawers VALUES(NULL, " + userId
			+ ", '" + label + "', '" + tagged + "', NULL, NULL, NULL, NULL)";

	console.log(insertDrawerQuery);

	req.getConnection(function(err, connection) {

		connection.query(insertDrawerQuery, function(err, info) {

			if (err) {

				console.log("Error Inserting : %s ", err);
				console.log("Drawer not added");

				res.status(NOK).json({
					"msg" : "drawer not added"
				});

			} else {

				console.log("Drawer with id " + info.insertId + " added");

				var insertedDrawer = {
					id : info.insertId,
					label : label
				};

				res.status(OK).json(insertedDrawer);
			}
		});
	});
};

exports.update = function(req, res) {

	var drawerId = parseInt(req.param('drawer'));

	var separator = '';
	var labelQuerySegment = '';
	if (req.query.label) {

		labelQuerySegment = "label = '" + req.query.label + "'";
		separator = ', ';
	}

	var taggedQuerySegment = '';
	if (req.query.tagged) {

		taggedQuerySegment = "tagged = '" + req.query.tagged + "'";

	} else {

		separator = '';
	}

	var updateDrawerQuery = 'UPDATE drawers SET ' + labelQuerySegment
			+ separator + taggedQuerySegment + ' WHERE id = ' + drawerId;

	console.log(updateDrawerQuery);

	req.getConnection(function(err, connection) {

		connection.query(updateDrawerQuery, function(err, info) {

			if (err) {

				console.log("Error Updating : %s ", err);
				console.log("Drawer not updated");

				res.status(NOK).json({
					"msg" : "drawer not updated"
				});

			} else {

				console.log("Drawer with id " + drawerId + " updated");

				res.status(OK).json({
					"msg" : "Drawer udpated"
				});
			}
		});
	});
};

exports.remove = function(req, res) {

	var drawerIndex = parseInt(req.param('drawer'));

	var deleteDrawerQuery = "DELETE FROM drawers WHERE id = " + drawerIndex;

	console.log(deleteDrawerQuery);

	req.getConnection(function(err, connection) {

		connection.query(deleteDrawerQuery, function(err, rows) {

			if (err) {

				console.log("Error Deleting : %s ", err);

			} else {

				if (rows.affectedRows > 0) {

					console.log("Drawer " + drawerIndex + " deleted");

					res.status(OK).json({
						"msg" : "Drawer removed"
					});

				} else {

					console.log("Drawer " + drawerIndex + " not deleted");

					res.status(NOK).json({
						"msg" : "Drawer not removed"
					});
				}
			}
		});
	});
};

/*
 * Get all drawers of a user.
 */
exports.list = function(req, res) {

	var user = parseInt(req.param('user'));

	var selectDrawersQuery = "SELECT * from drawers WHERE user = " + user;

	console.log(selectDrawersQuery);

	req.getConnection(function(err, connection) {

		connection.query(selectDrawersQuery, function(err, rows) {

			if (err) {

				console.log("Error Selecting : %s ", err);

			} else {

				var drawers = [];

				for ( var rowIndex in rows) {

					console.log(JSON.stringify(rows[rowIndex]));
					drawers.push(rows[rowIndex]);
				}

				res.status(OK).json('drawers', drawers);
			}
		});
	});
};

/*
 * Get a drawer.
 */
exports.get = function(req, res) {

	var drawerId = parseInt(req.param('drawer'));

	var selectDrawerQuery = "SELECT * from drawers WHERE id = " + drawerId;

	console.log(selectDrawerQuery);

	req.getConnection(function(err, connection) {

		connection.query(selectDrawerQuery, function(err, rows) {

			if (err) {

				console.log("Error Selecting : %s ", err);

			} else {

				if (rows.length > 0) {

					console.log(JSON.stringify(rows[0]));
					drawer = rows[0];
				}

				res.status(OK).json('drawer', drawer);
			}
		});
	});
};

/*
 * Create default drawers for a user.
 */
exports.initialise = function(req, res) {

	var user = parseInt(req.param('user'));

	var insertDefaultDrawersQuery = "INSERT INTO drawers VALUES(NULL, " + user
			+ ", 'Photos with me', '" + user + "', NULL, NULL, NULL, NULL)";

	console.log(insertDefaultDrawersQuery);

	req.getConnection(function(err, connection) {

		connection.query(insertDefaultDrawersQuery, function(err, info) {

			if (err) {

				console.log("Error Inserting : %s ", err);
				console.log("Drawers not added");

				res.status(NOK).json({
					"msg" : "Drawers not added"
				});

			} else {

				console.log("Default drawers added");

				res.status(OK).json({
					"msg" : "default drawers added"
				});
			}
		});
	});
};
