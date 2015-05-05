var serverUrl = 'http://localhost:8090';

var width = 1800;
var height = 1200;

var zoom = d3.behavior.zoom().scaleExtent([ .5, 2 ]).on("zoom", zoomed);

var svg = d3.select("body").append("svg").attr("width", width).attr("height",
		height).on("click", clickSvg).append("g").attr("transform",
		"translate(200, 300)scale(.5)").call(zoom);

var rect = svg.append("rect").attr("width", width).attr("height", height)
		.style("fill", "none").style("pointer-events", "all");

var container = svg.append("g");

var force = d3.layout.force().size([ width, height ]).charge(-800)
		.linkDistance(300).on("tick", tick);

var nodeDrag = force.drag().origin(function(d) {
	return d;
}).on("dragstart", nodeDragstarted).on("drag", nodeDragged).on("dragend",
		nodeDragended);

var link = container.selectAll(".link");
var node = container.selectAll(".node");

var streamHeight = 100;
var streamWidth = width - 200;
var streamY = 1200;
var streamX = 100;

var docRowSize = 16;
var currentPage;
var maxPage;
var documents;

$.get(serverUrl + "/graph", function(graphString) {

	var graph = JSON.parse(graphString);

	force.nodes(graph.nodes).links(graph.links).start();

	link = link.data(graph.links).enter().append("path");

	link.each(function(d) {

		currentLink = d3.select(this);
		currentLink.attr("class", "link");
	});

	node = node.data(graph.nodes).enter().append("g");

	node.each(function(d) {

		currentNode = d3.select(this);

		currentNode.on("click", clickNode).call(nodeDrag);

		if (d.person) {

			currentNode.append("circle").attr("class", "node").attr("r", 50);

			currentNode.append("image").attr("class", "profile-image").attr(
					"xlink:href", "./img/" + d.img).attr("width", 40).attr(
					"height", 40);

			currentNode.append("text").attr("class", "label").attr("dy",
					".40em").text(function(d) {
				return d.label;
			});
		} else {

			currentNode.append("ellipse").attr("rx", 20).attr("ry", 10).attr(
					"fill", "brown").attr("cursor", "move");
		}
	});

	var containerNode = container.append("g");

	containerNode.append("circle").attr("r", 35).attr("cx", streamX - 60).attr(
			"cy", streamY + 50).attr("class", "navigator");

	containerNode.append("text").attr("class", "navigator-arrow").attr("x",
			streamX - 78).attr("y", streamY + 65).text("<").on("click",
			backMain);

	containerNode.append("circle").attr("r", 35).attr("cx",
			streamX + streamWidth + 65).attr("cy", streamY + 45).attr("class",
			"navigator");

	containerNode.append("text").attr("class", "navigator-arrow").attr("x",
			streamX + streamWidth + 50).attr("y", streamY + 60).text(">").on(
			"click", forwardMain);

	containerNode.append("rect").attr("width", streamWidth).attr("height",
			streamHeight).attr("x", streamX).attr("y", streamY).attr("class",
			"data-stream");

	$.get(serverUrl + "/documents", function(documentsString) {

		documents = JSON.parse(documentsString);

		var documentsSize = documents.data.length;
		currentPage = Math.floor(documentsSize / docRowSize);
		maxPage = currentPage;

		populateThumbnails(currentPage, true);
	});
});

function populateThumbnails(currentPage, back) {

	var minIndex = currentPage * docRowSize;

	var currentDocuments = documents.data.filter(function(d) {

		return d.index >= minIndex && d.index < minIndex + docRowSize;
	});

	var doc = container.selectAll(".doc");
	var sel = doc.data(currentDocuments, function(d) {
		return d.index;
	});

	var oldTarget = back ? streamX + streamWidth : streamX;
	var newTarget = back ? streamX : streamX + streamWidth;

	var newDelay = function(d) {
		return back ? (currentDocuments.length - (d.index - minIndex))
				* (duration / 15) : (d.index - minIndex) * (duration / 10);
	};
	var oldDelay = function(d) {
		return back ? (currentDocuments.length - (d.index - minIndex))
				* (duration / 15) : (d.index - minIndex) * (duration / 10);
	};

	var duration = 300;

	sel.enter().append("image").attr("class", "doc").attr("xlink:href",
			function(d) {
				return "./img/" + d.file;
			}).attr("width", 100).attr("height", streamHeight).attr("y",
			streamY).on("mouseover", docMouseovered).on("mouseout",
			docMouseouted).attr("x", newTarget).transition().duration(duration)
			.delay(newDelay).ease("linear").attr("x", function(d) {
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

	node.selectAll(".label").attr("x", function(d) {
		return d.x - 25;
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