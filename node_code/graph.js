var fs = require('fs');

var view = require('./view.js');

var OK = 200;
var NOK = 400;

function reassignLinks(graph) {

	var nodes = graph.nodes;
	var links = graph.links;

	var nodeMap = {};

	for (nodeIndex in nodes) {

		var node = nodes[nodeIndex];
		node.originalId = node.id;
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

	console.log("Finalising graph");

	graph = reassignLinks(graph);
	var graphViewWithLevels = assignLevels(graph);

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

					callback(node);
				}
			}

			callback(-1);
		});
	});
};

function getFamilyMembers(familyIndex, nodeIndex, memberType, graph, req,
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

		var found = false;
		for ( var nodeIndex in graph.nodes) {

			var node = graph.nodes[nodeIndex];
			if (node.id == familyIndex) {

				found = true;
				break;
			}
		}

		if (found) {

			callback(graphView);

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
					+ ' ON l.source = n.id OR l.target = n.id'
					+ whereClause
					+ ' GROUP BY n.id';

			console.log(selectFamilyMembers);

			req.getConnection(function(err, connection) {

				connection.query(selectFamilyMembers,
						function(err, rows) {

							if (err) {

								console.log(
										"Error selecting family members: %s ",
										err);

							} else {

								for (rowIndex in rows) {

									var row = rows[rowIndex];
									if (row.id != null) {

										var isPerson = row['person'];

										if (isPerson) {

											var link = {
												id : row['source'] + "-"
														+ row['target'],
												source : row['source'],
												target : row['target'],
												visible : row['visible']
											};

											graphView.links.push(link);
										}

										var nodeIndex = row['id'];

										var fixed = isPerson ? false : true;

										var node = {

											id : nodeIndex,
											label : row['label'],
											img : row['img'],
											person : isPerson,
											fixed : fixed
										};

										graphView.nodes.push(node);
									}
								}

								callback(graphView);
							}
						});
			});
		}
	}
};

function getFamilyIndexes(nodeIndex, familyType, req, callback) {

	var whereClause = 'WHERE ';

	if (familyType == 'asChild') {

		whereClause += 'target = ' + nodeIndex;

	} else if (familyType == 'asParent') {

		whereClause += 'source = ' + nodeIndex;

	} else if (familyType == 'any') {

		whereClause += 'source = ' + nodeIndex + ' OR target = ' + nodeIndex;
	}

	var selectFamily = "SELECT * FROM links " + whereClause;

	req.getConnection(function(err, connection) {

		connection.query(selectFamily, function(err, rows) {

			if (err) {

				console.log("Error selecting family: %s ", err);

			} else {

				var familyIndexes = [ -1, -1 ];

				if (rows.length > 0) {

					for (rowIndex in rows) {

						var row = rows[rowIndex];

						if (row["source"] == nodeIndex) {

							familyIndexes[1] = row['target'];

						} else if (row["target"] == nodeIndex) {

							familyIndexes[0] = row['source'];
						}
					}
				}

				callback(familyIndexes);
			}
		});
	});
};

function getExtendedFamily(nodeIndex, viewIndex, req, callback) {

	graph = {
		nodes : [],
		links : []
	};

	getNode(nodeIndex, req, function(node) {

		if (node != -1) {

			graph.nodes.push(node);

			console.log("Entity " + JSON.stringify(node) + " added");

			history = '';

			addExtendedFamilyLevel(nodeIndex, viewIndex, graph, history, req,
					function(graph) {

						callback(graph);
					});
		}
	});
};

function alreadyAdded(nodeId, nodes) {

	var added = false;

	for ( var nodeIndex in nodes) {

		var node = nodes[nodeIndex];
		if (node.id = nodeId) {

			added = true;
			break;
		}
	}

	return added;
};

function addIfNotFound(entity, entities) {

	var entityFound = false;

	for (entityIndex in entities) {

		var currentEntity = entities[entityIndex];
		if (currentEntity.id == entity.id) {

			entityFound = true;
			break;
		}
	}

	if (!entityFound) {

		console.log("Entity " + JSON.stringify(entity) + " added");
		entities.push(entity);
	}

	return !entityFound;
};

function addAllIfNotFound(entitiesToAdd, entities) {

	entitiesToAdd.forEach(function(entity) {

		addIfNotFound(entity, entities);
	});
};

