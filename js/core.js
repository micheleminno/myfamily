var width = 1200, height = 800;

var force = d3.layout.force().size([ width, height ]).charge(-800)
		.linkDistance(300).on("tick", tick);

var drag = force.drag();

var svg = d3.select("body").append("svg").attr("width", width).attr("height",
		height);

var detail = d3.select("body").append("div").attr("class", "detail").style(
		"opacity", 0);

var link = svg.selectAll(".link"), node = svg.selectAll(".node"), doc = svg
		.selectAll(".doc");

d3.json("graph.json", function(error, graph) {

	force.nodes(graph.nodes).links(graph.links).start();

	link = link.data(graph.links).enter().append("path");

	link.each(function(d) {

		currentLink = d3.select(this);
		currentLink.attr("class", "link");
	});

	node = node.data(graph.nodes).enter().append("g");

	node.each(function(d) {

		currentNode = d3.select(this);
		if (d.label != "") {

			currentNode.append("circle").attr("class", "node").attr("r", 50)
					.call(drag);

			currentNode.append("image").attr("xlink:href", "./img/" + d.img)
					.attr("width", 40).attr("height", 40);

			currentNode.append("rect").attr("width", 40).attr("height", 40)
					.attr("class", "profile-frame");

			currentNode.append("text").attr("font-size", "12px").attr("fill",
					"white").text(function(d) {
				return d.label;
			});
		} else {

			currentNode.append("ellipse").attr("rx", 40).attr("ry", 20).attr(
					"fill", "brown").call(drag);
		}
	});

	d3.json("documents.json", function(error, documents) {

		svg.append("rect").attr("width", 800).attr("height", 40).attr("x", 200)
				.attr("y", 750).attr("class", "data-stream");

		doc = doc.data(documents.data).enter().append("g");

		doc = doc.append("image").attr("class", "doc").attr("xlink:href",
				function(d) {
					return "./img/" + d.file;
				}).attr("width", 40).attr("height", 40).attr("x", function(d) {
			return 200 + d.index * 40;
		}).attr("y", 750);

		doc.append("rect").attr("width", 40).attr("height", 40).attr("x", 200)
				.attr("y", 750).attr("class", "profile-frame");

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

	node.selectAll("circle").attr("cx", function(d) {
		return d.x;
	}).attr("cy", function(d) {
		return d.y;
	});

	node.selectAll("text").attr("x", function(d) {
		return d.x - 25;
	}).attr("y", function(d) {
		return d.y + 35;
	});

	node.selectAll("image").attr("x", function(d) {
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

	d3.select("#save").on("click", save);

	function save() {

		var data = '';

		var circles = svg.selectAll("circle");
		var json_circles = JSON.stringify(circles.data());
		data += 'var jsonCircles = ' + json_circles + ';<br><br>';

		var lines = svg.selectAll("path");
		var json_lines = JSON.stringify(lines.data());
		data += 'var jsonPaths = ' + json_lines + ';';

		d3.select("#console").html(data);
	}
}