var serverUrl = 'http://localhost:8091';
var siteUrl = 'http://localhost/myfamily';

// var serverUrl =
// 'http://ec2-54-72-121-42.eu-west-1.compute.amazonaws.com:8091';
// var siteUrl =
// 'http://ec2-54-72-121-42.eu-west-1.compute.amazonaws.com/myfamily';

var selectedViewId = 4;
var selectedViewLabel = 'Extended family';

// Default for testing purposes
var userId = 3;
var userLabel = "Michele Minno";

$('#login-expandable').on('click', function() {

	$(this).after($('#login-form'));
	$('#login-form').show();
});

$('#submit-login').on(
		'click',
		function() {

			userLabel = $('#login-user').val();
			$('#login-user').val('');
			var newUser = $('#new-user').is(':checked');

			$.get(serverUrl + "/graph/namesakes?name=" + userLabel, function(
					namesakes) {

				if (namesakes.length > 0) {

					userId = namesakes[0]['id'];

					drawTree(userId, userLabel, selectedViewId,
							selectedViewLabel);

				} else if (newUser) {

					$.get(serverUrl + '/graph/addPerson?name=' + userLabel,
							function(data) {

								userId = data.personId;
								drawTree(userId, userLabel, selectedViewId,
										selectedViewLabel);
							});

				}

				$('#login-form').hide();
				$('#login-expandable').dropdown('toggle');
			});
		});

$('#cancel-login').on('click', function() {

	$('#login-form').hide();
	$('#login-expandable').dropdown('toggle');

});

$('#view li').on('click', function() {

	$(this).siblings().removeClass("active");
	$(this).addClass("active");
	selectedViewId = $(this).attr('id');
	selectedViewLabel = $(this).text();
	drawTree(userId, userLabel, selectedViewId, selectedViewLabel);
});

var width, height;

var zoom;
var svg;
var container;

var force, nodeDrag;

var link, node;

var streamHeight, streamWidth, streamY, streamX, streamNode;

var docRowSize, currentPage, documents;

function init() {

	d3.select("svg").remove();

	width = 1250;
	height = 630;

	zoom = d3.behavior.zoom().scaleExtent([ .5, 4 ]).on("zoom", zoomed);

	svg = d3.select("body").append("svg").attr("width", width).attr("height",
			height).append("g").attr("transform",
			"translate(300, 100)scale(.4)").attr("class", "myCursor-zoom-move");

	svg.on("click", clickSvg);

	svg.append("circle").attr("r", width * 10).attr("class", "lens").style(
			"pointer-events", "all").call(zoom);

	svg.append("rect").attr("class", "ground").attr("width", 600).attr(
			"height", 200).attr("x", -700).attr("y", 1100).on("click",
			groundClicked).attr("cursor", "pointer");

	svg.append("text").attr('class', "nodeLabel").attr("y", 1080).attr("x",
			-650).text("Heritage");

	svg.append("rect").attr("class", "ground").attr("width", 500).attr(
			"height", 200).attr("x", 1900).attr("y", 1100).on("click",
			groundClicked).attr("cursor", "pointer");

	svg.append("text").attr('class', "nodeLabel").attr("y", 1080).attr("x",
			2220).text("Heritage");

	container = svg.append("g");

	force = d3.layout.force().size([ width, height ]).gravity(0).charge(
			function(d) {
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
	}).on("dragstart", nodeDragstarted).on("drag", nodeDragged).on("dragend",
			nodeDragended);

	link = container.selectAll(".link");
	node = container.selectAll(".node");

	streamHeight = 100;
	streamWidth = 1600;
	streamY = 1130;
	streamX = 100;

	docRowSize = 16;
}

var nodes;

var viewIndex;

