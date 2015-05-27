var view = require('./view.js');

var OK = 200;
var NOK = 400;

function reassignLinks(graph) {

	var nodes = graph.nodes;
	var links = graph.links;

	var nodeMap = {};

	for (nodeIndex in nodes) {

		var node = nodes[nodeIndex];
		nodeMap[node.id] = nodeIndex;
		node.id = nodeIndex;
	}

	for (linkIndex in links) {

		var link = links[linkIndex];
		link.source = parseInt(nodeMap[link.source]);
		link.target = parseInt(nodeMap[link.target]);
	}

	return graph;
};

function finalise(graph, viewIndex, user, req, res, callback) {

	var graphViewWithLevels = assignLevels(reassignLinks(graph));

	assignPositions(graphViewWithLevels, viewIndex, user, req, function(
			graphViewWithPositions) {

		callback(graphViewWithPositions, res);
	});
};

function getNode(nodeIndex, req, callback) {

	var selectNode = 'SELECT * FROM nodes WHERE id = ' + nodeIndex;

	req.getConnection(function(err, connection) {

		connection.query(selectNode, function(err, rows) {

			if (err) {

				console.log("Error Selecting : %s ", err);

			} else {

				if (rows.length > 0) {

					var node = rows[0];
					node.fixed = true;

					callback(node);
				}
			}

			callback(-1);
		});
	});
};

function getFamilyMembers(familyIndex, nodeIndex, viewIndex, memberType, req,
		callback) {

	var graphView = {
		nodes : [],
		links : []
	};

	if (familyIndex == -1) {

		getNode(nodeIndex, req, function(node) {

			if (node != -1) {

				graphView.nodes.push(node);
				callback(graphView);
			}
		});

	} else {

		var whereClause = ' WHERE ';

		if (memberType == 'child') {

			whereClause += 'l.source = ' + familyIndex;
		} else if (memberType == 'parent') {

			whereClause += 'l.target = ' + familyIndex;

		} else if (memberType == 'any') {

			whereClause += 'l.source = ' + familyIndex + ' or l.target = '
					+ familyIndex;
		}

		var selectFamilyMembers = 'SELECT * FROM links as l JOIN nodes as n'
				+ ' ON l.source = n.id OR l.target = n.id' + whereClause
				+ ' GROUP BY n.id';

		req.getConnection(function(err, connection) {

			connection.query(selectFamilyMembers, function(err, rows) {

				if (err) {

					console.log("Error Selecting : %s ", err);

				} else {

					for (rowIndex in rows) {

						var row = rows[rowIndex];

						var isPerson = row['person'];

						if (isPerson) {

							var link = {
								source : row['source'],
								target : row['target']
							};

							graphView.links.push(link);
						}

						var nodeIndex = row['id'];

						var node = {

							id : nodeIndex,
							label : row['label'],
							img : row['img'],
							person : isPerson,
							fixed : true
						};

						graphView.nodes.push(node);
					}

					callback(graphView);
				}
			});
		});
	}
};

function getFamilyIndexAsChild(nodeIndex, req, callback) {

	var selectFamily = "SELECT * FROM links WHERE target = " + nodeIndex;

	req.getConnection(function(err, connection) {

		connection.query(selectFamily, function(err, rows) {

			if (err) {

				console.log("Error Selecting : %s ", err);

			} else {

				if (rows.length > 0) {

					var familyIndex = rows[0]['source'];

					callback(familyIndex);

				} else {

					callback(-1);
				}
			}
		});
	});
};

function getFamilyIndexAsParent(nodeIndex, req, callback) {

	var selectFamily = "SELECT * FROM links WHERE source = " + nodeIndex;

	req.getConnection(function(err, connection) {

		connection.query(selectFamily, function(err, rows) {

			if (err) {

				console.log("Error Selecting : %s ", err);

			} else {

				if (rows.length > 0) {

					var familyIndex = rows[0]['target'];

					callback(familyIndex);
				} else {

					callback(-1);
				}
			}
		});
	});
};

function getPedigree(nodeIndex, req, callback) {

	graph = {
		nodes : [],
		links : []
	};

	getNode(nodeIndex, req, function(node) {

		if (node != -1) {

			graph.nodes.push(node);
		}
	});

	addPedigreeLevel(nodeIndex, req, function(pedigreeLevel) {

		if (pedigreeLevel.nodes.length > 0) {

			pedigreeLevel.links.forEach(function(link) {

				graph.links.push(link);
			});

			pedigreeLevel.nodes.forEach(function(node) {

				graph.nodes.push(node);
			});
		} else {

			callback(graph);
		}
	});
};

