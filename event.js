var OK = 200;
var NOK = 400;

exports.add = function(req, res) {

	var entityId = parseInt(req.param('entityId'));
	var entityType = req.param('entityType');
	var eventType = req.query.type;

	req.getConnection(function(err, connection) {

		connection.query("SELECT MAX(id) as maxId from events", function(err,
				rows) {

			if (err) {

				console.log("Error Selecting : %s ", err);

			} else {

				if (rows.length > 0) {

					var currentMaxId = rows[0]['maxId'];
					var maxId = currentMaxId != null ? parseInt(currentMaxId) + 1 : 0;

					var insertEventQuery = "INSERT INTO events VALUES(" + maxId
							+ ", '" + eventType + "', " + entityId + ", '"
							+ entityType + "', NOW())";

					console.log(insertEventQuery);

					req.getConnection(function(err, connection) {

						connection.query(insertEventQuery, function(err, rows) {

							if (err) {

								console.log("Error Inserting : %s ", err);

							} else {

								if (rows.affectedRows > 0) {

									console.log("Event with id " + maxId
											+ " added");

									res.status(OK).json('result', {
										"msg" : "event added"
									});

								} else {

									console.log("Event with id " + maxId
											+ " not added");

									res.status(NOK).json('result', {
										"msg" : "event not added"
									});
								}
							}
						});
					});
				}
			}
		});
	});
};