function drawTree(userId, userLabel, viewId, viewLabel) {

	$('#logged-user').html(userLabel + '<span class="caret myCaret"></span>');
	$('#view-mode').html(viewLabel + '<span class="caret myCaret"></span>');

	viewIndex = view;
	init();

	$
			.get(
					serverUrl + "/" + userId + "/graph/view?view=" + viewId,
					function(graphView) {

						nodes = graphView.nodes;

						if (viewId != 4) {

							svg.on('contextmenu', null);
						}

						force = force.nodes(graphView.nodes).links(
								graphView.links);

						force.start();

						link = link.data(graphView.links).enter()
								.append("path");

						link.each(function(d) {

							currentLink = d3.select(this);
							currentLink.attr("class", "link").attr(
									"stroke-width", function(d) {

										return 30 / d.level + "px";
									});
						});

						node = node.data(graphView.nodes).enter().append("g");

						node
								.each(function(d) {

									currentNode = d3.select(this);

									currentNode.call(nodeDrag);

									if (d.person) {

										currentNode.on("click", clickNode);

										if (viewId == 4) {

											currentNode.on('contextmenu', d3
													.contextMenu(onPersonMenu));
										}

										var defs = currentNode
												.append('svg:defs');

										clipPath = defs.append("svg:clipPath")
												.attr(
														"id",
														"clipPath_"
																+ d.originalId);

										var circleSize = getCircleSize(d);
										var nodeClass = getNodeClass(d,
												userLabel);

										clipPath.append("circle").attr("class",
												nodeClass)
												.attr("r", circleSize).attr(
														"id",
														"circle_"
																+ d.originalId);

										currentNode.append("svg:use").attr(
												"xlink:href",
												"#" + "circle_" + d.originalId);

										currentNode
												.append("svg:image")
												.attr("class", "profile-image")
												.attr(
														"xlink:href",
														function(d) {
															return d.img == "" ? "./docs/default_profile.jpg"
																	: "./docs/"
																			+ d.img;
														}).attr("width",
														circleSize * 2).attr(
														"height",
														circleSize * 2).attr(
														"x", 0).attr("y", 0)
												.attr(
														"clip-path",
														"url(#clipPath_"
																+ d.originalId
																+ ")");

										currentNode.append("text").attr(
												"class", function(d) {
													if (d.label == userLabel) {
														return "my-nodeLabel";
													} else {
														return "nodeLabel";
													}
												}).attr("dy", "1.5em").text(
												function(d) {
													return d.label;
												}).call(makeEditable);
									} else {

										if (viewId == 4) {

											currentNode.on('contextmenu', d3
													.contextMenu(onFamilyMenu));
										}

										currentNode.append("ellipse").attr(
												"rx", function(d) {

													return 100 / d.level;
												}).attr("ry", function(d) {

											return 50 / d.level;
										}).attr("fill", "brown").attr("class",
												"myCursor-move");
									}
								});

						streamNode = svg.append("g").attr("cursor", "auto");

						streamNode.append("circle").attr("r", 30).attr("cx",
								streamX - 67).attr("cy", streamY + 50).attr(
								"class", "navigator");

						streamNode.append("text").attr("class",
								"navigator-arrow").attr("x", streamX - 88)
								.attr("y", streamY + 65).text("<").on("click",
										backMain).attr("cursor", "pointer");

						streamNode.append("circle").attr("r", 30).attr("cx",
								streamX + streamWidth + 66).attr("cy",
								streamY + 45).attr("class", "navigator");

						streamNode.append("text").attr("class",
								"navigator-arrow").attr("x",
								streamX + streamWidth + 50).attr("y",
								streamY + 60).text(">")
								.on("click", forwardMain).attr("cursor",
										"pointer");

						streamNode.append("rect").attr("width", streamWidth)
								.attr("height", streamHeight)
								.attr("x", streamX).attr("y", streamY).attr(
										"rx", 20).attr("ry", 20).attr("class",
										"data-stream");

						fillStream(graphView.nodes);

					});
};

function fillStream(nodes) {

	console.log("Filling stream");

	var data = {
		nodes : nodes
	};

	$.ajax({

		url : serverUrl + "/documents/" + userId,
		type : "POST",
		data : JSON.stringify(data),
		contentType : "application/json",
		dataType : "json",
		success : function(data) {

			documents = data.documents;

			console.log("Documents: " + JSON.stringify(documents));

			var documentsSize = documents.length;

			if (documentsSize > 0) {

				currentPage = Math.floor(documentsSize / (docRowSize + 1));

				maxPage = currentPage;

				populateThumbnails(currentPage, true);
			}
		}
	});
};

drawTree(userId, userLabel, selectedViewId, selectedViewLabel);