function inExtendedFamily(history) {

	var indexOfLastC = history.lastIndexOf('c');
	if (indexOfLastC == -1) {

		return true;

	} else {

		var indexOfCBeforeLast = history.substring(0, indexOfLastC)
				.lastIndexOf('c');

		if (history.length == 0 || indexOfLastC == indexOfCBeforeLast + 1) {

			return true;

		} else {

			return false;
		}
	}
};

function addMembers(asChild, nodeIndex, familyIndex, viewIndex, graph, history,
		req, callback) {

	var memberType = viewIndex == 4 ? 'any' : viewIndex == 3 ? 'child'
			: 'parent';

	getFamilyMembers(familyIndex, nodeIndex, memberType, graph, req, function(
			graphView) {

		if (familyIndex != -1 && graphView.nodes.length > 0) {

			var linkFamilyNode;
			
			//TODO fix visible

			if (asChild) {

				history += 'c';

				var idValue = familyIndex + "-" + nodeIndex;
				var selectedLink = graphView.links.filter(function(link) {
					
					return link.id = idValue;
				});
				
				linkFamilyNode = {
					id : idValue,
					source : familyIndex,
					target : nodeIndex,
					visible : selectedLink.visible
				};
			} else {

				history += 'p';

				var idValue = nodeIndex + "-" + familyIndex;
				var selectedLink = graphView.links.filter(function(link) {
					
					return link.id = idValue;
				});

				linkFamilyNode = {
					id : idValue,
					source : nodeIndex,
					target : familyIndex,
					visible : selectedLink.visible
				};
			}

			console.log("History: " + history);

			if (inExtendedFamily(history)) {

				addIfNotFound(linkFamilyNode, graph.links);
				addAllIfNotFound(graphView.links, graph.links);

				var requests = 0;

				graphView.nodes.forEach(function(node) {

					requests++;

					var added = addIfNotFound(node, graph.nodes);

					if (added && node.person && node.id != nodeIndex) {

						addExtendedFamilyLevel(node.id, viewIndex, graph,
								history, req, function(graph) {

									requests--;

									if (requests == 0) {

										callback(graph, history);
									}
								});
					} else {

						requests--;
					}
				});

				if (requests == 0) {

					callback(graph, history);
				}
			} else {

				callback(graph, history);
			}
		} else {

			callback(graph, history);
		}
	});
};

function addExtendedFamilyLevel(nodeIndex, viewIndex, graph, history, req,
		callback) {

	var mode = getFamilyType(viewIndex);

	getFamilyIndexes(nodeIndex, mode, req, function(familyIndexes) {

		// Exploring parents of nodeIndex as a child

		addMembers(true, nodeIndex, familyIndexes[0], viewIndex, graph,
				history, req, function(graph, history) {

					// Exploring children of nodeIndex as a parent

					addMembers(false, nodeIndex, familyIndexes[1], viewIndex,
							graph, history, req, function(graph, history) {

								callback(graph);
							});
				});

	});
};

function getFamilyType(viewIndex) {

	var mode;

	if (viewIndex == 2) {

		mode = "asChild";

	} else if (viewIndex == 3) {

		mode = "asParent";

	} else {

		mode = "any";
	}

	return mode;
};

function output(graph, res) {

	res.status(OK).json('graph', graph);
};

/*
 * Get the subgraph representing the selected view of the specific user.
 * 
 * 0 : my family as a child 1 : my family as a parent 2 : my pedigree 3 : my
 * descendants 4 : my extended family
 * 
 */
exports.view = function(req, res) {

	var user = req.param('user');
	var viewIndex = req.query.view;

	console.log("viewIndex: " + viewIndex);

	if (viewIndex == 0) {

		getFamilyIndexes(user, 'asChild', req, function(familyIndexes) {

			var familyIndex = familyIndexes[0];

			getFamilyMembers(familyIndex, user, 'any', {}, req, function(
					graphView) {

				finalise(graphView, viewIndex, user, req, res, output);
			});
		});
	} else if (viewIndex == 1) {

		getFamilyIndexes(user, 'asParent', req, function(familyIndexes) {

			var familyIndex = familyIndexes[1];

			getFamilyMembers(familyIndex, user, 'any', {}, req, function(
					graphView) {

				finalise(graphView, viewIndex, user, req, res, output);
			});
		});
	} else if (viewIndex == 2) {

		getExtendedFamily(user, viewIndex, req, function(graphView) {

			finalise(graphView, viewIndex, user, req, res, output);
		});
	} else if (viewIndex == 3) {

		getExtendedFamily(user, viewIndex, req, function(graphView) {

			finalise(graphView, viewIndex, user, req, res, output);
		});
	} else if (viewIndex == 4) {

		getExtendedFamily(user, viewIndex, req, function(graphView) {

			finalise(graphView, viewIndex, user, req, res, output);
		});
	}
};

