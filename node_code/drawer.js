var OK = 200;
var NOK = 400;

exports.add = function(req, res) {

	// TODO
	var document = parseInt(req.param('document'));
	var keyword = req.param('keyword');

	var insertKeywordQuery = "INSERT INTO keywords VALUES(NULL, '" + keyword
			+ "', " + document + ")";

	console.log(insertKeywordQuery);

	req.getConnection(function(err, connection) {

		connection.query(insertKeywordQuery, function(err, info) {

			if (err) {

				console.log("Error Inserting : %s ", err);
				console.log("Keyword not added");

				res.status(NOK).json('result', {
					"msg" : "keyword not added"
				});

			} else {

				console.log("Keyword with id " + info.insertId + " added");

				res.status(OK).json('result', {
					"msg" : "keyword added"
				});
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

				res.status(NOK).json('result', {
					"msg" : "drawer not updated"
				});

			} else {

				console.log("Drawer with id " + drawerId + " updated");

				res.status(OK).json('result', {
					"msg" : "Drawer udpated"
				});
			}
		});
	});
};

exports.remove = function(req, res) {

	// TODO
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

	// TODO

	var insertDefaultDrawersQuery = "INSERT INTO drawers VALUES(NULL, " + user
			+ ", 'family photos', NULL, NULL, NULL, NULL, NULL)";

	console.log(insertDefaultDrawersQuery);

	req.getConnection(function(err, connection) {

		connection.query(insertDefaultDrawersQuery, function(err, info) {

			if (err) {

				console.log("Error Inserting : %s ", err);
				console.log("Drawers not added");

				res.status(NOK).json('result', {
					"msg" : "Drawers not added"
				});

			} else {

				console.log("Default drawers added");

				res.status(OK).json('result', {
					"msg" : "default drawers added"
				});
			}
		});
	});
};