var OK = 200;
var NOK = 400;

exports.add = function(req, res) {

	var user = parseInt(req.param('user'));
	var document = req.param('document');

	var insertBookmarkQuery = "INSERT INTO bookmarks VALUES(" + user + ", "
			+ document + ")";

	console.log(insertBookmarkQuery);

	req.getConnection(function(err, connection) {

		connection.query(insertBookmarkQuery, function(err, info) {

			if (err) {

				console.log("Error Inserting : %s ", err);
				console.log("Bookmark not added");

				res.status(NOK).json({
					"msg" : "bookmark not added"
				});

			} else {

				console.log("Bookmark with id " + info.insertId + " added");

				res.status(OK).json({
					"msg" : "bookmark added"
				});
			}
		});
	});
};

exports.remove = function(req, res) {

	var user = parseInt(req.param('user'));
	var document = req.param('document');

	var deleteBookmarkQuery = "DELETE FROM bookmarks WHERE user = " + user
			+ " AND document = " + document;

	console.log(deleteBookmarkQuery);

	req.getConnection(function(err, connection) {

		connection.query(deleteBookmarkQuery, function(err, rows) {

			if (err) {

				console.log("Error Deleting : %s ", err);

			} else {

				if (rows.affectedRows > 0) {

					console.log("Bookmark of user " + user
							+ " related to document " + document + " deleted");

					res.status(OK).json({
						"msg" : "bookmark deleted"
					});
				} else {

					console.log("Bookmark of user " + user
							+ " related to document " + document
							+ " not deleted");

					res.status(NOK).json({
						"msg" : "bookmark not deleted"
					});
				}
			}
		});
	});
};

/*
 * Get all bookmarks of a user.
 */
exports.list = function(req, res) {

	var user = parseInt(req.param('user'));

	var selectBookmarksQuery = "SELECT * from bookmarks WHERE user = " + user;

	console.log(selectBookmarksQuery);

	req.getConnection(function(err, connection) {

		connection.query(selectBookmarksQuery, function(err, rows) {

			if (err) {

				console.log("Error Selecting : %s ", err);

			} else {

				var bookmarks = [];

				for ( var rowIndex in rows) {

					console.log(JSON.stringify(rows[rowIndex]));
					bookmarks.push(rows[rowIndex]);
				}

				res.status(OK).json('bookmarks', bookmarks);
			}
		});
	});
};
