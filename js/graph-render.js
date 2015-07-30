var commons = window.commons || {};

var graphRender = function(scope, graph, configuration, server, svg) {

	if (!graph) {

		return;
	}

	var svgRoot = null;
	var container = null;
	var force = null;
	var nodeDrag = null;

	var defaultProfileImg = "default_profile.jpg";
	var defaultDocumentImg = "default_pdf.png";

	function init() {

		d3.select("svg").remove();

		var zoom = d3.behavior.zoom().scaleExtent([ .5, 4 ]).on("zoom", zoomed);

		svgRoot = d3.select("body").append("svg").attr("width",
				configuration.width).attr("height", configuration.height)
				.append("g").attr("transform", "translate(300, 100)scale(.4)")
				.attr("class", "myCursor-zoom-move");

		svgRoot.on("click", clickSvg);

		svgRoot.append("circle").attr("r", configuration.width * 10).attr(
				"class", "lens").style("pointer-events", "all").call(zoom);

		svgRoot.append("rect").attr("class", "ground").attr("width", 600).attr(
				"height", 200).attr("x", -700).attr("y", 1100).attr("cursor",
				"pointer").on("click", groundClicked);

		svgRoot.append("text").attr('class', "nodeLabel").attr("y", 1080).attr(
				"x", -650).text("Heritage");

		svgRoot.append("rect").attr("class", "ground").attr("width", 500).attr(
				"height", 200).attr("x", 1900).attr("y", 1100).attr("cursor",
				"pointer");

		svgRoot.append("text").attr('class', "nodeLabel").attr("y", 1080).attr(
				"x", 2220).text("Heritage");

		container = svgRoot.append("g");

		force = d3.layout.force().size(
				[ configuration.width, configuration.height ]).gravity(0)
				.charge(function(d) {
					if (d.person) {
						return -2000 / d.level;
					} else {
						return 0;
					}
				}).linkDistance(function(d) {
					if (!d.source.person && d.target.person) {
						return 900 * 1 / d.level;
					} else {
						return 300 * 1 / d.level;
					}
				}).on("tick", tick);

		nodeDrag = force.drag().origin(function(d) {
			return d;
		}).on("dragstart", nodeDragstarted).on("drag", nodeDragged).on(
				"dragend", nodeDragended);

		svg.link = container.selectAll(".link");
		svg.node = container.selectAll(".node");
	}

	var onPersonMenu = [
			{
				title : 'Add family as a parent',
				action : function(elm, d, i) {

					server.addNode('family', graph.user.id, d.originalId,
							'source').then(function() {

						scope.drawGraph(false, true);
					});
				}
			},
			{
				title : 'Add family as a child',
				action : function(elm, d, i) {

					server.addNode('family', graph.user.id, d.originalId,
							'target').then(function() {

						scope.drawGraph(false, true);
					});
				}
			},
			{
				title : 'Remove',
				action : function(elm, d, i) {

					server.removeNode(graph.user.id, d.originalId).then(
							function() {

								scope.drawGraph();
							});
				}
			} ];

	var onFamilyMenu = [
			{
				title : 'Add parent',
				action : function(elm, d, i) {

					server.addNode('person', graph.user.id, d.originalId,
							'target').then(function() {

						scope.drawGraph(false, true);
					});
				}
			},
			{
				title : 'Add child',
				action : function(elm, d, i) {

					server.addNode('person', graph.user.id, d.originalId,
							'source').then(function() {

						scope.drawGraph(false, true);
					});
				}
			},
			{
				title : 'Remove',
				action : function(elm, d, i) {

					server.removeNode(graph.user.id, d.originalId).then(
							function() {

								scope.drawGraph();
							});
				}
			} ];

	var onSelectedNodeMenu = [ {

		title : 'Add document',
		action : function(elm, d, i) {

			scope.nodeUser = {
				id : d.originalId,
				name : d.label
			};

			scope.taggableUsers = [];
			scope.taggedUsers = [];
			scope.taggedUsers.push(scope.nodeUser);

			scope.excludableUsers = [];
			scope.excludedUsers = [];

			for (nodeIndex in graph.nodes) {

				var node = graph.nodes[nodeIndex];
				var currentUser = {
					id : node.originalId,
					name : node.label
				};

				if (node.person && currentUser.id != scope.nodeUser.id) {

					scope.taggableUsers.push(currentUser);
					scope.excludableUsers.push(currentUser);
				}
			}

			scope.$apply();

			$('#addDocumentModal').modal('show');
		}
	} ];

	var onHeritageMenu = [ {
		title : 'Add document',
		action : function(elm, d, i) {

			var heritageNode = {
				id : -1,
				name : "Heritage"
			};

			scope.taggableUsers = [];
			scope.taggedUsers = [];
			scope.taggedUsers.push(heritageNode);

			scope.$apply();

			$('#addDocumentModal #tagged').hide();
			$('#addDocumentModal').modal('show');
		}
	} ];

	function makeEditable(d) {

		this
				.on("mouseover", function() {
					d3.select(this).style("fill", "red");
				})
				.on("mouseout", function() {
					d3.select(this).style("fill", null);
				})
				.on(
						"click",
						function(d) {

							if (d.label.toUpperCase() == graph.user.label
									.toUpperCase()) {

								alert("If you want to change your name go to the setting menu");

							} else {

								var result = prompt('Enter a new name', d.name);

								if (result) {

									var node = d3
											.select(this.parentNode.parentNode);
									var selection = node
											.selectAll(".nodeLabel");

									var label = selection[0][0];
									label.textContent = result;

									d.label = result;
									var selection = d3.select(this);
									var label = selection[0][0];
									label.textContent = result;

									server.updateNode(d.originalId,
											graph.user.id, 'label', result);
								}

							}

							d3.event.stopPropagation();
						});
	}

	function getMenuWithBlacklistFeature(menu, isBlacklisted, isBlacklisting) {

		if (!isBlacklisted && !isBlacklisting) {

			var addToBlacklistFeature = {
				title : "Add to blacklist",
				action : function(elm, d, i) {

					server.addToBlacklist(graph.user.id, d.originalId, -1)
							.then(function() {

								scope.drawGraph();
							});
				}
			};

			menu.splice(2, 0, addToBlacklistFeature);

		} else if (!isBlacklisting) {

			var removeFromBlacklistFeature = {
				title : "Remove from blacklist",
				action : function(elm, d, i) {

					server.removeFromBlacklist(graph.user.id, d.originalId, -1)
							.then(function() {

								scope.drawGraph();
							});
				}
			};

			menu.splice(2, 0, removeFromBlacklistFeature);

		} else {

			var askToBeRemovedFromBlacklistFeature = {
				title : "Ask to be removed from blacklist",
				action : function(elm, d, i) {

					// TODO
				}
			};

			menu.splice(2, 0, askToBeRemovedFromBlacklistFeature);
		}

		return menu;
	}

	function drawTree(user, view) {

		init();

		if (view.id != 4) {

			svgRoot.on('contextmenu', null);
		}

		force.nodes(graph.nodes).links(graph.links).start();

		svg.link = svg.link.data(graph.links).enter().append("path");

		svg.link.each(function(d) {

			currentLink = d3.select(this);
			currentLink.attr("class", "link").attr("stroke-width", function(d) {

				return 30 / d.level + "px";
			});
		});

		svg.node = svg.node.data(graph.nodes).enter().append("g");

		svg.node
				.each(function(d) {

					currentNode = d3.select(this).attr("id", d.originalId)
							.attr("x", d.x).attr("y", d.y).attr("label",
									d.label).attr("level", d.level);

					currentNode.call(nodeDrag);

					if (d.person) {

						currentNode.on("click", clickNode);

						var isBlacklisted = scope.graphData.blacklist.blacklistedNodes
								.indexOf(d.originalId) > -1;

						var isBlacklisting = scope.graphData.blacklist.blacklistingUsers
								.indexOf(d.originalId) > -1;

						if (view.id == 4) {

							var onPersonMenuCopy = jQuery.extend(true, [],
									onPersonMenu);

							var newMenu = getMenuWithBlacklistFeature(
									onPersonMenuCopy, isBlacklisted,
									isBlacklisting);

							currentNode.on('contextmenu', d3
									.contextMenu(newMenu));
						}

						if (isBlacklisted || isBlacklisting) {

							currentNode.attr("class", "blacklisted");

							svg.link
									.each(function(l) {

										currentLink = d3.select(this);
										if (l.source.originalId == d.originalId
												|| l.target.originalId == d.originalId) {

											currentLink.attr("class",
													"link blacklisted");
										}
									});
						}

						var defs = currentNode.append('svgRoot:defs');

						clipPath = defs.append("svgRoot:clipPath").attr("id",
								"clipPath_" + d.originalId);

						var circleSize = commons.getCircleSize(d.label,
								d.level, graph.user.label);

						var nodeClass = commons.getNodeClass(d,
								graph.user.label);

						clipPath.append("circle").attr("class", nodeClass)
								.attr("r", circleSize).attr("id",
										"circle_" + d.originalId);

						currentNode.append("svgRoot:use").attr("xlink:href",
								"#" + "circle_" + d.originalId);

						currentNode.append("svgRoot:image").attr("class",
								"profile-image").attr(
								"xlink:href",
								function(d) {
									return d.img == "" ? server
											.getFilePath(defaultProfileImg)
											: server.getFilePath(d.img);

								}).attr("width", circleSize * 2).attr("height",
								circleSize * 2).attr("x", 0).attr("y", 0).attr(
								"clip-path",
								"url(#clipPath_" + d.originalId + ")");

						currentNode.append("text").attr(
								"class",
								function(d) {
									if (d.label.toUpperCase() == user.label
											.toUpperCase()) {
										return "my-nodeLabel";
									} else {
										return "nodeLabel";
									}
								}).attr("dy", "1.5em").text(function(d) {
							return d.label;
						}).call(makeEditable);

						if (d.originalId == svg.selectedNodeId) {

							selectNode(d);

						} else if (scope.graphData.selectedDocument) {

							appendSelectedDocument(
									scope.graphData.selectedDocument.url,
									scope.graphData.selectedDocument.title,
									scope.graphData.selectedDocument.date);
						}
					} else {

						if (view.id == 4) {

							currentNode.on('contextmenu', d3
									.contextMenu(onFamilyMenu));
						}

						currentNode.append("ellipse").attr("rx", function(d) {

							return 100 / d.level;
						}).attr("ry", function(d) {

							return 50 / d.level;
						}).attr("fill", "brown").attr("class", "myCursor-move");
					}
				});

		svg.streamNode = svgRoot.append("g").attr("cursor", "auto");

		svg.streamNode.append("circle").attr("r", 30).attr("cx",
				configuration.streamX - 67).attr("cy",
				configuration.streamY + 50).attr("class", "navigator");

		svg.streamNode.append("text").attr("class", "navigator-arrow").attr(
				"x", configuration.streamX - 88).attr("y",
				configuration.streamY + 65).text("<").attr("cursor", "pointer")
				.on("click", backMain);

		svg.streamNode.append("circle").attr("r", 30).attr("cx",
				configuration.streamX + configuration.streamWidth + 66).attr(
				"cy", configuration.streamY + 45).attr("class", "navigator");

		svg.streamNode.append("text").attr("class", "navigator-arrow").attr(
				"x", configuration.streamX + configuration.streamWidth + 50)
				.attr("y", configuration.streamY + 60).text(">").attr("cursor",
						"pointer").on("click", forwardMain);

		svg.streamNode.append("rect").attr("width", configuration.streamWidth)
				.attr("height", configuration.streamHeight).attr("x",
						configuration.streamX).attr("y", configuration.streamY)
				.attr("rx", 20).attr("ry", 20).attr("class", "data-stream");

		fillStream();
	}

	function fillStream() {

		var documentsSize = graph.documents.length;

		if (documentsSize > 0) {

			currentPage = Math.floor(documentsSize
					/ (configuration.docRowSize + 1));
			maxPage = currentPage;
			populateThumbnails(currentPage, true);
		}
	}

	drawTree(graph.user, graph.view);

	var diagonal = d3.svg.diagonal().source(function(d) {

		return {
			"x" : d.source.y,
			"y" : d.source.x
		};

	}).target(function(d) {

		return {
			"x" : d.target.y,
			"y" : d.target.x
		};

	}).projection(function(d) {

		return [ d.y, d.x ];
	});

	function tick() {

		svg.link.attr("d", diagonal);

		svg.node.selectAll(".node").attr("cx", function(d) {
			return d.x;
		}).attr("cy", function(d) {
			return d.y;
		});

		svg.node.selectAll(".nodeLabel").attr("x", function(d) {
			return d.x - 25;
		}).attr(
				"y",
				function(d) {
					return d.y
							+ commons.getCircleSize(d.label, d.level,
									graph.user.label);
				});

		svg.node.selectAll(".my-nodeLabel").attr("x", function(d) {
			return d.x - 45;
		}).attr(
				"y",
				function(d) {
					return d.y
							+ commons.getCircleSize(d.label, d.level,
									graph.user.label);
				});

		svg.node.selectAll(".profile-image").attr(
				"x",
				function(d) {

					return d.x
							- commons.getCircleSize(d.label, d.level,
									graph.user.label);

				}).attr(
				"y",
				function(d) {

					return d.y
							- commons.getCircleSize(d.label, d.level,
									graph.user.label);
				});

		svg.node.selectAll("ellipse").attr("cx", function(d) {

			return d.x;
		}).attr("cy", function(d) {
			return d.y;
		});
	}

	$('#profile-img-upload').change(
			function() {

				$('#uploadProfileImageForm').attr(
						'action',
						server.getServerUrl() + "/" + graph.user.id
								+ '/graph/profileImage/' + svg.nodeIdToUpdate);
				$('#uploadProfileImageForm').submit();

				var filePath = $(this).val();
				svg.fileName = filePath
						.substring(filePath.lastIndexOf("\\") + 1);

				setTimeout(profileImageUploadContinueExecution, 500);
			});

	function profileImageUploadContinueExecution() {

		svgRoot.selectAll(".profile-image").filter(function(d) {

			return d.originalId == svg.nodeIdToUpdate;

		}).attr("xlink:href", server.getFilePath(svg.fileName));

		svgRoot.selectAll(".profile-image--selected").attr("xlink:href",
				server.getFilePath(svg.fileName));
	}

	function clickSvg(d) {

		if (!d3.event || d3.event.defaultPrevented) {
			return;
		}

		scope.graphData.selectedDocument = null;
		svg.selectedNodeId = null;

		var sel = svgRoot.selectAll(".selection");
		sel.remove();

		var actions = svgRoot.selectAll(".action");
		actions.remove();

		svgRoot.selectAll(".tree-leaf").style("pointer-events", "all");
	}

	function clickNode(d) {

		if (!d3.event || d3.event.defaultPrevented) {
			return;
		}

		if (scope.graphData.blacklist.blacklistingUsers.indexOf(d.originalId) == -1
				&& scope.graphData.blacklist.blacklistedNodes
						.indexOf(d.originalId) == -1) {

			svg.selectedNodeId = d.originalId;
			selectNode(d);
		}

		d3.event.stopPropagation();
	}

	function profileNodeClicked(d) {

		d3.event.stopPropagation();
	}

	function profileMouseovered(d) {

		var selection = d3.select(this);
		selection.moveToFront();

		var container = selection[0][0];

		rect = container.children[0];

		rect.setAttribute("width", 660);
		rect.setAttribute("height", 660);

		rect.x.baseVal.value -= 170;
		rect.y.baseVal.value -= 150;

		image = container.children[1];

		image.setAttribute("width", 600);
		image.setAttribute("height", 600);

		image.x.baseVal.value -= 150;
		image.y.baseVal.value -= 130;
	}

	function profileMouseouted(d) {

		var selection = d3.select(this);

		var container = selection[0][0];

		rect = container.children[0];

		rect.setAttribute("width", 220);
		rect.setAttribute("height", 220);

		rect.x.baseVal.value += 170;
		rect.y.baseVal.value += 150;

		image = container.children[1];

		image.setAttribute("width", 200);
		image.setAttribute("height", 200);

		image.x.baseVal.value += 150;
		image.y.baseVal.value += 130;
	}

	function profileImageClicked(d) {

		svg.nodeIdToUpdate = d.originalId;

		$('#profile-img-upload').val(null);
		$('#profile-img-upload').click();
		d3.event.stopPropagation();
	}

	function selectNode(d) {

		svg.selectedNode = container.append("g").data([ d ]).attr("class",
				"selection").style("pointer-events", "click");

		configuration.centerX = configuration.width / 10;
		configuration.centerY = configuration.height / 1.7;
		configuration.maxRowSize = 10;

		svg.selectedNode.append("circle").attr('r', 615).attr("cx",
				configuration.centerX).attr("cy", configuration.centerY).attr(
				'class', "node--selected").on("click", profileNodeClicked)
				.attr("cursor", "auto").on(
						'contextmenu',
						d3.contextMenu(onSelectedNodeMenu, function() {

							svg.uploadedDocumentPosition = [ this.event.x,
									this.event.y ];
						}));

		var profileContainer = svg.selectedNode.append("g").on("mouseover",
				profileMouseovered).on("mouseout", profileMouseouted).on(
				"click", profileNodeClicked);

		profileContainer.append("rect").attr("width", 220).attr("height", 220)
				.attr('class', "profile-frame").attr("x",
						configuration.centerX - 155).attr("y", -10);

		var imagePath = d.img == "" ? server.getFilePath(defaultProfileImg)
				: server.getFilePath(d.img);

		profileContainer.append("image").attr("width", 200).attr("height", 200)
				.attr('class', "profile-image--selected").attr("x",
						configuration.centerX - 145).attr("y", 0).attr(
						"xlink:href", imagePath).on("click",
						profileImageClicked).attr("cursor", "auto").append(
						"title").text("Click to upload a new profile image");

		svg.selectedNode.append("text").attr('class', "label--selected").attr(
				"y", -50).attr("x", configuration.centerX - 230).text(d.label)
				.call(makeEditable);

		placeDocuments(d.originalId, "tagged", svg.selectedNode,
				configuration.centerX, configuration.centerY,
				configuration.maxRowSize);
	}

	function backMain() {

		if (currentPage > 0) {

			currentPage--;
			populateThumbnails(currentPage, true);
		}

		d3.event.stopPropagation();
	}

	function forwardMain() {

		if (currentPage < maxPage) {

			currentPage++;
			populateThumbnails(currentPage, false);
		}

		d3.event.stopPropagation();
	}

	function groundClicked(d) {

		var selectedNode = d3.select(this.parentNode).moveToFront().append("g")
				.attr("class", "selection").style("pointer-events", "click");

		selectedNode.append("rect").attr("class", "ground--selected").attr(
				"width", 3100).attr("height", 350).attr("x", -700).attr("y",
				1050).attr("cursor", "auto").on(
				'contextmenu',
				d3.contextMenu(onHeritageMenu, function() {

					svg.uploadedDocumentPosition = [ this.event.x + 800,
							this.event.y + 800 ];
				}));

		selectedNode.append("text").attr('class', "label--selected").attr("y",
				1130).attr("x", -650).text("Heritage");

		svg.selectedNodeId = -1;

		var centerX = -200;
		var centerY = 1100;
		var maxRowSize = 40;

		placeDocuments(-1, "tagged", selectedNode, centerX, centerY, maxRowSize);

		d3.event.stopPropagation();
	}

	function zoomed() {

		container.attr("transform", "translate(" + d3.event.translate
				+ ")scale(" + d3.event.scale + ")");
	}

	function nodeDragstarted(d) {

		d3.select(this).classed("fixed", d.fixed = true);

		if (!configuration.selectedNodeId) {
			d3.event.sourceEvent.stopPropagation();
			d3.select(this).classed("dragging", true);
		}

		var actions = svgRoot.selectAll(".action");
		actions.remove();
	}

	function nodeDragged(d) {

		if (!configuration.selectedNodeId) {
			d3.select(this).attr("x", d.x = d3.event.x).attr("y",
					d.y = d3.event.y);
		}
	}

	function nodeDragended(d) {

		if (!svg.selectedNodeId) {
			d3.select(this).classed("dragging", false);

			server.updateNodePosition(d.originalId, graph.user.id,
					graph.view.id, d.x, d.y);
		}
	}

	// Documents

	d3.selection.prototype.moveToFront = function() {

		return this.each(function() {

			this.parentNode.appendChild(this);
		});
	};

	function populateUsers(newUsers, actualUsers, potentialUsers) {

		for ( var newUsersIndex in newUsers) {

			newUser = newUsers[newUsersIndex];

			if (newUser.id != -1) {

				actualUsers.push({
					id : newUser.id,
					name : newUser.label
				});
			}
		}

		for (nodeIndex in graph.nodes) {

			var node = graph.nodes[nodeIndex];
			var currentUser = {
				id : node.originalId,
				name : node.label
			};

			var actualUsersIds = actualUsers.map(function(user) {
				return user.id;
			});

			if (node.person && currentUser.id != scope.owner.id
					&& actualUsersIds.indexOf(currentUser.id) == -1) {

				potentialUsers.push(currentUser);
			}
		}
	}

	var onDocumentMenu = [
			{
				title : 'Edit',
				action : function(elm, d, i) {

					server.getDocument(elm.id).then(
							function(data) {

								if (data.document != -1) {

									scope.owner = {
										id : d.owner
									};

									scope.taggableUsers = [];
									scope.taggedUsers = [];

									scope.excludableUsers = [];
									scope.excludedUsers = [];

									populateUsers(data.document.tagged,
											scope.taggedUsers,
											scope.taggableUsers);

									populateUsers(data.document.excluded,
											scope.excludedUsers,
											scope.excludableUsers);

									if (d) {

										scope.editNodeId = d.originalId;
									}

									scope.editDocId = data.document.id;
									scope.editFileName = data.document.file;
									scope.editTitle = data.document.title;

									if (data.document.date.lastIndexOf('0000',
											0) === 0) {

										scope.editDate = '01/01/2015';

									} else {

										scope.editDate = data.document.date;
									}

									$('#editDocumentModal').modal('show');
								}
							});

				}
			},
			{
				title : 'Remove',
				action : function(elm, d, i) {

					server
							.removeDocument(elm.id)
							.then(
									function() {

										server
												.deleteNotifications(
														'document', elm.id)
												.then(
														function() {

															server
																	.deleteEvents(
																			'document',
																			elm.id)
																	.then(
																			function() {

																				scope
																						.drawGraph(
																								true,
																								false);
																			});
														});
									});
				}
			} ];

	function populateThumbnails(currentPage, back) {

		var minIndex = currentPage * configuration.docRowSize;

		for (docIndex in graph.documents) {

			var doc = graph.documents[docIndex];
			doc.index = parseInt(docIndex);
		}

		var currentDocuments = graph.documents.filter(function(d) {

			return d.index >= minIndex
					&& d.index < minIndex + configuration.docRowSize;
		});

		var doc = svg.streamNode.selectAll(".doc");
		var sel = doc.data(currentDocuments, function(d) {
			return d.index;
		});

		var oldTarget = back ? configuration.streamWidth
				: configuration.streamX;
		var newTarget = back ? configuration.streamX
				: configuration.streamWidth;

		var newDelay = function(d) {
			return back ? (currentDocuments.length - (d.index - minIndex))
					* (duration / 15) : (d.index - minIndex) * (duration / 10);
		};
		var oldDelay = function(d) {
			return back ? (currentDocuments.length - (d.index - minIndex))
					* (duration / 15) : (d.index - minIndex) * (duration / 10);
		};

		var duration = 300;

		sel.enter().append("image").attr("class", "doc").attr(
				"xlink:href",
				function(d) {

					return d.file.substr(-4) === ".pdf" ? server
							.getFilePath(defaultDocumentImg) : server
							.getFilePath(d.file);

				}).attr("width", 100)
				.attr("height", configuration.streamHeight).attr("y",
						configuration.streamY).attr("index", function(d) {
					return d.index;
				}).attr("id", function(d) {
					return d.id;
				}).attr("title", function(d) {
					return d.title;
				}).attr("url", function(d) {
					return server.getFilePath(d.file);
				}).attr("date", function(d) {

					return commons.getDate(d.date);

				}).on("mouseover", thumbnailMouseovered).on("mouseout",
						thumbnailMouseouted).on("click", thumbnailClicked)
				.attr("cursor", "pointer").attr("x", newTarget).transition()
				.duration(duration).delay(newDelay).ease("linear").attr(
						"x",
						function(d) {
							return configuration.streamX + (d.index - minIndex)
									* 100;
						});

		sel.exit().transition().duration(duration).delay(oldDelay).ease(
				"linear").attr("x", oldTarget).remove();
	}

	function appendSelectedDocument(documentUrl, documentTitle, documentDate) {

		container.moveToFront();

		if (documentUrl.substr(-4) === ".pdf") {

			window.open("../" + documentUrl.substr(1), '_blank');

		} else {

			docContainer = svgRoot.append("g").attr("class", "selection");

			docContainer.append("rect").attr("class", "frame").attr("width",
					1205).attr("height", 1014).attr("xlink:href", documentUrl)
					.attr("x", 997.5).attr("y", -182).on("click",
							zoomedDocClicked).attr("cursor", "auto");

			docContainer.append("image").attr("class", "zoomedDoc")
					.moveToFront().attr("width", 1200).attr("height", 1010)
					.attr("xlink:href", documentUrl).attr("x", 1000).attr("y",
							-180).on("click", zoomedDocClicked).attr("cursor",
							"auto");

			docContainer.append("text").attr("class", "docText")
					.attr("x", 1800).attr("y", 900).text(documentTitle);

			docContainer.append("text").attr("class", "docText-small").attr(
					"x", 1800).attr("y", 1000)
					.text("(on " + documentDate + ")");

			docContainer.append("text").attr("class", "closeDoc").attr("x",
					2125).attr("y", -220).text("[close]").attr("cursor",
					"pointer").on("click", closeDocClicked);
		}
	}

	function docClicked(d) {

		if (d3.event.defaultPrevented) {
			return;
		}

		svgRoot.selectAll(".docText").remove();
		svgRoot.selectAll(".docText-small").remove();
		svgRoot.selectAll(".zoomedDoc").remove();

		var selection = d3.select(this);
		var doc = selection[0][0];

		appendSelectedDocument(doc.getAttribute("url"), doc
				.getAttribute("title"), doc.getAttribute("date"));

		d3.event.stopPropagation();
	}

	function closeDocClicked() {

		scope.graphData.selectedDocument = null;

		svgRoot.selectAll(".zoomedDoc").remove();
		svgRoot.selectAll(".frame").remove();
		svgRoot.selectAll(".docText").remove();
		svgRoot.selectAll(".docText-small").remove();
		svgRoot.selectAll(".closeDoc").remove();

		d3.event.stopPropagation();
	}

	function zoomedDocClicked(d) {

		d3.event.stopPropagation();
	}

	var docDrag = d3.behavior.drag().on("dragstart", docDragstarted).on("drag",
			docDragged).on("dragend", docDragended);

	function placeDocuments(nodeId, relationType, selectedNode, centerX,
			centerY, maxRowSize) {

		server.getNodeDocuments(nodeId, relationType).then(
				function(data) {

					var documents = data.documents;

					var offset = 0;

					for (docIndex in documents) {

						var document = documents[docIndex];

						offset += 100;

						if (offset >= 100 * maxRowSize) {

							offset = 0;
						}

						document.selectedNode = nodeId;

						if (!document.position) {

							document.position = {};
							document.position.x = centerX / 2 - 300 + offset;
							document.position.y = centerY + 100
									* Math.floor(docIndex / maxRowSize);
						}
					}

					scope.graphData.selectedNode = {};
					scope.graphData.selectedNode.id = nodeId;
					scope.graphData.selectedNode.documents = data.documents;

					var container = selectedNode.append("g").attr("class",
							"docContainer");

					var sel = container.selectAll("image").data(documents);

					sel.enter().append("image").attr("width", 100).attr("id",
							function(d) {
								return d.id;
							}).attr("title", function(d) {

						return d.title;

					}).attr("url", function(d) {

						return server.getFilePath(d.file);

					}).attr("date", function(d) {

						return commons.getDate(d.date);

					}).attr("x", function(d) {

						return d.position.x;
					}).attr("y", function(d) {

						return d.position.y;
					}).attr("height", 80).attr(
							"xlink:href",
							function(d) {

								return d.file.substr(-4) === ".pdf" ? server
										.getFilePath(defaultDocumentImg)
										: server.getFilePath(d.file);

							}).attr("class", function() {

						return "myCursor-pointer-move doc";
					}).on("click", docClicked).on("mouseover",
							thumbnailMouseovered).on("mouseout",
							thumbnailMouseouted).call(docDrag).on(
							'contextmenu', d3.contextMenu(onDocumentMenu));
				});
	}

	function thumbnailMouseovered(d) {

		var selection = d3.select(this);
		selection.moveToFront();

		var doc = selection[0][0];

		var parent = d3.select(this.parentNode);

		doc.setAttribute("width", 200);
		doc.setAttribute("height", 200);
		doc.x.baseVal.value -= 50;
		doc.y.baseVal.value -= 50;

		svg.node[0].forEach(function(n) {

			if (d.taggedNodes) {

				for (nodeIndex in d.taggedNodes) {

					var taggedNode = d.taggedNodes[nodeIndex];

					if (taggedNode == n.id) {

						var currentNode = d3.select(n);
						var circleSize = commons.getCircleSize(n
								.getAttribute("label"),
								n.getAttribute("level"), graph.user.label);

						currentNode.append("circle")
								.attr("r", circleSize + 100).attr("class",
										"tagSelection").attr("cx",
										n.getAttribute("x")).attr("cy",
										n.getAttribute("y"));
					}
				}
			}
		});

		if (!d.selectedNode || doc.getAttribute("url").substr(-4) == ".pdf") {

			parent.append("text").attr("class", "thumbnailText").attr("x",
					doc.getAttribute("x")).attr("y", doc.y.baseVal.value - 20)
					.text(d.title);

			if (!d.selectedNode) {
				parent.append("text").attr("class", "thumbnailText").attr("x",
						doc.getAttribute("x")).attr("y",
						doc.y.baseVal.value + 235).text(
						doc.getAttribute("date"));
			}
		}
	}

	function thumbnailMouseouted(d) {

		svgRoot.selectAll(".thumbnailText").remove();
		svgRoot.selectAll(".thumbnail-frame").remove();

		var selection = d3.select(this);
		var doc = selection[0][0];

		doc.setAttribute("width", 100);
		doc.setAttribute("height", 100);

		doc.x.baseVal.value += 50;
		doc.y.baseVal.value += 50;

		svgRoot.selectAll(".tagSelection").remove();
	}

	function thumbnailClicked(d) {

		svgRoot.selectAll(".docText").remove();
		svgRoot.selectAll(".docText-small").remove();
		svgRoot.selectAll(".zoomedDoc").remove();
		svgRoot.selectAll(".frame").remove();

		var selection = d3.select(this);
		var doc = selection[0][0];

		appendSelectedDocument(doc.getAttribute("url"), doc
				.getAttribute("title"), doc.getAttribute("date"));

		d3.event.stopPropagation();
	}

	function docDragstarted(d) {

		d3.event.sourceEvent.stopPropagation();

		svgRoot.selectAll(".thumbnailText").remove();
		d3.select(this).classed("dragging", true);
	}

	function docDragged(d) {

		var sel = d3.select(this);
		sel.attr("x", d3.event.x - parseInt(sel.attr("width")) / 2).attr("y",
				d3.event.y - parseInt(sel.attr("height")) / 2);
	}

	function docDragended(d) {

		var sel = d3.select(this);
		sel.classed("dragging", false);

		var document = sel[0][0];
		var x = document.getAttribute("x");
		var y = document.getAttribute("y");

		server.updateDocumentPosition(d.id, scope.graphData.selectedNode.id, x,
				y);
	}
};