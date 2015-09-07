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

							var insertNotificationQuery = "INSERT IGNORE INTO notifications VALUES("
									+ eventId + ", " + userId + ", 1)";

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
 * Get all notifications about a set of nodes for a specific user.
 */
exports.list = function(req, res) {

	var userId = req.param('user');
	var status = req.param('status');

	var binaryStatus = 1;

	if (status == 'read') {

		binaryStatus = 0;
	}

	var query = "SELECT e.id, e.description, e.entity, d.title, d.file, e.entity_type, DATE_FORMAT(e.date, '%d/%m/%Y %h:%i') as date, e.user "
			+ "FROM notifications as n JOIN events as e ON n.event = e.id JOIN documents as d ON d.id = e.entity "
			+ "WHERE n.user = "
			+ userId
			+ " AND e.entity_type = 'document' AND n.status = " + binaryStatus;

	console.log(query);

	req.getConnection(function(err, connection) {

		connection.query(query, function(err, rows) {

			if (err) {

				console.log("Error Selecting : %s ", err);

			} else {

				var notifications = [];

				for ( var rowIndex in rows) {

					console.log(JSON.stringify(rows[rowIndex]));
					notifications.push(rows[rowIndex]);
				}

				res.status(OK).json('notifications', notifications);
			}
		});
	});
};

var remove = function(user, event, req, res) {

	var deleteNotificationQuery = "DELETE FROM notifications WHERE user = "
			+ user + " AND event = " + event;

	console.log(deleteNotificationQuery);

	req.getConnection(function(err, connection) {

		connection.query(deleteNotificationQuery, function(err, rows) {

			if (err) {

				console.log("Error Deleting : %s ", err);

			} else {

				var notificationId = "(" + user + ", " + event + ")";

				if (rows.affectedRows > 0) {

					console.log("Notification " + notificationId + " removed");

					res.status(OK).json('result', {
						"msg" : "Notification " + notificationId + " removed"
					});
				} else {

					console.log("Notification " + notificationId
							+ " not removed");

					res.status(NOK).json('result', {
						"msg" : "Notification " + notificationId + " not found"
					});
				}
			}
		});
	});
};

var removeForAllUsers = function(event, req, res, callback) {

	var deleteNotificationsQuery = "DELETE FROM notifications WHERE event = "
			+ event;

	console.log(deleteNotificationsQuery);

	req.getConnection(function(err, connection) {

		connection.query(deleteNotificationsQuery, function(err, rows) {

			if (err) {

				console.log("Error Deleting : %s ", err);

			} else {

				if (rows.affectedRows > 0) {

					console
							.log("Notifications for event " + event
									+ " removed");

					callback();

				} else {

					console.log("Notification for event " + event
							+ " not removed");

					callback();
				}
			}
		});
	});
};

/*
 * Remove a notification
 */
exports.remove = function(req, res) {

	var user = req.param('user');
	var event = req.param('event');

	remove(user, event, req, res);
};

/*
 * Remove all notifications related to a specific entity
 */
exports.removeForEntity = function(req, res) {

	var entityType = req.param('entityType');
	var entityId = req.param('entityId');

	var query = "SELECT e.id FROM events as e " + "WHERE e.entity = "
			+ entityId + " AND e.entity_type = '" + entityType + "'";

	console.log(query);

	req
			.getConnection(function(err, connection) {

				connection
						.query(
								query,
								function(err, rows) {

									if (err) {

										console.log("Error Selecting : %s ",
												err);

									} else {

										var requests = 0;

										for ( var rowIndex in rows) {

											requests++;

											var event = rows[rowIndex]['id'];

											removeForAllUsers(
													event,
													req,
													res,
													function() {

														requests--;

														if (requests == 0) {

															console
																	.log("Notifications for entity "
																			+ entityId
																			+ " removed");

															res
																	.status(OK)
																	.json(
																			'result',
																			{
																				"msg" : "Notifications removed for entity "
																						+ entityId
																			});
														}
													});
										}
									}
								});
			});
};

/*
 * Change the status of a notification
 */
exports.setStatus = function(req, res) {

	var userId = req.param('user');
	var eventId = req.param('event');
	var status = req.query.status;

	var binaryStatus = 1;
	if (status == 'read') {

		binaryStatus = 0;
	}

	var updateNotificationQuery = 'UPDATE notifications SET status = '
			+ binaryStatus + ' WHERE user = ' + userId + " AND event = "
			+ eventId;

	console.log(updateNotificationQuery);

	req.getConnection(function(err, connection) {

		connection.query(updateNotificationQuery, function(err, rows) {

			if (err) {

				console.log("Error Selecting : %s ", err);

			} else {

				var notificationId = "(" + userId + ", " + eventId + ")";

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
