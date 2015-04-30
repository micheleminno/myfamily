var serverUrl = 'http://localhost:8090';

var width = 1800, height = 1200;

var force = d3.layout.force().size([ width, height ]).charge(-800)
		.linkDistance(300).on("tick", tick);

var drag = force.drag().on("dragend", dragend);

var svg = d3.select("body").append("svg").attr("width", width).attr("height",
		height).on("click", clickSvg);

var detail = d3.select("body").append("div").attr("class", "detail").style(
		"opacity", 0);

var link = svg.selectAll(".link"), node = svg.selectAll(".node"), doc = svg
		.selectAll(".doc");

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
		
		currentNode.on("click", clickNode);
		
		if (d.person) {

			currentNode.append("circle").attr("class", "node").attr("r", 50)
					.call(drag);

			currentNode.append("image").attr("class", "profile-image").attr(
					"cursor", "move").attr("xlink:href", "./img/" + d.img)
					.attr("width", 40).attr("height", 40).call(drag);

			// currentNode.append("rect").attr("width", 40).attr("height", 40)
			// .attr("class", "profile-frame");

			currentNode.append("text").attr("class", "label")
					.attr("dy", ".40em").text(function(d) {
						return d.label;
					});
		} else {

			currentNode.append("ellipse").attr("rx", 20).attr("ry", 10).attr(
					"fill", "brown").call(drag);
		}
	});

	d3.json("documents.json", function(error, documents) {

		svg.append("rect").attr("width", 800).attr("height", 40).attr("x", 200)
				.attr("y", 1150).attr("class", "data-stream");

		doc = doc.data(documents.data).enter().append("g");

		doc = doc.append("image").attr("class", "doc").attr("xlink:href",
				function(d) {
					return "./img/" + d.file;
				}).attr("width", 40).attr("height", 40).attr("x", function(d) {
			return 200 + d.index * 40;
		}).attr("y", 1150);

		doc.append("rect").attr("width", 40).attr("height", 40).attr("x", 200)
				.attr("y", 1150).attr("class", "profile-frame");

		doc.on("mouseover", docMouseovered).on("mouseout", docMouseouted);

	});
});

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

	node.selectAll(".profile-frame").attr("x", function(d) {
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