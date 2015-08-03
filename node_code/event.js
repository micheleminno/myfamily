var OK = 200;
var NOK = 400;

exports.add = function(req, res) {

	var entityId = parseInt(req.param('entityId'));
	var entityType = req.param('entityType');
	var eventType = req.query.type;
	var node = parseInt(req.query.node);

	var insertEventQuery = "INSERT INTO events VALUES(NULL, '" + eventType
			+ "', " + entityId + ", '" + entityType + "', " + node + ", NOW())";

	console.log(insertEventQuery);

	req.getConnection(function(err, connection) {

		connection.query(insertEventQuery, function(err, info) {

			if (err) {

				console.log("Error Inserting : %s ", err);
				console.log("Event not added");

				res.status(NOK).json('result', {
					"msg" : "event not added"
				});

			} else {

				console.log("Event with id " + info.insertId + " added");

				res.status(OK).json('result', {
					"msg" : "event added"
				});
			}
		});
	});
};

exports.remove = function(req, res) {

	var entityId = parseInt(req.param('entityId'));
	var entityType = req.param('entityType');

	var deleteEventsQuery = "DELETE FROM events WHERE entity = " + entityId
			+ " AND entity_type = '" + entityType + "'";

	console.log(deleteEventsQuery);

	req.getConnection(function(err, connection) {

		connection.query(deleteEventsQuery, function(err, rows) {

			if (err) {

				console.log("Error Deleting : %s ", err);

			} else {

				if (rows.affectedRows > 0) {

					console.log("Events related to " + entityType + " "
							+ entityId + " deleted");

					res.status(OK).json('result', {
						"events" : rows
					});
				} else {

					console.log("Events related to " + entityType + " "
							+ entityId + " not deleted");

					res.status(NOK).json('result', {
						"msg" : "events not deleted"
					});
				}
			}
		});
	});
};

/*
 * Get all events about a set of nodes.
 */
exports.list = function(req, res) {

	var viewNodes = req.body.nodes;
	var requests = 0;
	var events = [];

	for (nodeIndex in viewNodes) {

		var node = viewNodes[nodeIndex];

		requests++;

		var query = "SELECT e.id, e.description, e.entity, e.entity_type, e.node, e.date FROM events as e "
				+ "LEFT JOIN tags as t ON e.entity = t.document "
				+ "WHERE e.node = " + node.originalId;

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