function insertNode(label, isPerson, req, callback) {

	var insertNodeQuery = "INSERT INTO nodes VALUES(NULL, '" + label
			+ "', '', " + isPerson + ")";

	console.log(insertNodeQuery);

	req.getConnection(function(err, connection) {

		connection.query(insertNodeQuery, function(err, info) {

			if (err) {

				console.log("Error Inserting : %s ", err);
				console.log("New node not inserted");
				callback(-1);

			} else {

				console.log("New node with id " + info.insertId + " inserted");
				callback(info.insertId);
			}
		});
	});
};

function updateNodeInDB(nodeIndex, field, value, req, callback) {

	var updateNodeQuery = "UPDATE nodes SET " + field + " = '" + value
			+ "' WHERE id = " + nodeIndex;

	console.log(updateNodeQuery);

	req.getConnection(function(err, connection) {

		connection.query(updateNodeQuery, function(err, rows) {

			if (err) {

				console.log("Error Updating : %s ", err);

			} else {

				if (rows.affectedRows > 0) {

					console.log("Node " + nodeIndex + " updated");

					callback(true);

				} else {

					console.log("Node " + nodeIndex + " not updated");

					callback(false);
				}
			}
		});
	});
};

function insertLink(source, target, linkVisible, req, callback) {

	var visibleValue = linkVisible ? 1 : 0;

	var insertLinkQuery = "INSERT IGNORE INTO links VALUES(" + source + ", "
			+ target + ", " + visibleValue + ")";

	console.log(insertLinkQuery);

	req.getConnection(function(err, connection) {

		connection.query(insertLinkQuery, function(err, rows) {

			if (err) {

				console.log("Error Inserting : %s ", err);

			} else {

				if (rows.affectedRows > 0) {

					console.log("New link inserted");
					callback(true);

				} else {

					console.log("New link not inserted");
					callback(false);
				}
			}
		});
	});
};

function getDefaultLabel(isPerson, sourceIndex, targetIndex) {

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

	return label;
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

	var label = req.query.label;

	if (!label) {

		label = getDefaultLabel(isPerson, sourceIndex, targetIndex);
	}

	var linkVisible = true;

	if (req.query.link && req.query.link == 'invisible') {

		linkVisible = false;
	}

	insertNode(label, isPerson, req, function(insertedId) {

		if (insertedId == -1) {

			res.status(NOK).json('result', {
				"msg" : "node and link not added"
			});
		} else if (sourceIndex) {

			insertLink(sourceIndex, insertedId, linkVisible, req, function(
					linkInserted) {

				if (linkInserted) {

					res.status(OK).json('result', {
						"msg" : "graph updated",
						"newNode" : insertedId
					});
				} else {

					res.status(NOK).json('result', {
						"msg" : "link not added"
					});
				}
			});
		} else if (targetIndex) {

			insertLink(insertedId, targetIndex, linkVisible, req, function(
					linkInserted) {

				if (linkInserted) {

					res.status(OK).json('result', {
						"msg" : "graph updated",
						"newNode" : insertedId
					});
				} else {

					res.status(NOK).json('result', {
						"msg" : "link not added"
					});
				}

			});
		} else {

			res.status(OK).json('result', {
				"msg" : "graph updated",
				"newNode" : insertedId
			});
		}
	});
};

