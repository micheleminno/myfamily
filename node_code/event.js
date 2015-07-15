var OK = 200;
var NOK = 400;

exports.add = function(req, res) {

	var entityId = parseInt(req.param('entityId'));
	var entityType = req.param('entityType');
	var eventType = req.query.type;
	var node = parseInt(req.query.node);

	req
			.getConnection(function(err, connection) {

				connection
						.query(
								"SELECT MAX(id) as maxId from events",
								function(err, rows) {

									if (err) {

										console.log("Error Selecting : %s ",
												err);

									} else {

										if (rows.length > 0) {

											var currentMaxId = rows[0]['maxId'];
											var maxId = currentMaxId != null ? parseInt(currentMaxId) + 1
													: 0;

											var insertEventQuery = "INSERT INTO events VALUES("
													+ maxId
													+ ", '"
													+ eventType
													+ "', "
													+ entityId
													+ ", '"
													+ entityType
													+ "', "
													+ node
													+ ", NOW())";

											console.log(insertEventQuery);

											req
													.getConnection(function(
															err, connection) {

														connection
																.query(
																		insertEventQuery,
																		function(
																				err,
																				rows) {

																			if (err) {

																				console
																						.log(
																								"Error Inserting : %s ",
																								err);

																			} else {

																				if (rows.affectedRows > 0) {

																					console
																							.log("Event with id "
																									+ maxId
																									+ " added");

																					res
																							.status(
																									OK)
																							.json(
																									'result',
																									{
																										"msg" : "event added"
																									});

																				} else {

																					console
																							.log("Event with id "
																									+ maxId
																									+ " not added");

																					res
																							.status(
																									NOK)
																							.json(
																									'result',
																									{
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

/*
 * Get all events about a set of nodes for a specific user.
 */
exports.list = function(req, res) {

	var userId = req.param('user');
	var viewNodes = req.body.nodes;
	var requests = 0;
	var events = [];

	for (nodeIndex in viewNodes) {

		var node = viewNodes[nodeIndex];

		requests++;

		var query = "SELECT e.id, e.description, e.entity, e.entity_type, e.date, n.status FROM events as e LEFT JOIN notifications as n ON e.id = n.event "
				+ "LEFT JOIN tags as t ON e.entity = t.document "
				+ "WHERE e.node = "
				+ node.originalId
				+ " AND (n.status = 1"
				+ " AND n.user = " + userId + " OR n.status IS NULL)";

		console.log(query);

		req.getConnection(function(err, connection) {

			connection.query(query, function(err, rows) {

				requests--;

				if (err) {

					console.log("Error Selecting : %s ", err);

				} else {

					for ( var rowIndex in rows) {

						console.log("Event added: "
								+ JSON.stringify(rows[rowIndex]));

						events.push(rows[rowIndex]);
					}

					if (requests == 0) {

						res.status(OK).json('events', events);
					}
				}
			});
		});
	}
};
