var serverUrl = 'http://localhost:8091';
var commons = window.commons || {};

var graphRender = function(scope, graph, configuration, server, svg) {

	if (!graph) {

		return;
	}

	var svgParent = null;
	var container = null;
	var force = null;
	var nodeDrag = null;

	function init() {

		d3.select("svg").remove();

		var zoom = d3.behavior.zoom().scaleExtent([ .5, 4 ]).on("zoom", zoomed);

		svgParent = d3.select("body").append("svg").attr("width",
				configuration.width).attr("height", configuration.height)
				.append("g").attr("transform", "translate(300, 100)scale(.4)")
				.attr("class", "myCursor-zoom-move");

		svgParent.on("click", clickSvg);

		svgParent.append("circle").attr("r", configuration.width * 10).attr(
				"class", "lens").style("pointer-events", "all").call(zoom);

		svgParent.append("rect").attr("class", "ground").attr("width", 600)
				.attr("height", 200).attr("x", -700).attr("y", 1100).attr(
						"cursor", "pointer");

		svgParent.append("text").attr('class', "nodeLabel").attr("y", 1080)
				.attr("x", -650).text("Heritage");

		svgParent.append("rect").attr("class", "ground").attr("width", 500)
				.attr("height", 200).attr("x", 1900).attr("y", 1100).attr(
						"cursor", "pointer");

		svgParent.append("text").attr('class', "nodeLabel").attr("y", 1080)
				.attr("x", 2220).text("Heritage");

		container = svgParent.append("g");

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

	function updateGraph() {

		server.getGraphView(graph.userId, graph.viewId).then(
				function(graphView) {

					graph.nodes = graphView.nodes;
					graph.links = graphView.links;
				});
	}

	var onPersonMenu = [
			{
				title : 'Add family as a parent',
				action : function(elm, d, i) {

					server.addNode('family', graph.userId, d.originalId,
							'source').then(function() {

						updateGraph();
					});
				}
			},
			{
				title : 'Add family as a child',
				action : function(elm, d, i) {

					server.addNode('family', graph.userId, d.originalId,
							'target').then(function() {

						updateGraph();
					});
				}
			},
			{
				title : 'Remove',
				action : function(elm, d, i) {

					server.removeNode(graph.userId, d.originalId).then(
							function() {

								updateGraph();
							});
				}
			} ];

	var onFamilyMenu = [
			{
				title : 'Add parent',
				action : function(elm, d, i) {

					server.addNode('person', graph.userId, d.originalId,
							'target').then(function() {

						updateGraph();
					});
				}
			},
			{
				title : 'Add child',
				action : function(elm, d, i) {

					server.addNode('person', graph.userId, d.originalId,
							'source').then(function() {

						updateGraph();
					});
				}
			},
			{
				title : 'Remove',
				action : function(elm, d, i) {

					server.removeNode(graph.userId, d.originalId).then(
							function() {

								updateGraph();
							});
				}
			} ];

	function drawTree(userId, userLabel, viewId, viewLabel) {

		init();

		if (viewId != 4) {

			svgParent.on('contextmenu', null);
		}

		force.nodes(graph.nodes).links(graph.links).start();

		svg.link = svg.link.data(graph.links).enter().append("path");

		svg.link.each(function(d) {

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

		svg.node = svg.node.data(graph.nodes).enter().append("g");

		svg.node
				.each(function(d) {

					currentNode = d3.select(this);

					currentNode.call(nodeDrag);

					if (d.person) {

						if (viewId == 4) {

							currentNode.on('contextmenu', d3
									.contextMenu(onPersonMenu));
						}

						var defs = currentNode.append('svgParent:defs');

						clipPath = defs.append("svgParent:clipPath").attr("id",
								"clipPath_" + d.originalId);

						var circleSize = commons.getCircleSize(d,
								graph.userLabel);
						var nodeClass = commons
								.getNodeClass(d, graph.userLabel);

						clipPath.append("circle").attr("class", nodeClass)
								.attr("r", circleSize).attr("id",
										"circle_" + d.originalId);

						currentNode.append("svgParent:use").attr("xlink:href",
								"#" + "circle_" + d.originalId);

						currentNode
								.append("svgParent:image")
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

						if (d.originalId == svg.selectedNodeId) {

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

		svg.streamNode = svgParent.append("g").attr("cursor", "auto");

		svg.streamNode.append("circle").attr("r", 30).attr("cx",
				configuration.streamX - 67).attr("cy",
				configuration.streamY + 50).attr("class", "navigator");

		svg.streamNode.append("text").attr("class",
				"navigator-arrow left-arrow").attr("x",
				configuration.streamX - 88).attr("y",
				configuration.streamY + 65).text("<").attr("cursor", "pointer");

		svg.streamNode.append("circle").attr("r", 30).attr("cx",
				configuration.streamX + configuration.streamWidth + 66).attr(
				"cy", configuration.streamY + 45).attr("class", "navigator");

		svg.streamNode.append("text").attr("class",
				"navigator-arrow right-arrow").attr("x",
				configuration.streamX + configuration.streamWidth + 50).attr(
				"y", configuration.streamY + 60).text(">").attr("cursor",
				"pointer");

		svg.streamNode.append("rect").attr("width", configuration.streamWidth)
				.attr("height", configuration.streamHeight).attr("x",
						configuration.streamX).attr("y", configuration.streamY)
				.attr("rx", 20).attr("ry", 20).attr("class", "data-stream");

	}

	drawTree(graph.userId, graph.userLabel, graph.viewId, graph.viewLabel);

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
		}).attr("y", function(d) {
			return d.y + commons.getCircleSize(d, graph.userLabel);
		});

		svg.node.selectAll(".my-nodeLabel").attr("x", function(d) {
			return d.x - 45;
		}).attr("y", function(d) {
			return d.y + commons.getCircleSize(d, graph.userLabel);
		});

		svg.node.selectAll(".profile-image").attr("x", function(d) {
			return d.x - commons.getCircleSize(d, graph.userLabel);
		}).attr("y", function(d) {
			return d.y - commons.getCircleSize(d, graph.userLabel);
		});

		svg.node.selectAll("ellipse").attr("cx", function(d) {
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

		svgParent.selectAll(".profile-image").filter(function(d) {

			return d.originalId == nodeIdToUpdate;

		}).attr("xlink:href", "./docs/" + fileName);

		svgParent.selectAll(".profile-image--selected").attr("xlink:href",
				"./docs/" + fileName);
	}

	function clickSvg(d) {

		if (!d3.event || d3.event.defaultPrevented) {
			return;
		}

		svg.selectedNodeId = null;

		var sel = svgParent.selectAll(".selection");
		sel.remove();

		var actions = svgParent.selectAll(".action");
		actions.remove();

		svgParent.selectAll(".tree-leaf").style("pointer-events", "all");
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

		var actions = svgParent.selectAll(".action");
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

			$.get(serverUrl + '/' + graph.userId + '/view/' + graph.viewId
					+ '/update?node=' + d.originalId + '&x=' + d.x + '&y='
					+ d.y);
		}
	}
};