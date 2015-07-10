var serverUrl = 'http://localhost:8091';
var commons = window.commons || {};

var graphRender = function(scope, $rootScope) {

	if (!scope.graph) {

		return;
	}

	var svg = null;
	var container = null;
	var force = null;
	var nodeDrag = null;

	function init() {

		d3.select("svg").remove();

		var zoom = d3.behavior.zoom().scaleExtent([ .5, 4 ]).on("zoom", zoomed);

		svg = d3.select("body").append("svg").attr("width", $rootScope.width)
				.attr("height", $rootScope.height).append("g").attr(
						"transform", "translate(300, 100)scale(.4)").attr(
						"class", "myCursor-zoom-move");

		svg.on("click", clickSvg);

		svg.append("circle").attr("r", $rootScope.width * 10).attr("class",
				"lens").style("pointer-events", "all").call(zoom);

		svg.append("rect").attr("class", "ground").attr("width", 600).attr(
				"height", 200).attr("x", -700).attr("y", 1100).attr("cursor",
				"pointer");

		svg.append("text").attr('class', "nodeLabel").attr("y", 1080).attr("x",
				-650).text("Heritage");

		svg.append("rect").attr("class", "ground").attr("width", 500).attr(
				"height", 200).attr("x", 1900).attr("y", 1100).attr("cursor",
				"pointer");

		svg.append("text").attr('class', "nodeLabel").attr("y", 1080).attr("x",
				2220).text("Heritage");

		container = svg.append("g");

		force = d3.layout.force().size([ $rootScope.width, $rootScope.height ])
				.gravity(0).charge(function(d) {
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

		$rootScope.link = container.selectAll(".link");
		$rootScope.node = container.selectAll(".node");
	}

	function updateGraph() {

		scope.server.getGraphView(scope.graph.userId, scope.graph.viewId).then(
				function(graphView) {

					scope.graph.nodes = graphView.nodes;
					scope.graph.links = graphView.links;
				});
	}

	var onPersonMenu = [
			{
				title : 'Add family as a parent',
				action : function(elm, d, i) {

					scope.server.addNode('family', scope.graph.userId,
							d.originalId, 'source').then(function() {

						updateGraph();
					});
				}
			},
			{
				title : 'Add family as a child',
				action : function(elm, d, i) {

					scope.server.addNode('family', scope.graph.userId,
							d.originalId, 'target').then(function() {

						updateGraph();
					});
				}
			},
			{
				title : 'Remove',
				action : function(elm, d, i) {

					scope.server.removeNode(scope.graph.userId, d.originalId)
							.then(function() {

								updateGraph();
							});
				}
			} ];

	var onFamilyMenu = [
			{
				title : 'Add parent',
				action : function(elm, d, i) {

					scope.server.addNode('person', scope.graph.userId,
							d.originalId, 'target').then(function() {

						updateGraph();
					});
				}
			},
			{
				title : 'Add child',
				action : function(elm, d, i) {

					scope.server.addNode('person', scope.graph.userId,
							d.originalId, 'source').then(function() {

						updateGraph();
					});
				}
			},
			{
				title : 'Remove',
				action : function(elm, d, i) {

					scope.server.removeNode(scope.graph.userId, d.originalId)
							.then(function() {

								updateGraph();
							});
				}
			} ];

	function drawTree(userId, userLabel, viewId, viewLabel) {

		init();

		if (viewId != 4) {

			svg.on('contextmenu', null);
		}

		force.nodes(scope.graph.nodes).links(scope.graph.links).start();

		$rootScope.link = $rootScope.link.data(scope.graph.links).enter()
				.append("path");

		$rootScope.link.each(function(d) {

			currentLink = d3.select(this);
			currentLink.attr("class", "link").attr("stroke-width", function(d) {

				return 30 / d.level + "px";
			});
		});

		commons.makeEditable = function(d) {

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

								var oldName = d.label;
								var result = prompt('Enter a new name', d.name);

								if (result) {

									var node = d3
											.select(this.parentNode.parentNode);
									var selection = node
											.selectAll(".nodeLabel");

									if (selection[0].length == 0
											&& node.selectAll(".my-nodeLabel")) {

										alert("Change your name from the setting menu");

										selection = node
												.selectAll(".my-nodeLabel");
										var label = selection[0][0];
										label.textContent = oldName;

									} else {

										var label = selection[0][0];
										label.textContent = result;

										d.label = result;
										var selection = d3.select(this);
										var label = selection[0][0];
										label.textContent = result;

										$.get(serverUrl + "/" + userId
												+ '/graph/update/'
												+ d.originalId
												+ '?field=label&value='
												+ result);
									}
								}

								d3.event.stopPropagation();
							});
		};

		$rootScope.node = $rootScope.node.data(scope.graph.nodes).enter()
				.append("g");

		$rootScope.node
				.each(function(d) {

					currentNode = d3.select(this);

					currentNode.call(nodeDrag);

					if (d.person) {

						if (viewId == 4) {

							currentNode.on('contextmenu', d3
									.contextMenu(onPersonMenu));
						}

						var defs = currentNode.append('svg:defs');

						clipPath = defs.append("svg:clipPath").attr("id",
								"clipPath_" + d.originalId);

						var circleSize = commons.getCircleSize(d,
								scope.graph.userLabel);
						var nodeClass = commons.getNodeClass(d,
								scope.graph.userLabel);

						clipPath.append("circle").attr("class", nodeClass)
								.attr("r", circleSize).attr("id",
										"circle_" + d.originalId);

						currentNode.append("svg:use").attr("xlink:href",
								"#" + "circle_" + d.originalId);

						currentNode
								.append("svg:image")
								.attr("class", "profile-image")
								.attr(
										"xlink:href",
										function(d) {
											return d.img == "" ? "./docs/default_profile.jpg"
													: "./docs/" + d.img;
										}).attr("width", circleSize * 2).attr(
										"height", circleSize * 2).attr("x", 0)
								.attr("y", 0).attr("clip-path",
										"url(#clipPath_" + d.originalId + ")");

						currentNode.append("text").attr(
								"class",
								function(d) {
									if (d.label.toUpperCase() == userLabel
											.toUpperCase()) {
										return "my-nodeLabel";
									} else {
										return "nodeLabel";
									}
								}).attr("dy", "1.5em").text(function(d) {
							return d.label;
						}).call(commons.makeEditable);

						if (d.originalId == $rootScope.selectedNodeId) {

							commons.selectNode(this, d);
						}
					} else {

						if (viewId == 4) {

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

		$rootScope.streamNode = svg.append("g").attr("cursor", "auto");

		$rootScope.streamNode.append("circle").attr("r", 30).attr("cx",
				$rootScope.streamX - 67).attr("cy", $rootScope.streamY + 50)
				.attr("class", "navigator");

		$rootScope.streamNode.append("text").attr("class",
				"navigator-arrow left-arrow")
				.attr("x", $rootScope.streamX - 88).attr("y",
						$rootScope.streamY + 65).text("<").attr("cursor",
						"pointer");

		$rootScope.streamNode.append("circle").attr("r", 30).attr("cx",
				$rootScope.streamX + $rootScope.streamWidth + 66).attr("cy",
				$rootScope.streamY + 45).attr("class", "navigator");

		$rootScope.streamNode.append("text").attr("class",
				"navigator-arrow right-arrow").attr("x",
				$rootScope.streamX + $rootScope.streamWidth + 50).attr("y",
				$rootScope.streamY + 60).text(">").attr("cursor", "pointer");

		$rootScope.streamNode.append("rect").attr("width",
				$rootScope.streamWidth).attr("height", $rootScope.streamHeight)
				.attr("x", $rootScope.streamX).attr("y", $rootScope.streamY)
				.attr("rx", 20).attr("ry", 20).attr("class", "data-stream");

	}

	drawTree(scope.graph.userId, scope.graph.userLabel, scope.graph.viewId,
			scope.graph.viewLabel);

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

		$rootScope.link.attr("d", diagonal);

		$rootScope.node.selectAll(".node").attr("cx", function(d) {
			return d.x;
		}).attr("cy", function(d) {
			return d.y;
		});

		$rootScope.node.selectAll(".nodeLabel").attr("x", function(d) {
			return d.x - 25;
		}).attr("y", function(d) {
			return d.y + commons.getCircleSize(d, scope.graph.userLabel);
		});

		$rootScope.node.selectAll(".my-nodeLabel").attr("x", function(d) {
			return d.x - 45;
		}).attr("y", function(d) {
			return d.y + commons.getCircleSize(d, scope.graph.userLabel);
		});

		$rootScope.node.selectAll(".profile-image").attr("x", function(d) {
			return d.x - commons.getCircleSize(d, scope.graph.userLabel);
		}).attr("y", function(d) {
			return d.y - commons.getCircleSize(d, scope.graph.userLabel);
		});

		$rootScope.node.selectAll("ellipse").attr("cx", function(d) {
			return d.x;
		}).attr("cy", function(d) {
			return d.y;
		});
	}

	var nodeIdToUpdate = null;
	var fileName = null;

	$('#profile-img-upload').change(
			function() {

				$('#uploadProfileImageForm').attr(
						'action',
						serverUrl + "/" + userId + '/graph/profileImage/'
								+ nodeIdToUpdate);
				$('#uploadProfileImageForm').submit();

				var filePath = $(this).val();
				fileName = filePath.substring(filePath.lastIndexOf("\\") + 1);

				setTimeout(profileImageUploadContinueExecution, 500);
			});

	function profileImageUploadContinueExecution() {

		svg.selectAll(".profile-image").filter(function(d) {

			return d.originalId == nodeIdToUpdate;

		}).attr("xlink:href", "./docs/" + fileName);

		svg.selectAll(".profile-image--selected").attr("xlink:href",
				"./docs/" + fileName);
	}

	function clickSvg(d) {

		if (!d3.event || d3.event.defaultPrevented) {
			return;
		}

		$rootScope.selectedNodeId = null;

		var sel = svg.selectAll(".selection");
		sel.remove();

		var actions = svg.selectAll(".action");
		actions.remove();

		svg.selectAll(".tree-leaf").style("pointer-events", "all");
	}

	function zoomed() {

		container.attr("transform", "translate(" + d3.event.translate
				+ ")scale(" + d3.event.scale + ")");
	}

	function nodeDragstarted(d) {

		d3.select(this).classed("fixed", d.fixed = true);

		if (!$rootScope.selectedNodeId) {
			d3.event.sourceEvent.stopPropagation();
			d3.select(this).classed("dragging", true);
		}

		var actions = svg.selectAll(".action");
		actions.remove();
	}

	function nodeDragged(d) {

		if (!$rootScope.selectedNodeId) {
			d3.select(this).attr("x", d.x = d3.event.x).attr("y",
					d.y = d3.event.y);
		}
	}

	function nodeDragended(d) {

		if (!$rootScope.selectedNodeId) {
			d3.select(this).classed("dragging", false);

			$.get(serverUrl + '/' + scope.graph.userId + '/view/'
					+ scope.graph.viewId + '/update?node=' + d.originalId
					+ '&x=' + d.x + '&y=' + d.y);
		}
	}
};