var OK = 200;
var NOK = 400;

exports.add = function(req, res) {

	var nodeId = parseInt(req.param('node'));
	var eventType = req.query.type;
	var date = req.query.date;

	var insertNodeEventQuery = "INSERT INTO node_events VALUES(NULL, '"
			+ eventType + "', STR_TO_DATE('" + date + "', '%d/%m/%Y'), "
			+ nodeId + ")";

	console.log(insertNodeEventQuery);

	req.getConnection(function(err, connection) {

		connection.query(insertNodeEventQuery, function(err, info) {

			if (err) {

				console.log("Error Inserting : %s ", err);
				console.log("Event not added");

				res.status(NOK).json('result', {
					"msg" : "node event not added"
				});

			} else {

				console.log("Node event with id " + info.insertId + " added");

				var addedNodeEvent = {
					id : info.insertId,
					type : eventType,
					date : date,
					node : nodeId
				};

				res.status(OK).json('result', addedNodeEvent);
			}
		});
	});
};

exports.remove = function(req, res) {

	// TODO

	var entityId = parseInt(req.param('entityId'));
	var entityType = req.param('entityType');
	var user = req.param('user');

	var deleteEventsQuery = "DELETE FROM events WHERE entity = " + entityId
			+ " AND entity_type = '" + entityType + "' AND user = " + user;

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
 * Get all events about a node.
 */
exports.list = function(req, res) {

	var events = [];
	var nodeId = req.param('node');

	var query = "SELECT * FROM node_events as ne " + "WHERE ne.node = "
			+ nodeId;

	console.log(query);

	req.getConnection(function(err, connection) {

		connection.query(query, function(err, rows) {

			if (err) {

				console.log("Error Selecting : %s ", err);

			} else {

				for ( var rowIndex in rows) {

					console.log("Node event added: "
							+ JSON.stringify(rows[rowIndex]));

					events.push(rows[rowIndex]);
				}

				res.status(OK).json('events', events);
			}
		});

	});

};