exports.addPerson = function(req, res) {

	var name = req.query.name;

	insertNode(name, true, req, function(insertedId) {

		if (insertedId == -1) {

			res.status(NOK).json('result', {
				"msg" : "person not added"
			});
		} else {

			res.status(OK).json('result', {
				"personId" : insertedId
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

	var field = req.query.field;
	var value = req.query.value;

	updateNodeInDB(nodeIndex, field, value, req, function(updated) {

		if (updated) {

			res.status(OK).json('result', {
				"msg" : "node updated"
			});
		} else {

			res.status(NOK).json('result', {
				"msg" : "node not updated"
			});
		}
	});
};

exports.resetPositions = function(req, res) {

	var user = req.param('user');
	var view = req.param('view');
	var viewNodes = req.body;

	var updateNodesQuery = 'DELETE from views WHERE user = ' + user
			+ ' AND view = ' + view + ' AND node IN(' + viewNodes.join() + ')';

	console.log(updateNodesQuery);

	req.getConnection(function(err, connection) {

		connection.query(updateNodesQuery, function(err, rows) {

			if (err) {

				console.log("Error Updating : %s ", err);

			} else {

				if (rows.affectedRows > 0) {

					console.log("Positions of user " + user + " and view "
							+ view + " deleted");

					res.status(OK).json(
							'result',
							{
								"msg" : "Positions of user " + user
										+ " and view " + view + " deleted"
							});

				} else {

					console.log("Positions of user " + user + " and view "
							+ view + " not deleted: nothing to delete");

					res.status(NOK).json(
							'result',
							{
								"msg" : "Positions of user " + user
										+ " and view " + view
										+ " not deleted: nothing to delete"
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

function checkStoredPositions(user, viewIndex, graph, req, callback) {

	var requests = 0;

	for ( var nodeIndex in graph.nodes) {

		requests++;

		view
				.getPosition(
						user,
						viewIndex,
						nodeIdToOriginalMap[nodeIndex],
						req,
						function(existingNodePosition) {

							requests--;

							var currentNodeIndex = existingNodePosition[0];
							var node = graph.nodes[nodeOriginalToIdMap[currentNodeIndex]];
							var nodePosition = existingNodePosition[1];

							if (nodePosition != -1) {

								node.x = nodePosition[0];
								node.y = nodePosition[1];
								node.fixed = true;
							}

							if (requests == 0) {

								return callback(graph);
							}
						});
	}
};

var nodeIdToOriginalMap = {};
var nodeOriginalToIdMap = {};

var width = 2800;
var height = 1200;
var offset = 300;

function getX(order, levelSize) {

	var widthUnity = width / (1 + levelSize);
	return widthUnity * order - 3 / 2 * offset;
};

function getY(level) {

	return offset * level - 2 * offset;
};

function assignPositions(graph, viewIndex, user, req, callback) {

	// Compute infos

	var levelSizes = {};
	var levelOrders = {};

	for (nodeIndex in graph.nodes) {

		var node = graph.nodes[nodeIndex];

		if (levelSizes[node.level] == null) {

			levelSizes[node.level] = 1;
			levelOrders[node.level] = {};
			levelOrders[node.level][node.id] = 1;

		} else {

			levelSizes[node.level]++;
			levelOrders[node.level][node.id] = levelSizes[node.level];
		}

		nodeIdToOriginalMap[nodeIndex] = node.originalId;
		nodeOriginalToIdMap[node.originalId] = nodeIndex;
	}

	getFamilyIndexes(
			user,
			'any',
			req,
			function(familyIndexes) {

				var requests = 2;
				familyIndexes
						.forEach(function(familyIndex) {

							requests--;
							if (familyIndex != -1) {
								for (nodeIndex in graph.nodes) {

									var node = graph.nodes[nodeIndex];
									if (node.id == nodeOriginalToIdMap[familyIndex]) {

										var nodeLevel = node.level;
										var currentNodeOrder = levelOrders[nodeLevel][node.id];
										var desiredOrder = parseInt(levelSizes[nodeLevel] / 2) + 1;

										for (levelOrdersIndex in levelOrders[nodeLevel]) {

											var levelOrder = levelOrders[nodeLevel][levelOrdersIndex];

											if (levelOrder == desiredOrder) {

												levelOrders[nodeLevel][levelOrdersIndex] = currentNodeOrder;
												break;
											}
										}

										levelOrders[nodeLevel][node.id] = desiredOrder;

										break;
									}
								}
							}

							if (requests == 0) {

								assignXY(graph, levelSizes, levelOrders, user,
										viewIndex, req, callback);
							}
						});
			});
};

function assignXY(graph, levelSizes, levelOrders, user, viewIndex, req,
		callback) {

	for ( var level = 1; levelSizes[level] != null; level += 0.5) {

		for (nodeIndex in graph.nodes) {

			var node = graph.nodes[nodeIndex];

			if (node.level == level) {

				node.x = getX(levelOrders[level][node.id],
						levelSizes[node.level]);
				node.y = getY(node.level);
			}
		}
	}

	checkStoredPositions(user, viewIndex, graph, req, function(graph) {

		return callback(graph);
	});
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
		if (sources.indexOf(parseInt(node.id)) == -1) {

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

function getCurrentImage(node, req, callback) {

	var selectNode = 'SELECT * FROM nodes WHERE id = ' + node;

	req.getConnection(function(err, connection) {

		connection.query(selectNode, function(err, rows) {

			if (err) {

				console.log("Error Selecting : %s ", err);

			} else {

				if (rows.length > 0) {

					var node = rows[0];

					callback(node.img);
				}
			}
		});
	});
};

exports.updateProfileImage = function(req, res) {

	console.log("uploading profile image...");

	var node = req.param('node');

	console.log(req.files);

	getCurrentImage(node, req, function(previousImage) {

		updateNodeInDB(node, 'img',
				req.files['profile-img-upload']['originalname'], req, function(
						updated) {

					if (updated) {

						if (previousImage && previousImage != "") {

							fs.unlinkSync(__dirname + "/../docs/"
									+ previousImage);

							console.log("Previous image " + previousImage
									+ " removed");
						}

						res.end("Profile image uploaded.");
					}
				});
	});
};

exports.namesakes = function(req, res) {

	var name = req.query.name;
	var firstParentName = req.query.firstParentName;
	var secondParentName = req.query.secondParentName;
	var firstSiblingName = req.query.firstSiblingName;
	var secondSiblingName = req.query.secondSiblingName;
	var partnerName = req.query.partnerName;

	var namesakes = [];

	var selectNamesakes = "SELECT n1.label as username, n1.id as id, n1.img as img, n2.label as familyWithPartnerName, "
			+ "n3.label as partnerName, n4.label as originalFamilyName, n5.label as firstParentName, "
			+ "n6.label as secondParentName, n7.label as firstSiblingName, n8.label as secondSiblingName "
			+ "FROM nodes as n1 LEFT JOIN links as l1 ON n1.id = l1.source LEFT JOIN nodes as n2 ON l1.target = n2.id "
			+ "LEFT JOIN links as l2 ON n2.id = l2.target LEFT JOIN nodes as n3 ON l2.source = n3.id "
			+ "LEFT JOIN links as l3 ON n1.id = l3.target LEFT JOIN nodes as n4 ON l3.source = n4.id "
			+ "LEFT JOIN links as l4 ON n4.id = l4.target LEFT JOIN nodes as n5 ON l4.source = n5.id "
			+ "LEFT JOIN links as l5 ON n4.id = l5.target LEFT JOIN nodes as n6 ON l5.source = n6.id "
			+ "LEFT JOIN links as l6 ON n4.id = l6.source LEFT JOIN nodes as n7 ON l6.target = n7.id "
			+ "LEFT JOIN links as l7 ON n4.id = l7.source LEFT JOIN nodes as n8 ON l7.target = n8.id "
			+ "WHERE (n1.label != n3.label OR n3.label IS NULL) AND (n1.label != n7.label OR n7.label IS NULL) "
			+ "AND (n1.label != n8.label OR n8.label IS NULL) AND n5.label != n6.label "
			+ "AND n1.label = '" + name + "'";

	if (firstParentName) {

		selectNamesakes += " AND n5.label = '" + firstParentName + "' ";
	}

	if (secondParentName) {

		selectNamesakes += " AND n6.label = '" + secondParentName + "' ";
	}

	if (firstSiblingName) {

		selectNamesakes += " AND n7.label = '" + firstSiblingName + "'";
	}

	if (secondSiblingName) {

		selectNamesakes += " AND n8.label = '" + secondSiblingName + "'";
	}

	if (partnerName) {

		selectNamesakes += " AND n3.label = '" + partnerName + "'";
	}

	console.log(selectNamesakes);

	req.getConnection(function(err, connection) {

		connection.query(selectNamesakes, function(err, rows) {

			if (err) {

				console.log("Error selecting persons: %s ", err);

			} else {

				for (rowIndex in rows) {

					var row = rows[rowIndex];
					var user = {
						id : row.id,
						username : row.username,
						img : row.img
					};

					var namesakeIds = namesakes.map(function(user) {
						return user.id;
					});

					if (namesakeIds.indexOf(user.id) == -1) {

						namesakes.push(user);
					}
				}

				res.status(OK).json('namesakes', namesakes);
			}
		});
	});
};