function addPedigreeLevel(nodeIndex, req, callback) {

	var pedigreeLevel = {
		nodes : [],
		links : []
	};

	getFamilyIndexAsChild(nodeIndex, req, function(familyIndex) {

		if (familyIndex != -1) {

			getFamilyMembers(familyIndex, nodeIndex, 2, 'parent', req,
					function(graphView) {

						pedigreeLevel.links.push({
							source : familyIndex,
							target : nodeIndex
						});

						graphView.links.forEach(function(link) {

							pedigreeLevel.links.push(link);
						});

						var personFound = false;
						
						graphView.nodes.forEach(function(node) {

							pedigreeLevel.nodes.push(node);

							if (node.person) {

								personFound = true;
								console.log("call get pedigree: " + node.id
										+ " with pedigreeLevel: "
										+ JSON.stringify(pedigreeLevel));

								addPedigreeLevel(node.id, req, callback);
							}
						});
						
						if(!personFound) {
							
							callback(pedigreeLevel);
						}
					});
		}

		else {

			callback(pedigreeLevel);
		}
	});
};

function getExtendedFamily(nodeIndex, req, callback) {

	// TODO
};

function output(graph, res) {

	res.status(OK).json('graph', graph);
};

/*
 * Get the subgraph representing the selected view of the specific user.
 */
exports.view = function(req, res) {

	var nodeIndex = req.param('node');
	var viewIndex = req.query.view;

	if (viewIndex == 0) {

		getFamilyIndexAsChild(nodeIndex, req, function(familyIndex) {

			getFamilyMembers(familyIndex, nodeIndex, viewIndex, 'any', req,
					function(graphView) {

						finalise(graphView, viewIndex, 3, req, res, output);
					});
		});
	} else if (viewIndex == 1) {

		getFamilyIndexAsParent(nodeIndex, req, function(familyIndex) {

			getFamilyMembers(familyIndex, nodeIndex, viewIndex, 'any', req,
					function(graphView) {

						finalise(graphView, viewIndex, 3, req, res, output);
					});
		});
	} else if (viewIndex == 2) {

		getPedigree(nodeIndex, req, function(graphView) {

			console.log("Before finalise: " + JSON.stringify(graphView));

			finalise(graphView, viewIndex, 3, req, res, output);
		});
	} else if (viewIndex == 3) {

		getExtendedFamily(nodeIndex, req, function(graphView) {

			finalise(graphView, viewIndex, 3, req, res, output);
		});
	}
};

function insertNode(label, isPerson, req, callback) {

	req.getConnection(function(err, connection) {

		connection.query("SELECT MAX(id) as maxId from nodes", function(err,
				rows) {

			if (err) {

				console.log("Error Selecting : %s ", err);

			} else {

				if (rows.length > 0) {

					var maxId = parseInt(rows[0]['maxId']) + 1;

					var insertNodeQuery = "INSERT INTO nodes VALUES(" + maxId
							+ ", '" + label + "', '', " + isPerson + ")";

					console.log(insertNodeQuery);

					req.getConnection(function(err, connection) {

						connection.query(insertNodeQuery, function(err, rows) {

							if (err) {

								console.log("Error Inserting : %s ", err);

							} else {

								if (rows.affectedRows > 0) {

									console.log("New node with id " + maxId
											+ " inserted");
									callback(maxId);

								} else {

									console.log("New node with id " + maxId
											+ " not inserted");
									callback(-1);
								}
							}
						});
					});

				} else {

					callback(-1);
				}
			}
		});
	});
};

function insertLink(source, target, req, callback) {

	req.getConnection(function(err, connection) {

		var insertLinkQuery = "INSERT INTO links VALUES(" + source + ", "
				+ target + ")";

		console.log(insertLinkQuery);

		req.getConnection(function(err, connection) {

			connection.query(insertLinkQuery, function(err, rows) {

				if (err) {

					console.log("Error Inserting : %s ", err);

				} else {

					if (rows.affectedRows > 0) {

						console.log("New link inserted");
						callback(1);

					} else {

						console.log("New link not inserted");
						callback(-1);
					}
				}
			});
		});
	});
};

