var OK = 200;
var NOK = 400;

exports.add = function(req, res) {

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

				res.status(NOK).json({
					"msg" : "keyword not added"
				});

			} else {

				console.log("Keyword with id " + info.insertId + " added");

				res.status(OK).json({
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
 * Get all keywords of a document.
 */
exports.list = function(req, res) {

	var document = parseInt(req.param('document'));

	var selectKeywordsQuery = "SELECT * from bookmarks WHERE document = "
			+ document;

	console.log(selectKeywordsQuery);

	req.getConnection(function(err, connection) {

		connection.query(selectKeywordsQuery, function(err, rows) {

			if (err) {

				console.log("Error Selecting : %s ", err);

			} else {

				var keywords = [];

				for ( var rowIndex in rows) {

					console.log(JSON.stringify(rows[rowIndex]));
					keywords.push(rows[rowIndex]);
				}

				res.status(OK).json('keywords', keywords);
			}
		});
	});
};

/*
 * Get all keywords.
 */
exports.listAll = function(req, res) {

	var selectAllKeywordsQuery = "SELECT * from keywords";

	console.log(selectAllKeywordsQuery);

	req.getConnection(function(err, connection) {

		connection.query(selectAllKeywordsQuery, function(err, rows) {

			if (err) {

				console.log("Error Selecting : %s ", err);

			} else {

				var keywords = [];

				for ( var rowIndex in rows) {

					console.log(JSON.stringify(rows[rowIndex]));
					keywords.push(rows[rowIndex]);
				}

				res.status(OK).json('keywords', keywords);
			}
		});
	});
};
