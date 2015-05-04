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

function docClicked(d) {

	var selection = d3.select(this);
	var doc = selection[0][0];

	selectedNode.selectAll("rect.profile-frame--selected").classed(
			"profile-frame--selected", false).attr("class",
			"profile-frame--invisible");

	doc.nextSibling.className.baseVal = "profile-frame--selected";

	selectedNode.selectAll(".zoomed-doc--selected").attr("xlink:href",
			doc.href.baseVal);

	d3.event.stopPropagation();
};

function zoomedDocClicked(d) {

	var selection = d3.select(this);
	var grandParent = d3.select(this.parentNode.parentNode);

	var doc = selection[0][0];

	grandParent.append("image").attr("class", "zoomedDoc").moveToFront().attr("width", 1200).attr(
			"height", 1200).attr("xlink:href", doc.href.baseVal).attr("x",
			d.x - 400).attr("y", d.y - 500);
	grandParent.append("text").attr("class", "closeDocText").attr("x",
			d.x + 710).attr("y", d.y - 290).text("[X]").on("click", closeDocClicked);

	d3.event.stopPropagation();
};

function closeDocClicked() {
	
	selectedNode.selectAll(".zoomedDoc").remove();
	selectedNode.selectAll(".closeDocText").remove();
}

var selectedNode;

function clickNode(d) {

	if (d3.event.defaultPrevented) {
		return;
	}

	selectedNode = d3.select(this).moveToFront().append("g").attr("class",
			"selection");

	selectedNode.append("circle").attr('r', 400).attr("cx", d.x)
			.attr("cy", d.y).attr('class', "node--selected");

	selectedNode.append("image").attr("width", 200).attr("height", 200).attr(
			'class', "profile-image--selected").attr("x", d.x - 100).attr("y",
			d.y - 320).attr("xlink:href", "./img/" + d.img);

	selectedNode.append("text").attr('class', "label--selected").attr("y",
			d.y - 350).attr("x", d.x - 50).text(d.label);

	$.get(serverUrl + "/documents/" + d.index, function(documentsString) {

		var documents = JSON.parse(documentsString);

		var containerNode = selectedNode.append("g");
		var streamWidth = 600;
		containerNode.append("rect").attr("width", streamWidth).attr("height",
				80).attr("x", d.x - 300).attr("y", d.y).attr("class",
				"data-stream--selected");

		containerNode.append("circle").attr("r", 25).attr("cx", d.x - 350)
				.attr("cy", d.y + 40).attr("class", "navigator--selected");

		containerNode.append("text").attr("class", "navigator-arrow--selected")
				.attr("x", d.x - 360).attr("y", d.y + 47).text("<");

		containerNode.append("circle").attr("r", 25).attr("cx",
				d.x + streamWidth - 250).attr("cy", d.y + 40).attr("class",
				"navigator--selected");

		containerNode.append("text").attr("class", "navigator-arrow--selected")
				.attr("x", d.x + streamWidth - 258).attr("y", d.y + 47).text(
						">");

		var offset = 0;
		var docRowSize = 6;

		var minIndex = (documents.length - docRowSize) > 0 ? documents.length
				- docRowSize : 0;

		for (docIndex in documents) {

			if (docIndex >= minIndex) {

				var doc = documents[docIndex];

				if (docIndex == minIndex) {

					containerNode.append("rect").attr("width", 400).attr(
							"height", 400).attr("x", d.x - 210).attr("y",
							d.y + 150).attr("class", "doc-container");

					containerNode.append("image").attr("width", 400).attr(
							"height", 400)
							.attr('class', "zoomed-doc--selected").attr(
									"xlink:href", "./img/" + doc.file).attr(
									"x", d.x - 210 + offset).attr("y",
									d.y + 120).on("click", zoomedDocClicked);
				}

				var thumbnail = selectedNode.append("g");
				var docNode = thumbnail.append("image");

				docNode.attr("width", 100).attr("height", 80).attr('class',
						"doc--selected")
						.attr("xlink:href", "./img/" + doc.file).attr("y", d.y)
						.attr("x", d.x - 300 + offset).on("click", docClicked);

				var frameClass = "profile-frame--invisible";

				if (docIndex == minIndex) {
					frameClass = "profile-frame--selected";
				}

				thumbnail.append("rect").attr("width", 100).attr("height", 80)
						.attr('class', frameClass).attr("y", d.y).attr("x",
								d.x - 300 + offset);

				offset += 100;
			}
		}
	});

	d3.event.stopPropagation();
};

function clickSvg(d) {

	var sel = svg.selectAll(".selection");
	sel.remove();
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