exports.addNode = function(req, res) {

	var type = req.query.type;

	var sourceIndex = null;
	if (req.query.source) {

		sourceIndex = parseInt(req.query.source);
	}

	var targetIndex = null;
	if (req.query.target) {

		targetIndex = parseInt(req.query.target);
	}

	var isPerson = type == "person" ? true : false;
	var label;

	if (isPerson) {

		if (sourceIndex) {

			label = "New child";

		} else if (targetIndex) {

			label = "New parent";
		} else {

			label = "New person";
		}
	} else {

		label = "New family node";
	}

	insertNode(label, isPerson, req, function(insertedId) {

		if (insertedId == -1) {

			res.status(NOK).json('result', {
				"msg" : "graph not updated"
			});
		} else if (sourceIndex) {

			insertLink(sourceIndex, insertedId, req, function() {

				res.status(OK).json('result', {
					"msg" : "graph updated"
				});
			});
		} else if (targetIndex) {

			insertLink(insertedId, targetIndex, req, function() {

				res.status(OK).json('result', {
					"msg" : "graph updated"
				});
			});
		} else {

			res.status(OK).json('result', {
				"msg" : "graph updated"
			});
		}
	});
};

function deleteNode(nodeIndex, req, callback) {

	var deleteNodeQuery = "DELETE FROM nodes WHERE id = " + nodeIndex;
	console.log(deleteNodeQuery);

	req.getConnection(function(err, connection) {

		connection.query(deleteNodeQuery, function(err, rows) {

			if (err) {

				console.log("Error Deleting : %s ", err);

			} else {

				if (rows.affectedRows > 0) {

					console.log("Node " + nodeIndex + " deleted");
					callback(1);

				} else {

					console.log("Node " + nodeIndex + " not deleted");
					callback(0);
				}
			}
		});
	});
};

function deleteLinks(nodeIndex, req, callback) {

	var deleteLinksQuery = "DELETE FROM links WHERE source = " + nodeIndex
			+ " OR target = " + nodeIndex;

	console.log(deleteLinksQuery);

	req.getConnection(function(err, connection) {

		connection.query(deleteLinksQuery, function(err, rows) {

			if (err) {

				console.log("Error Deleting : %s ", err);

			} else {

				if (rows.affectedRows > 0) {

					console.log("Links related to node " + nodeIndex
							+ " deleted");
					callback(1);

				} else {

					console.log("Links related to node " + nodeIndex
							+ " not deleted");
					callback(0);
				}
			}
		});
	});
};

exports.removeNode = function(req, res) {

	var nodeIndex = parseInt(req.param('node'));

	deleteNode(nodeIndex, req, function() {

		deleteLinks(nodeIndex, req, function() {

			res.status(OK).json('result', {
				"msg" : "graph updated"
			});
		});
	});
};

exports.updateNode = function(req, res) {

	var nodeIndex = null;
	if (req.param('node')) {

		nodeIndex = parseInt(req.param('node'));
	}

	var label = req.query.label;

	var updateNodeQuery = "UPDATE nodes SET label = '" + label
			+ "' WHERE id = " + nodeIndex;

	console.log(updateNodeQuery);

	req.getConnection(function(err, connection) {

		connection.query(updateNodeQuery, function(err, rows) {

			if (err) {

				console.log("Error Updating : %s ", err);

			} else {

				if (rows.affectedRows > 0) {

					console.log("Node " + nodeIndex + " updated");

					res.status(OK).json('result', {
						"msg" : "node updated"
					});

				} else {

					console.log("Node " + nodeIndex + " not updated");

					res.status(NOK).json('result', {
						"msg" : "node not updated"
					});
				}
			}
		});
	});
};

var nodes, links;

function getParents(familyNode) {

	var parents = [];
	for (linkIndex in links) {

		var link = links[linkIndex];
		if (link.target == familyNode) {

			parents.push({
				id : link.source,
				person : true
			});
		}
	}

	return parents;
};

function getFamilyNode(nodeIndex) {

	var familyNode = null;
	for (linkIndex in links) {

		var link = links[linkIndex];
		if (link.target == nodeIndex) {

			familyNode = link.source;
			break;
		}
	}

	return familyNode;
};

function computeLevel(leaf, familyNode) {

	var parents = getParents(familyNode);

	for (nodeIndex in nodes) {

		var node = nodes[nodeIndex];
		if (node.id == leaf.id) {

			if (parents.length == 2) {

				node.level = Math.max(assignLevel(parents[0]),
						assignLevel(parents[1])) + 1;

			} else if (parents.length == 1) {

				node.level = assignLevel(parents[0]) + 1;

			} else {

				node.level = 1;
			}

			return node.level;
		}
	}
};

