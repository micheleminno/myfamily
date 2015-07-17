var OK = 200;
var NOK = 400;

exports.getRegistered = function(req, res) {

	var username = req.query.user;
	var credentials = req.query.credentials;
	var nodeId = req.query.node;

	var queryPart;

	if (credentials) {

		queryPart = "AND credentials = '" + credentials + "'";
	} else {

		queryPart = "AND node = " + nodeId;
	}

	var getUserQuery = "SELECT * from users WHERE username = '" + username
			+ "' " + queryPart;

	console.log(getUserQuery);

	req.getConnection(function(err, connection) {

		connection.query(getUserQuery, function(err, rows) {

			if (err) {

				console.log("Error Selecting : %s ", err);

			} else {

				if (rows.length > 0) {

					console.log("User " + username + " is a registered user");

					res.status(OK).json('result', {
						"registeredUser" : rows[0]
					});

				} else {

					console.log("User " + username + " is not registered");

					res.status(NOK).json('result', {
						"registeredUser" : null
					});
				}
			}
		});
	});
};

exports.register = function(req, res) {

	var username = req.query.username;
	var credentials = req.query.credentials;
	var email = req.query.email;
	var nodeId = req.query.node;

	req
			.getConnection(function(err, connection) {

				var insertUserQuery = "INSERT INTO users(username, birthdate, email, credentials, node) VALUES('"
						+ username
						+ "', 'NULL', '"
						+ email
						+ "', '"
						+ credentials + "', " + nodeId + ")";

				console.log(insertUserQuery);

				req.getConnection(function(err, connection) {

					connection.query(insertUserQuery, function(err, rows) {

						if (err) {

							console.log("Error Inserting : %s ", err);

						} else {

							if (rows.affectedRows > 0) {

								console.log(JSON.stringify(rows));

								var user = {
									id : rows.insertId,
									username : username,
									nodeId : nodeId
								};

								console.log("New user with id " + user.id
										+ " inserted");

								res.status(OK).json('result', {
									"user" : user
								});

							} else {

								console.log("New user not inserted");

								res.status(OK).json('result', {
									"newUser" : null
								});
							}
						}
					});
				});
			});
};

exports.update = function(req, res) {

	var username = req.query.username;
	var credentials = req.query.credentials;
	var nodeId = req.query.node;

	req.getConnection(function(err, connection) {

		var updateUserQuery = "UPDATE users SET credentials = '" + credentials
				+ "' WHERE username = '" + username + "' AND node = " + nodeId;

		console.log(updateUserQuery);

		req.getConnection(function(err, connection) {

			connection.query(updateUserQuery, function(err, rows) {

				if (err) {

					console.log("Error Selecting : %s ", err);

				} else {

					if (rows.affectedRows > 0) {

						console.log("User with username " + username
								+ " updated");

						res.status(OK).json('result', {
							"userUpdated" : 1
						});

					} else {

						console.log("User with username " + username
								+ " not updated");

						res.status(OK).json('result', {
							"userUpdated" : 0
						});
					}
				}
			});
		});
	});
};
