var OK = 200;
var NOK = 400;

exports.isRegistered = function(req, res) {

	var username = req.query.user;
	var credentials = req.query.credentials;

	var getCredentialsQuery = "SELECT * from users WHERE username = '"
			+ username + "' AND credentials = '" + credentials + "'";

	console.log(getCredentialsQuery);

	req.getConnection(function(err, connection) {

		connection.query(getCredentialsQuery, function(err, rows) {

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
