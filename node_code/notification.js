var OK = 200;
var NOK = 400;

/*
 * Add a new notification.
 */
exports.add = function(req, res) {

	var eventIds = req.body.eventIds;
	var userId = req.param('user');

	var requests = 0;

	eventIds
			.forEach(function(eventId) {

				requests++;

				req
						.getConnection(function(err, connection) {

							var insertNotificationQuery = "INSERT INTO notifications (event, user, status) VALUES("
									+ eventId + ", " + userId + ", 1 )";

							console.log(insertNotificationQuery);

							req
									.getConnection(function(err, connection) {

										connection
												.query(
														insertNotificationQuery,
														function(err, rows) {

															requests--;

															if (err) {

																console
																		.log(
																				"Error Inserting : %s ",
																				err);

															} else {

																if (requests == 0) {

																	if (rows.affectedRows > 0) {

																		console
																				.log("Notifications added");

																		res
																				.status(
																						OK)
																				.json(
																						'result',
																						{
																							"msg" : "notifications added"
																						});

																	} else {

																		console
																				.log("Notifications added");

																		res
																				.status(
																						NOK)
																				.json(
																						'result',
																						{
																							"msg" : "notifications not added"
																						});
																	}
																}
															}
														});
									});
						});
			});

	if (eventIds.length == 0) {

		console.log("Empty notifications: nothing to add");

		res.status(OK).json('result', {
			"msg" : "no notifications: nothing to add"
		});
	}
};

/*
 * Get all unread notifications about a set of nodes for a specific user.
 */
exports.list = function(req, res) {

	var userId = req.param('user');

	var query = "SELECT * FROM notifications JOIN events ON notifications.event = events.id WHERE user = "
			+ userId;

	console.log(query);

	req.getConnection(function(err, connection) {

		connection.query(query, function(err, rows) {

			if (err) {

				console.log("Error Selecting : %s ", err);

			} else {

				var notifications = [];

				for ( var rowIndex in rows) {

					notifications.push(rows[rowIndex]);
				}

				res.status(OK).json('notifications', notifications);
			}
		});
	});
};
