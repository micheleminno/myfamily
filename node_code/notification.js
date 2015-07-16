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
	var status = req.param('status');

	var binaryStatus = 1;
	
	if (status == 'read') {

		binaryStatus = 0;
	}

	var query = "SELECT n.id, e.description, e.entity, e.entity_type, e.date FROM notifications as n JOIN events as e ON n.event = e.id WHERE n.user = "
			+ userId + " AND n.status = " + binaryStatus;

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

/*
 * Change the status of a notification
 */
exports.setStatus = function(req, res) {

	var notificationId = req.param('notification');
	var status = req.query.status;

	var binaryStatus = 1;
	if (status == 'read') {

		binaryStatus = 0;
	}

	var updateNotificationQuery = 'UPDATE notifications SET status = '
			+ binaryStatus + ' WHERE id = ' + notificationId;

	console.log(updateNotificationQuery);

	req.getConnection(function(err, connection) {

		connection.query(updateNotificationQuery, function(err, rows) {

			if (err) {

				console.log("Error Selecting : %s ", err);

			} else {

				if (rows.affectedRows > 0) {

					console.log("Notification " + notificationId + " updated");

					res.status(OK).json('result', {
						"msg" : "Notification " + notificationId + " updated"
					});

				} else {

					console.log("Notification " + notificationId
							+ " not updated");

					res.status(NOK).json('result', {
						"msg" : "Notification " + notificationId + " not found"
					});
				}
			}
		});
	});
};
