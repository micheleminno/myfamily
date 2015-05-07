var serverUrl = 'http://localhost:8090';
var siteUrl = 'http://localhost/myfamily';

var width = 1250;
var height = 700;

var zoom = d3.behavior.zoom().scaleExtent([ .5, 4 ]).on("zoom", zoomed);

var svg = d3.select("body").append("svg").attr("width", width).attr("height",
		height).append("g").attr("transform",
		"translate(300, 100)scale(.4)");

svg.on("click", clickSvg);

var lens = svg.append("circle").attr("r", width * 10).attr("class", "lens")
		.style("pointer-events", "all").call(zoom);

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
var streamWidth = 1600;
var streamY = 1300;
var streamX = 100;
var streamNode;

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

		currentNode = d3.select(this).append("g").attr("class", "tree-leaf");
		;

		currentNode.on("click", clickNode).call(nodeDrag);

		if (d.person) {

			currentNode.append("circle").attr("class", "node").attr("r", 50);

			currentNode.append("image").attr("class", "profile-image").attr(
					"xlink:href",
					function(d) {
						return d.img == "" ? "./docs/default_profile.jpg"
								: "./docs/" + d.img;
					}).attr("width", 40).attr("height", 40);

			currentNode.append("text").attr("class", "nodeLabel").attr("dy",
					"1.5em").text(function(d) {
				return d.label;
			});
		} else {

			currentNode.append("ellipse").attr("rx", 20).attr("ry", 10).attr(
					"fill", "brown").attr("cursor", "move");
		}
	});

	streamNode = svg.append("g");

	streamNode.append("circle").attr("r", 30).attr("cx", streamX - 67).attr(
			"cy", streamY + 50).attr("class", "navigator");

	streamNode.append("text").attr("class", "navigator-arrow").attr("x",
			streamX - 88).attr("y", streamY + 65).text("<").on("click",
			backMain);

	streamNode.append("circle").attr("r", 30).attr("cx",
			streamX + streamWidth + 66).attr("cy", streamY + 45).attr("class",
			"navigator");

	streamNode.append("text").attr("class", "navigator-arrow").attr("x",
			streamX + streamWidth + 50).attr("y", streamY + 60).text(">").on(
			"click", forwardMain);

	streamNode.append("rect").attr("width", streamWidth).attr("height",
			streamHeight).attr("x", streamX).attr("y", streamY).attr("rx", 20)
			.attr("ry", 20).attr("class", "data-stream");

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
			.attr("x", newTarget).transition().duration(duration).delay(
					newDelay).ease("linear").attr("x", function(d) {
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