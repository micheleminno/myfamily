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