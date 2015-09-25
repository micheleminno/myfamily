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

		var groundContainer = svgRoot.append("g");

		groundContainer.append("rect").attr("class", "ground").attr("width",
				600).attr("height", 200).attr("x", -700).attr("y", 1100).attr(
				"cursor", "pointer").on("click", groundClicked);

		groundContainer.append("text").attr('class', "nodeLabel").attr("y",
				1080).attr("x", -650).text("Heritage");

		groundContainer.append("rect").attr("class", "ground").attr("width",
				500).attr("height", 200).attr("x", 1900).attr("y", 1100).attr(
				"cursor", "pointer").on("click", groundClicked);

		groundContainer.append("text").attr('class', "nodeLabel").attr("y",
				1080).attr("x", 2220).text("Heritage");

		container = svgRoot.append("g");

		force = d3.layout.force().size(
				[ configuration.width, configuration.height ]).gravity(
				function(d) {

					return 0.05;
				}).charge(function(d) {
			if (d.person) {
				return -500 / d.level;
			} else {
				return 0;
			}
		}).linkDistance(function(d) {
			if (!d.source.person && d.target.person) {
				return 80 * d.level;
			} else {
				return 40 * d.level;
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
				title : 'Add other',
				action : function(elm, d, i) {

					server.addNode('person', graph.user.id, d.originalId,
							'source', false).then(function() {

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

			if (d.keywords) {
				scope.keywords = d.keywords;
			} else {
				scope.keywords = [];
			}

			server.getAllKeywords().then(function(data) {

				scope.availableKeywords = data;
			});

			scope.taggableUsers = [];
			scope.taggedUsers = [];
			scope.taggedUsers.push(scope.nodeUser);

			scope.excludableUsers = [];
			scope.excludedUsers = [];

			scope.inHeritage = false;

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

			scope.inHeritage = true;

			$('#addDocumentModal #tagged').hide();
			$('#addDocumentModal').modal('show');
		}
	} ];

	function editName(d) {

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

	function editEmailAddress(d) {

		this.on("mouseover", function() {
			d3.select(this).style("fill", "red");
		}).on("mouseout", function() {
			d3.select(this).style("fill", null);
		}).on(
				"click",
				function(d) {

					var result = prompt('Enter a new email address', d.name);

					if (result) {

						var text = d3.select(this)[0][0];
						text.textContent = result;

						server.updateNode(d.originalId, graph.user.id, 'email',
								result);
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

		svg.streamNode = svgRoot.append("g").attr("cursor", "auto");

		svg.link = svg.link.data(graph.links).enter().append("path");

		svg.link.each(function(d) {

			currentLink = d3.select(this);
			currentLink.attr("class", function(d) {

				return d.visible ? "link" : "invisibleLink";

			}).attr("stroke-width", function(d) {

				return 4 * d.level + "px";
			});
		});

		svg.node = svg.node.data(graph.nodes).enter().append("g");

		svg.node
				.each(function(d) {

					currentNode = d3.select(this).attr("id", d.originalId)
							.attr("x", d.x).attr("y", d.y).attr("label",
									d.label).attr("level", d.level).attr(
									"person", d.person);

					currentNode.call(nodeDrag);

					currentNode.on("click", clickNode);

					if (graph.selectedNode
							&& d.originalId == graph.selectedNode.id) {

						selectNode(d);
					}

					if (d.person) {

						var isBlacklisted = graph.blacklist.blacklistedNodes
								.indexOf(d.originalId) > -1;

						var isBlacklisting = graph.blacklist.blacklistingUsers
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

							currentNode.on("click", null);
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
						}).call(editName);

					} else if (d.originalId != -1) {

						if (view.id == 4) {

							currentNode.on('contextmenu', d3
									.contextMenu(onFamilyMenu));
						}

						currentNode.append("ellipse").attr("rx", function(d) {

							return 15 * d.level;
						}).attr("ry", function(d) {

							return 7 * d.level;
						}).attr("class", "familyNode");
					}
				});

		if (graph.selectedNode && graph.selectedNode.id == -1) {

			selectGround();
		}

		if (graph.selectedDocument) {

			appendSelectedDocument(graph.selectedDocument);
		}

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

		graph.selectedDocument = null;
		graph.selectedNode = {};
		svg.selectedNodeId = null;
		scope.searchName = "";

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

		graph.selectedNode = {};
		graph.selectedNode.id = d.originalId;
		graph.selectedNode.type = d.person ? 'person' : 'family';

		graph.selectedNode.showInfo = false;
		scope.searchName = "";
		scope.selectedEventType = "";
		scope.nodeEventDate = "";

		if (graph.blacklist.blacklistingUsers.indexOf(d.originalId) == -1
				&& graph.blacklist.blacklistedNodes.indexOf(d.originalId) == -1) {

			svg.selectedNodeId = d.originalId;
			selectNode(d);
		}

		d3.event.stopPropagation();
	}

	function profileNodeClicked(d) {

		$(".d3-context-menu").css("display", "none");

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

	function addInfo(d) {

		$('#addInfoModal').modal('show');

		d3.event.stopPropagation();
	}

	function removeInfo(id) {

		server.removeNodeEvent(id).then(function(removed) {

			if (removed) {

				var eventsIds = graph.selectedNode.events.map(function(event) {
					return event.id;
				});

				var eventIndex = eventsIds.indexOf(id);

				if (eventIndex > -1) {

					graph.selectedNode.events.splice(eventIndex, 1);
				}
			}
		});

		d3.event.stopPropagation();
	}

	function showInfo(d) {

		if (d3.event) {

			graph.selectedNode.showInfo = !graph.selectedNode.showInfo;
		}

		if (graph.selectedNode.showInfo) {

			svgRoot.selectAll(".infoButton").attr("class", "firedInfoButton");

			var infoContainer = svg.selectedNode.append("g").attr("class",
					"infoSelection").on("click", profileNodeClicked);

			infoContainer.append("rect").attr("class", "infoBox").attr("width",
					1000).attr("height", 800).attr("x",
					configuration.centerX + 900);

			infoContainer.append("text").text("Info").attr("class", "infoText")
					.attr("cursor", "auto").attr("x",
							configuration.centerX + 925).attr("y", 70);

			infoContainer.append("text").text(d.email)
					.attr("class", "infoText").attr("cursor", "auto").attr("x",
							configuration.centerX + 1425).attr("y", 70).attr(
							"cursor", "pointer").call(editEmailAddress);

			infoContainer.append("circle").attr('class', "infoButton").attr(
					"r", 30).attr("cy", 60).attr("cx",
					configuration.centerX + 1050).attr("cursor", "pointer").on(
					"click", addInfo);

			infoContainer.append("text").attr('class', "info").text("+").attr(
					"y", 70).attr("x", configuration.centerX + 1038).attr(
					"cursor", "pointer").on("click", addInfo);

			server
					.getNodeEvents(d.originalId)
					.then(
							function(events) {

								graph.selectedNode.events = events;

								var offset = 150;

								for (eventIndex in events) {

									var event = events[eventIndex];

									infoContainer.append("rect").attr("width",
											700).attr("height", 100).attr(
											'class', "info-frame").attr("x",
											configuration.centerX + 975).attr(
											"y", offset);

									infoContainer
											.append("text")
											.attr("class", "info")
											.attr("cursor", "auto")
											.text(
													event.type
															+ ": "
															+ commons
																	.getDate(event.date))
											.attr("y", 50 + offset)
											.attr(
													"x",
													configuration.centerX + 1000);

									infoContainer
											.append("circle")
											.attr("class", "infoButton")
											.attr("r", 20)
											.attr("cy", 40 + offset)
											.attr(
													"cx",
													configuration.centerX + 1600)
											.attr("cursor", "pointer").on(
													"click", addInfo);

									infoContainer
											.append("text")
											.text("x")
											.attr("fill", "white")
											.attr("font-size", "25px")
											.attr("y", 48 + offset)
											.attr(
													"x",
													configuration.centerX + 1593)
											.attr("cursor", "pointer").on(
													"click", function() {

														removeInfo(event.id);
													});

									offset += 140;
								}

							});

		} else {

			svgRoot.selectAll(".firedInfoButton").attr("class", "infoButton");
			svgRoot.selectAll(".infoSelection").remove();
		}

		if (d3.event) {

			d3.event.stopPropagation();
		}
	}

	function selectFamily(selectedNode, d) {

		var parents = [];

		graph.links.forEach(function(link) {

			if (link.target.id == d.id) {

				parents.push(link.source.label);
			}
		});

		configuration.centerX = configuration.width / 10;
		configuration.centerY = configuration.height / 1.7;

		selectedNode.append("ellipse").attr("class", "family--selected").attr(
				"cx", configuration.centerX).attr("cy", configuration.centerY)
				.attr("rx", 800).attr("ry", 400).attr("fill", "darkred");

		selectedNode.append("text").attr('class', "label--family").attr("y",
				150).attr("x", configuration.centerX - 475).text(
				parents.join(" and "));

		selectedNode.append("circle").attr('class', "infoButton").attr("r", 30)
				.attr("cy", 350).attr("cx", configuration.centerX + 725).attr(
						"cursor", "pointer").on("click", showInfo);

		selectedNode.append("text").attr('class', "info").text("i").attr("y",
				359).attr("x", configuration.centerX + 718).attr("cursor",
				"pointer").on("click", showInfo);

		if (graph.selectedNode.showInfo) {

			showInfo({
				originalId : graph.selectedNode.id
			});
		}
	}

	function selectPerson(selectedNode, d) {

		configuration.centerX = configuration.width / 10;
		configuration.centerY = configuration.height / 1.7;
		configuration.maxRowSize = 10;

		selectedNode.append("circle").attr('r', 615).attr("cx",
				configuration.centerX).attr("cy", configuration.centerY).attr(
				'class', "person--selected").on("click", profileNodeClicked)
				.attr("cursor", "auto").on(
						'contextmenu',
						d3.contextMenu(onSelectedNodeMenu, function() {

							svg.uploadedDocumentPosition = [ this.event.x,
									this.event.y ];
						}));

		var profileContainer = selectedNode.append("g").on("mouseover",
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

		selectedNode.append("text").attr('class', "label--selected").attr("y",
				-55).attr("x", configuration.centerX - 230).text(d.label).call(
				editName);

		selectedNode.append("circle").attr('class', "infoButton").attr("r", 30)
				.attr("cy", -65).attr("cx", configuration.centerX + 300).attr(
						"cursor", "pointer").on("click", showInfo);

		selectedNode.append("text").attr('class', "info").text("i").attr("y",
				-54).attr("x", configuration.centerX + 293).attr("cursor",
				"pointer").on("click", showInfo);

		if (graph.selectedNode.showInfo) {

			showInfo({
				originalId : graph.selectedNode.id,
				email : d.email
			});
		}

		placeDocuments(d.originalId, "tagged", selectedNode,
				configuration.centerX, configuration.centerY,
				configuration.maxRowSize);
	}

	function selectNode(d) {

		svg.selectedNode = svgRoot.append("g").data([ d ]).attr("class",
				"selection").style("pointer-events", "click");

		if (d.person) {

			selectPerson(svg.selectedNode, d);

		} else {

			selectFamily(svg.selectedNode, d);
		}
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

	function selectGround() {

		var selectedNode = svgRoot.append("g").attr("class", "selection")
				.style("pointer-events", "click");

		selectedNode
				.append("rect")
				.attr("class", "ground--selected")
				.attr("width", 3100)
				.attr("height", 350)
				.attr("x", -700)
				.attr("y", 1050)
				.attr("cursor", "auto")
				.on(
						'contextmenu',
						d3
								.contextMenu(
										onHeritageMenu,
										function() {

											var x = this.event.x > -700
													&& this.event.x < 2150 ? this.event.x
													: null;
											var y = this.event.y > 1000
													&& this.event.y < 1200 ? this.event.y
													: null;

											svg.uploadedDocumentPosition = [ x,
													y ];
										}));

		selectedNode.append("text").attr('class', "label--selected").attr("y",
				1130).attr("x", -650).text("Heritage");

		svg.selectedNodeId = -1;

		var centerX = -200;
		var centerY = 1100;
		var maxRowSize = 40;

		placeDocuments(-1, "tagged", selectedNode, centerX, centerY, maxRowSize);
	}

	function groundClicked(d) {

		graph.selectedNode = {};
		graph.selectedNode.id = -1;

		selectGround();

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

	function removeDocument(d) {

		server
				.removeDocument(d.id)
				.then(
						function() {

							server
									.deleteNotifications('document', d.id)
									.then(
											function() {

												server
														.deleteEvents(
																'document',
																d.id,
																scope.graph.user.id)
														.then(
																function() {

																	var indexDocToRemove = scope.graph.selectedNode.documents
																			.indexOf(d);

																	if (indexDocToRemove > -1) {
																		scope.graph.selectedNode.documents
																				.splice(
																						indexDocToRemove,
																						1);
																	}
																	scope
																			.drawGraph(
																					true,
																					false);
																});
											});
						});
	}

	function showEditDocument(d, fromContextMenu) {

		scope.editDocId = d.id;
		scope.editFileName = d.file;
		scope.editTitle = d.title;
		scope.owner = {
			id : d.owner
		};

		if (d.date.lastIndexOf('0000', 0) === 0) {

			scope.editDate = '01/01/2015';

		} else {

			scope.editDate = d.date;
		}

		if (d.keywords) {
			scope.keywords = d.keywords;
		} else {
			scope.keywords = [];
		}

		server.getAllKeywords().then(function(data) {

			scope.availableKeywords = data;
		});

		var taggedUsersIds = d.taggedNodes.map(function(user) {
			return user.id;
		});

		if (taggedUsersIds.indexOf(-1) > -1) {

			scope.inHeritage = true;
		}

		scope.taggableUsers = [];
		scope.taggedUsers = [];

		populateUsers(d.taggedNodes, scope.taggedUsers, scope.taggableUsers);

		scope.excludableUsers = [];
		scope.excludedUsers = [];

		server.getBlacklistedUsersForDocument(scope.owner.id, scope.editDocId)
				.then(
						function(data) {

							populateUsers(data, scope.excludedUsers,
									scope.excludableUsers);

							if (!fromContextMenu) {

								graph.selectedDocument = d;
							}

							$('#editDocumentModal').modal('show');
						});
	}

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
				}).attr("owner", function(d) {
					return d.owner;
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

	function appendSelectedDocument(d) {

		var documentUrl = server.getFilePath(d.file);
		var documentDate = commons.getDate(d.date);

		if (d.file.substr(-4) === ".pdf") {

			window.open("../" + documentUrl.substr(1), '_blank');

		} else {

			graph.selectedDocument = d;

			docContainer = svgRoot.append("g").data([ d ]).attr("class",
					"selection");

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
					.attr("x", 1015).attr("y", -140).text(d.title);

			docContainer.append("text").attr("class", "docText")
					.attr("x", 1880).attr("y", 815).text(documentDate);

			docContainer.append("text").attr("class", "docText")
					.attr("x", 2025).attr("y", -140).text("edit").attr(
							"cursor", "pointer").on("click", showEditDocument);

			docContainer.append("text").attr("class", "docText")
					.attr("x", 2100).attr("y", -140).text("[close]").attr(
							"cursor", "pointer").on("click", closeDocClicked);

			var offset = 0;

			d.taggedNodes.forEach(function(taggedNode) {

				docContainer.append("text").attr("class", "docText").attr(
						"style", "fill: white").attr("x", 1015).attr("y",
						-50 + offset).text(taggedNode.label);

				offset += 50;
			});
		}
	}

	function docClicked(d) {

		if (d3.event.defaultPrevented) {
			return;
		}

		svgRoot.selectAll(".docText").remove();
		svgRoot.selectAll(".zoomedDoc").remove();

		appendSelectedDocument(d);

		d3.event.stopPropagation();
	}

	function closeDocClicked() {

		graph.selectedDocument = null;

		svgRoot.selectAll(".zoomedDoc").remove();
		svgRoot.selectAll(".frame").remove();
		svgRoot.selectAll(".docText").remove();
		svgRoot.selectAll(".docText").remove();

		d3.event.stopPropagation();
	}

	function zoomedDocClicked(d) {

		d3.event.stopPropagation();
	}

	var docDrag = d3.behavior.drag().on("dragstart", docDragstarted).on("drag",
			docDragged).on("dragend", docDragended);

	function isForbidden(document) {

		for (forbiddenDocIndex in graph.blacklist.forbiddenDocuments) {

			var forbiddenDoc = graph.blacklist.forbiddenDocuments[forbiddenDocIndex];

			if (document.id == forbiddenDoc.id) {

				return true;
			}
		}

		return false;
	}

	var onDocumentMenu = [ {
		title : 'Edit',
		action : function(elm, d, i) {

			showEditDocument(d, true);
		}
	} ];

	function displayDocuments(fetchedDocuments, nodeId, selectedNode, centerX,
			centerY, maxRowSize) {

		var documents = [];

		var offset = 0;

		for (docIndex in fetchedDocuments) {

			var document = fetchedDocuments[docIndex];

			if (isForbidden(document)) {

				continue;
			}

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

			documents.push(document);
		}

		graph.selectedNode.documents = documents;

		var container = selectedNode.append("g").attr("class", "docContainer");

		var sel = container.selectAll("image").data(documents);

		var documents = sel.enter().append("image");

		documents.each(function(d) {

			currentDoc = d3.select(this).attr("width", 100).attr("id", d.id)
					.attr("owner", d.owner).attr("x", d.position.x).attr("y",
							d.position.y).attr("height", 80).attr(
							"xlink:href",
							function(d) {

								return d.file.substr(-4) === ".pdf" ? server
										.getFilePath(defaultDocumentImg)
										: server.getFilePath(d.file);

							}).attr("class", "myCursor-pointer-move doc").on(
							"click", docClicked).on("mouseover",
							thumbnailMouseovered).on("mouseout",
							thumbnailMouseouted).call(docDrag);

			if (d.owner == scope.graph.user.id) {

				var onDocumentMenuCopy = jQuery
						.extend(true, [], onDocumentMenu);

				onDocumentMenuCopy.push({
					title : "Remove",
					action : function(elm, d, i) {

						removeDocument(d);
					}
				});

				currentDoc
						.on('contextmenu', d3.contextMenu(onDocumentMenuCopy));
			} else {

				currentDoc.on('contextmenu', d3.contextMenu(onDocumentMenu));
			}

		});
	}

	function placeDocuments(nodeId, relationType, selectedNode, centerX,
			centerY, maxRowSize) {

		if (nodeId != -1) {

			server.getNodeDocuments(nodeId, relationType).then(
					function(data) {

						displayDocuments(data.documents, nodeId, selectedNode,
								centerX, centerY, maxRowSize);
					});
		} else {

			server.getGroundDocuments(graph.nodes).then(
					function(data) {

						displayDocuments(data.documents, -1, selectedNode,
								centerX, centerY, maxRowSize);
					});
		}
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

		svg.node[0]
				.forEach(function(n) {

					if (d.taggedNodes) {

						for (nodeIndex in d.taggedNodes) {

							var taggedNode = d.taggedNodes[nodeIndex];

							if (taggedNode.id == n.id) {

								var currentNode = d3.select(n);
								var currentCircle = n.childNodes[0].childNodes[0].childNodes[0];
								var circleSize = commons.getCircleSize(n
										.getAttribute("label"), n
										.getAttribute("level"),
										graph.user.label);

								currentNode.append("circle").attr("r",
										circleSize + 100).attr("class",
										"tagSelection").attr("cx",
										currentCircle.cx.baseVal.value).attr(
										"cy", currentCircle.cy.baseVal.value);
							}
						}
					}
				});

		if (!d.selectedNode || d.file.substr(-4) == ".pdf") {

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
		svgRoot.selectAll(".zoomedDoc").remove();
		svgRoot.selectAll(".frame").remove();

		appendSelectedDocument(d);
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

		server.updateDocumentPosition(d.id, graph.selectedNode.id, x, y);
	}
};