function populateThumbnails(currentPage, back) {

	var minIndex = currentPage * docRowSize;

	for (docIndex in documents) {

		var doc = documents[docIndex];
		doc.index = parseInt(docIndex);
	}

	var currentDocuments = documents.filter(function(d) {

		return d.index >= minIndex && d.index < minIndex + docRowSize;
	});

	var doc = streamNode.selectAll(".doc");
	var sel = doc.data(currentDocuments, function(d) {
		return d.index;
	});

	var oldTarget = back ? streamWidth : streamX;
	var newTarget = back ? streamX : streamWidth;

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
				return d.file.substr(-4) === ".pdf" ? "./docs/default_pdf.png"
						: "./docs/" + d.file;
			}).attr("width", 100).attr("height", streamHeight).attr("y",
			streamY).attr("index", function(d) {
		return d.index;
	}).attr("id", function(d) {
		return d.id;
	}).attr("title", function(d) {
		return d.title;
	}).attr("url", function(d) {
		return "./docs/" + d.file;
	}).attr("date", function(d) {

		return getDate(d.date);

	}).on("mouseover", thumbnailMouseovered)
			.on("mouseout", thumbnailMouseouted).on("click", thumbnailClicked)
			.attr("cursor", "pointer").attr("x", newTarget).transition()
			.duration(duration).delay(newDelay).ease("linear").attr("x",
					function(d) {
						return streamX + (d.index - minIndex) * 100;
					});

	sel.exit().transition().duration(duration).delay(oldDelay).ease("linear")
			.attr("x", oldTarget).remove();
}
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

	link.attr("d", diagonal);

	node.selectAll(".node").attr("cx", function(d) {
		return d.x;
	}).attr("cy", function(d) {
		return d.y;
	});

	node.selectAll(".nodeLabel").attr("x", function(d) {
		return d.x - 25;
	}).attr("y", function(d) {
		return d.y + getCircleSize(d);
	});

	node.selectAll(".my-nodeLabel").attr("x", function(d) {
		return d.x - 45;
	}).attr("y", function(d) {
		return d.y + getCircleSize(d);
	});

	node.selectAll(".profile-image").attr("x", function(d) {
		return d.x - getCircleSize(d);
	}).attr("y", function(d) {
		return d.y - getCircleSize(d);
	});

	node.selectAll("ellipse").attr("cx", function(d) {
		return d.x;
	}).attr("cy", function(d) {
		return d.y;
	});
}

var onPersonMenu = [
		{
			title : 'Add family as a parent',
			action : function(elm, d, i) {

				$.get(serverUrl + "/" + userId
						+ '/graph/add?type=family&source=' + d.originalId,
						function() {

							drawTree(userId, userLabel, selectedViewId,
									selectedViewLabel);
						});
			}
		},
		{
			title : 'Add family as a child',
			action : function(elm, d, i) {

				$.get(serverUrl + "/" + userId
						+ '/graph/add?type=family&target=' + d.originalId,
						function() {

							drawTree(userId, userLabel, selectedViewId,
									selectedViewLabel);
						});
			}
		},
		{
			title : 'Remove',
			action : function(elm, d, i) {

				$.get(serverUrl + "/" + userId + '/graph/remove/'
						+ d.originalId, function() {

					drawTree(userId, userLabel, selectedViewId,
							selectedViewLabel);
				});
			}
		} ];

var onFamilyMenu = [
		{
			title : 'Add parent',
			action : function(elm, d, i) {

				$.get(serverUrl + "/" + userId
						+ '/graph/add?type=person&target=' + d.originalId,
						function() {

							drawTree(userId, userLabel, selectedViewId,
									selectedViewLabel);
						});
			}
		},
		{
			title : 'Add child',
			action : function(elm, d, i) {

				$.get(serverUrl + "/" + userId
						+ '/graph/add?type=person&source=' + d.originalId,
						function() {

							drawTree(userId, userLabel, selectedViewId,
									selectedViewLabel);
						});
			}
		},
		{
			title : 'Remove',
			action : function(elm, d, i) {

				$.get(serverUrl + "/" + userId + '/graph/remove/'
						+ d.originalId, function() {

					drawTree(userId, userLabel, selectedViewId,
							selectedViewLabel);
				});
			}
		} ];