function assignLevel(leaf) {

	if (leaf.person) {

		var familyNode = getFamilyNode(leaf.id);
		for (linkIndex in links) {

			var link = links[linkIndex];
			if (link.target == leaf.id) {

				familyNode = link.source;
				break;
			}
		}

		if (familyNode) {

			return computeLevel(leaf, familyNode);

		} else {

			for (nodeIndex in nodes) {

				var node = nodes[nodeIndex];
				if (node.id == leaf.id) {

					node.level = 1;
					return node.level;
				}
			}
		}
	} else {

		return computeLevel(leaf, leaf.id);
	}
};

function uniformAcquiredLevel(node, desiredLevel) {

	if (node.person) {
		for (nodeIndex in nodes) {

			var currentNode = nodes[nodeIndex];
			if (currentNode.id == node.id) {

				currentNode.acquired = true;
				currentNode.level = desiredLevel;

			}
		}
	} else {

		var familyNode = getFamilyNode(node.id);
		var parents = getParents(familyNode);

		if (parents[0]) {
			uniformAcquiredLevel(parents[0], desiredLevel - 1);
		}

		if (parents[1]) {
			uniformAcquiredLevel(parents[1], desiredLevel - 1);
		}
	}
};

function getLevel(nodeIndex) {

	for (currentNodeIndex in nodes) {

		var currentNode = nodes[currentNodeIndex];
		if (currentNode.id == nodeIndex) {

			return currentNode.level;
		}
	}
};

function checkAcquiredFrom(familyNode) {

	var parents = getParents(familyNode);

	if (parents.length < 2) {
		return;
	}

	var firstParentLevel = getLevel(parents[0].id);
	var secondParentLevel = getLevel(parents[1].id);

	if (firstParentLevel > secondParentLevel) {

		uniformAcquiredLevel(parents[1], firstParentLevel);

	} else if (firstParentLevel < secondParentLevel) {

		uniformAcquiredLevel(parents[0], secondParentLevel);
	}
};

function checkAcquired() {

	var familyNodes = [];

	for (nodeIndex in nodes) {

		var node = nodes[nodeIndex];
		if (!node.person) {

			familyNodes.push(node.id);
		}
	}

	familyNodes.forEach(checkAcquiredFrom);
};

function assignOtherLevels() {

	for (linkIndex in links) {

		var link = links[linkIndex];
		var sourceIndex = link.source;
		var targetIndex = link.target;

		var source = null;
		var target = null;

		for (nodeIndex in nodes) {

			var node = nodes[nodeIndex];
			if (node.id == sourceIndex) {

				source = node;
			} else if (node.id == targetIndex) {

				target = node;
			}
		}

		if (!source.person && target.person) {

			source.level = target.level - 0.5;
		} else if (source.person && !target.person) {

			target.level = source.level + 0.5;
		}

		link.level = target.level;
	}
};

function assignPositions(graph, viewIndex, user, req, callback) {

	var requests = 0;

	var positions = {};

	var offset = 300;
	var height = 600;

	for (nodeIndex in graph.nodes) {

		requests++;

		view.getPosition(user, viewIndex, nodeIndex, req, function(
				existingNodePosition) {

			requests--;

			var currentNodeIndex = existingNodePosition[0];

			var node = graph.nodes[currentNodeIndex];

			var x = null;
			var y = null;

			var nodePosition = existingNodePosition[1];

			if (nodePosition != -1) {

				x = nodePosition[0];
				y = nodePosition[1];

			} else {

				var level = parseFloat(node.level);

				if (!positions[level]) {

					positions[level] = [];
				}

				if (!node.person) {

					if (positions[level - 0.5]) {

						x = positions[level - 0.5][0][0] + offset / 2;
					}
				} else {

					x = offset * positions[level].length;
				}

				y = height - (offset * level);

				positions[level].push([ x, y ]);
			}

			node.x = x;
			node.y = y;

			if (requests == 0) {

				return callback(graph);
			}
		});
	}
};

function assignLevels(graph) {

	nodes = graph.nodes;
	links = graph.links;

	var sources = [];
	for (linkIndex in links) {

		var link = links[linkIndex];
		if (sources.indexOf(link.source) == -1) {

			sources.push(link.source);
		}
	}

	var leaves = [];
	for (nodeIndex in nodes) {

		var node = nodes[nodeIndex];
		if (sources.indexOf(node.id) == -1) {

			node.leaf = true;
			leaves.push({
				id : node.id,
				person : node.person
			});
		}
	}

	for (leafIndex in leaves) {

		var leaf = leaves[leafIndex];
		assignLevel(leaf);
	}

	checkAcquired();
	assignOtherLevels();

	return graph;
};
