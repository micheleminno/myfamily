function docMouseovered(d) {

	var selection = d3.select(this);
	selection.moveToFront();

	var doc = selection[0][0];

	doc.width.baseVal.value = 200;
	doc.height.baseVal.value = 200;
	doc.x.baseVal.value -= 50;
	doc.y.baseVal.value -= 50;

	node.classed("node--tagged", function(n) {

		if (d.tagged) {
			var nodeIndex = d.tagged.indexOf(n.index);
			if (nodeIndex > -1) {
				return true;
			}
		}

		return false;
	});
};

function docMouseouted(d) {

	var selection = d3.select(this);
	var doc = selection[0][0];

	doc.width.baseVal.value = 100;
	doc.height.baseVal.value = 100;
	doc.x.baseVal.value += 50;
	doc.y.baseVal.value += 50;

	node.classed("node--tagged", false);
};

function clickNode(d) {

	if (d3.event.defaultPrevented) {
		return;
	}

	var selection = d3.select(this);
	selection.moveToFront();

	selection.append("circle").attr('r', 400).attr("cx", d.x).attr("cy", d.y)
			.attr('class', "node--selected");

	selection.append("image").attr("width", 200).attr("height", 200).attr(
			'class', "profile-image--selected").attr("x", d.x - 100).attr("y",
			d.y - 320).attr("xlink:href", "./img/" + d.img);

	selection.append("text").attr('class', "label--selected").attr("y",
			d.y - 350).attr("x", d.x - 50).text(d.label);

	$.get(serverUrl + "/documents/" + d.index, function(documentsString) {

		var documents = JSON.parse(documentsString);
		
		var offset = 0;
		for (docIndex in documents) {

			var doc = documents[docIndex];

			selection.append("image").attr("width", 200).attr("height", 200)
					.attr('class', "doc--selected").attr("xlink:href",
							"./img/" + doc.file).attr("y", d.y + 100).attr("x",
							d.x - 200 + offset);
			offset += 50;
		}
	});

	d3.event.stopPropagation();
};

function clickSvg(d) {

	svg.selectAll(".node--selected").remove();
	svg.selectAll(".doc--selected").remove();
	svg.selectAll(".profile-image--selected").remove();
	svg.selectAll(".label--selected").remove();
};

function zoomed() {

	container.attr("transform", "translate(" + d3.event.translate + ")scale("
			+ d3.event.scale + ")");
}

function dragstarted(d) {

	d3.event.sourceEvent.stopPropagation();
	d3.select(this).classed("dragging", true);
}

function dragged(d) {

	d3.select(this).attr("cx", d.x = d3.event.x).attr("cy", d.y = d3.event.y);

}

function dragended(d) {

	d3.select(this).classed("dragging", false);

	$.get(serverUrl + '/updateNode?label=' + d.label + '&x=' + d.x + '&y='
			+ d.y);
}
