var serverUrl = 'http://localhost:8090';
var siteUrl = 'http://localhost/myfamily';

// var serverUrl =
// 'http://ec2-54-72-121-42.eu-west-1.compute.amazonaws.com:8090';
// var siteUrl =
// 'http://ec2-54-72-121-42.eu-west-1.compute.amazonaws.com/familygraph.me';

$('#view li').on('click', function() {

	$(this).siblings().removeClass("active");
	$(this).addClass("active");
	var selectedViewId = $(this).attr('id');
	drawTree(selectedViewId);
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
	height = 700;

	zoom = d3.behavior.zoom().scaleExtent([ .5, 4 ]).on("zoom", zoomed);

	svg = d3.select("body").append("svg").attr("width", width).attr("height",
			height).append("g").attr("transform",
			"translate(300, 100)scale(.4)").attr("class", "myCursor-zoom-move");

	svg.on("click", clickSvg);

	svg.append("circle").attr("r", width * 10).attr("class", "lens").style(
			"pointer-events", "all").call(zoom);

	container = svg.append("g");

	force = d3.layout.force().size([ width, height ]).charge(-800)
			.linkDistance(300).on("tick", tick);

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
	streamNode;

	docRowSize = 16;
	currentPage;
	documents;
}

var viewIndex;

function drawTree(view) {

	viewIndex = view;
	init();

	$
			.get(
					serverUrl + "/graph/3?view=" + view,
					function(graphViewString) {

						var graphView = JSON.parse(graphViewString);

						force.nodes(graphView.nodes).links(graphView.links)
								.start();

						link = link.data(graphView.links).enter()
								.append("path");

						link.each(function(d) {

							currentLink = d3.select(this);
							currentLink.attr("class", "link");
						});

						node = node.data(graphView.nodes).enter().append("g");

						node
								.each(function(d) {

									currentNode = d3.select(this).append("g")
											.attr("class", "tree-leaf");
									currentNode.call(nodeDrag);

									if (d.person) {

										currentNode.on("click", clickNode);

										currentNode
												.append("circle")
												.attr(
														"class",
														function(d) {
															if (d.label == "Michele Minno") {
																return "my-node";
															} else {
																return "node";
															}
														}).attr("r", 50);

										currentNode
												.append("image")
												.attr("class", "profile-image")
												.attr(
														"xlink:href",
														function(d) {
															return d.img == "" ? "./docs/default_profile.jpg"
																	: "./docs/"
																			+ d.img;
														}).attr("width", 40)
												.attr("height", 40).on(
														"mouseover",
														nodeMouseovered);

										currentNode
												.append("text")
												.attr(
														"class",
														function(d) {
															if (d.label == "Michele Minno") {
																return "my-nodeLabel";
															} else {
																return "nodeLabel";
															}
														}).attr("dy", "1.5em")
												.text(function(d) {
													return d.label;
												}).call(makeEditable);
									} else {

										currentNode.append("ellipse").attr(
												"rx", 20).attr("ry", 10).attr(
												"fill", "brown").attr("class",
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

						$.get(serverUrl + "/documents", function(
								documentsString) {

							documents = JSON.parse(documentsString);

							var documentsSize = documents.data.length;
							currentPage = Math
									.floor(documentsSize / docRowSize);
							maxPage = currentPage;

							populateThumbnails(currentPage, true);
						});
					});
}

drawTree(2);

function populateThumbnails(currentPage, back) {

	var minIndex = currentPage * docRowSize;

	var currentDocuments = documents.data.filter(function(d) {

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
			streamY).attr("id", function(d) {
		return d.index;
	}).attr("title", function(d) {
		return d.title;
	}).attr("url", function(d) {
		return "./docs/" + d.file;
	}).attr("date", function(d) {
		return getDate(d);
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

	node.selectAll(".my-node").attr("cx", function(d) {
		return d.x;
	}).attr("cy", function(d) {
		return d.y;
	});

	node.selectAll(".nodeLabel").attr("x", function(d) {
		return d.x - 25;
	}).attr("y", function(d) {
		return d.y + 35;
	});

	node.selectAll(".my-nodeLabel").attr("x", function(d) {
		return d.x - 45;
	}).attr("y", function(d) {
		return d.y + 35;
	});

	node.selectAll(".profile-image").attr("x", function(d) {
		return d.x - 20;
	}).attr("y", function(d) {
		return d.y - 20;
	});

	node.selectAll("ellipse").attr("cx", function(d) {
		return d.x;
	}).attr("cy", function(d) {
		return d.y;
	});
}