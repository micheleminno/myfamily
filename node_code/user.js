var OK = 200;
var NOK = 400;

exports.getRegistered = function(req, res) {

	var username = req.query.user;
	var credentials = req.query.credentials;
	var nodeId = req.query.node;

	var queryPart = "";

	var operator = '';

	if (username) {

		queryPart += operator + " username = '" + username + "'";
		operator = " AND";
	}

	if (credentials) {

		queryPart += operator + " credentials = '" + credentials + "'";
		operator = " AND";
	}

	if (nodeId) {

		queryPart += operator + " node = " + nodeId;
	}

	var getUserQuery = "SELECT * from users WHERE" + queryPart;

	console.log(getUserQuery);

	req.getConnection(function(err, connection) {

		connection.query(getUserQuery, function(err, rows) {

			if (err) {

				console.log("Error Selecting : %s ", err);

			} else {

				if (rows.length > 0) {

					console.log("User " + username + " is a registered user");

					res.status(OK).json({
						"registeredUser" : rows[0]
					});

				} else {

					console.log("User " + username + " is not registered");

					res.status(OK).json({
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

	req.getConnection(function(err, connection) {

		var insertUserQuery = "INSERT INTO users(username, email, credentials, node) VALUES('" + username
				+ "', '" + email + "', '" + credentials + "', "
				+ nodeId + ")";

		console.log(insertUserQuery);

		req.getConnection(function(err, connection) {

			connection.query(insertUserQuery, function(err, info) {

				if (err) {

					console.log("Error Inserting : %s ", err);
					console.log("New user " + username + " not inserted");

					res.status(OK).json({
						"user" : null
					});

				} else {

					var user = {
						id : info.insertId,
						username : username,
						nodeId : nodeId
					};

					console.log("New user with id " + user.id + " inserted");

					res.status(OK).json({
						"user" : user
					});
				}
			});
		});
	});
};

exports.update = function(req, res) {

	// TODO: update also other user fields

	var username = req.query.username;
	var nodeId = req.query.node;

	req.getConnection(function(err, connection) {

		var updateUserQuery = "UPDATE users SET username = '" + username
				+ "' WHERE node = " + nodeId;

		console.log(updateUserQuery);

		req.getConnection(function(err, connection) {

			connection.query(updateUserQuery,
					function(err, rows) {

						if (err) {

							console.log("Error Selecting : %s ", err);

						} else {

							if (rows.affectedRows > 0) {

								console.log("User with node id " + nodeId
										+ " updated");

								res.status(OK).json({
									"userUpdated" : 1
								});

							} else {

								console.log("User with node id " + nodeId
										+ " not updated");

								res.status(OK).json({
									"userUpdated" : 0
								});
							}
						}
					});
		});
	});
};
