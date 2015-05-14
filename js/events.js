function thumbnailMouseovered(d) {

	var selection = d3.select(this);
	selection.moveToFront();

	var doc = selection[0][0];

	var parent = d3.select(this.parentNode);

	if (!onDetail || doc.attributes.url.nodeValue.substr(-4) === ".pdf") {

		doc.width.baseVal.value = 200;
		doc.height.baseVal.value = 200;
		doc.x.baseVal.value -= 50;
		doc.y.baseVal.value -= 50;

		parent.append("text").attr("class", "thumbnailText").attr("x",
				doc.x.baseVal.value).attr("y", doc.y.baseVal.value - 20).text(
				doc.attributes.title.nodeValue);

		if (!onDetail) {
			parent.append("text").attr("class", "thumbnailText").attr("x",
					doc.x.baseVal.value).attr("y", doc.y.baseVal.value + 235)
					.text(doc.attributes.date.nodeValue);
		}
	}

	node.classed("node--tagged", function(n) {

		if (d.tagged) {

			for (taggedIndex in d.tagged) {

				var taggedNode = d.tagged[taggedIndex];
				if (taggedNode["node"] == parseInt(n.index)) {
					return true;
				}
			}
		}

		return false;
	});
};

function thumbnailMouseouted(d) {

	svg.selectAll(".thumbnailText").remove();
	svg.selectAll(".thumbnail-frame").remove();

	var selection = d3.select(this);
	var doc = selection[0][0];

	if (!onDetail || doc.attributes.url.nodeValue.substr(-4) === ".pdf") {

		doc.width.baseVal.value = 100;
		doc.height.baseVal.value = 100;
		doc.x.baseVal.value += 50;
		doc.y.baseVal.value += 50;
	}

	node.classed("node--tagged", false);
};

function profileMouseovered(d) {

	var selection = d3.select(this);
	selection.moveToFront();

	var container = selection[0][0];

	rect = container.children[0];

	rect.width.baseVal.value = 660;
	rect.height.baseVal.value = 660;
	rect.x.baseVal.value -= 170;
	rect.y.baseVal.value -= 150;

	image = container.children[1];

	image.width.baseVal.value = 600;
	image.height.baseVal.value = 600;
	image.x.baseVal.value -= 150;
	image.y.baseVal.value -= 130;
};

function profileMouseouted(d) {

	var selection = d3.select(this);

	var container = selection[0][0];

	rect = container.children[0];

	rect.width.baseVal.value = 220;
	rect.height.baseVal.value = 220;
	rect.x.baseVal.value += 170;
	rect.y.baseVal.value += 150;

	image = container.children[1];

	image.width.baseVal.value = 200;
	image.height.baseVal.value = 200;
	image.x.baseVal.value += 150;
	image.y.baseVal.value += 130;
};

function thumbnailClicked(d) {

	svg.selectAll(".docText").remove();
	svg.selectAll(".zoomedDoc").remove();
	svg.selectAll(".frame").remove();

	var selection = d3.select(this);

	var parent = d3.select(this.parentNode);

	var doc = selection[0][0];

	if (doc.attributes.url.nodeValue.substr(-4) === ".pdf") {

		window.open(siteUrl + doc.attributes.url.nodeValue.substr(1), '_blank');

	} else {

		parent = parent.append("g").attr("class", "selection");

		parent.append("rect").attr("class", "frame").attr("width", 1205).attr(
				"height", 1014).attr("xlink:href", doc.href.baseVal).attr("x",
				997.5).attr("y", -102);
		parent.append("image").attr("class", "zoomedDoc").moveToFront().attr(
				"width", 1200).attr("height", 1000).attr("xlink:href",
				doc.href.baseVal).attr("x", 1000).attr("y", -100);

		parent.append("text").attr("class", "docText").attr("x", 1850).attr(
				"y", 1000).text(doc.attributes.title.nodeValue);

		parent.append("text").attr("class", "docText").attr("x", 1850).attr(
				"y", 1100).text(doc.attributes.date.nodeValue);

		parent.append("text").attr("class", "closeDoc").attr("x", 2125).attr(
				"y", -130).text("[close]").attr("cursor", "pointer").on(
				"click", closeDocClicked);
	}

	d3.event.stopPropagation();
};

function docClicked(d) {

	if (d3.event.defaultPrevented) {
		return;
	}

	svg.selectAll(".docText").remove();
	svg.selectAll(".zoomedDoc").remove();

	var selection = d3.select(this);

	var grandParent = d3.select(this.parentNode.parentNode);

	var doc = selection[0][0];

	if (doc.attributes.url.nodeValue.substr(-4) === ".pdf") {

		window.open(siteUrl + doc.attributes.url.nodeValue.substr(1), '_blank');

	} else {

		grandParent.append("rect").attr("class", "frame").attr("width", 1205)
				.attr("height", 1204).attr("xlink:href", doc.href.baseVal)
				.attr("x", 997.5).attr("y", -202).on("click", zoomedDocClicked)
				.attr("cursor", "auto");

		grandParent.append("image").attr("class", "zoomedDoc").moveToFront()
				.attr("width", 1200).attr("height", 1200).attr("xlink:href",
						doc.href.baseVal).attr("x", 1000).attr("y", -200).on(
						"click", zoomedDocClicked).attr("cursor", "auto");

		grandParent.append("text").attr("class", "docText").attr("x", 1850)
				.attr("y", 1120).text(doc.attributes.title.nodeValue);

		grandParent.append("text").attr("class", "docText").attr("x", 1800)
				.attr("y", 1050).text(doc.attributes.date.nodeValue);

		grandParent.append("text").attr("class", "closeDoc").attr("x", 2125)
				.attr("y", -220).text("[close]").attr("cursor", "pointer").on(
						"click", closeDocClicked);

	}

	d3.event.stopPropagation();
};

function closeDocClicked() {

	svg.selectAll(".zoomedDoc").remove();
	svg.selectAll(".frame").remove();
	svg.selectAll(".docText").remove();
	svg.selectAll(".closeDoc").remove();

	d3.event.stopPropagation();
}

function profileNodeClicked(d) {

	d3.event.stopPropagation();
}

function zoomedDocClicked(d) {

	d3.event.stopPropagation();
}

function backMain() {

	if (currentPage > 0) {
		currentPage--;
		populateThumbnails(currentPage, true);
	}

	d3.event.stopPropagation();
}

function forwardMain() {

	if (currentPage < maxPage) {
		currentPage++;
		populateThumbnails(currentPage, false);
	}

	d3.event.stopPropagation();
}

var selectedNode;
var onDetail = false;

var docDrag = d3.behavior.drag().on("dragstart", docDragstarted).on("drag",
		docDragged).on("dragend", docDragended);

function clickNode(d) {

	if (d3.event.defaultPrevented) {
		return;
	}

	onDetail = true;

	selectedNode = d3.select(this.parentNode).moveToFront().append("g").attr(
			"class", "selection").style("pointer-events", "click");

	var centerX = width / 10;
	var centerY = height / 1.7;
	var maxRowSize = 10;

	selectedNode.append("circle").attr('r', 650).attr("cx", centerX).attr("cy",
			centerY).attr('class', "node--selected").on("click",
			profileNodeClicked).attr("cursor", "auto");

	var profileContaner = selectedNode.append("g").on("mouseover",
			profileMouseovered).on("mouseout", profileMouseouted);

	profileContaner.append("rect").attr("width", 220).attr("height", 220).attr(
			'class', "profile-frame").attr("x", centerX - 155).attr("y", -10);

	profileContaner.append("image").attr("width", 200).attr("height", 200)
			.attr('class', "profile-image--selected").attr("x", centerX - 145)
			.attr("y", 0).attr(
					"xlink:href",
					function(d) {
						return d.img == "" ? "./docs/default_profile.jpg"
								: "./docs/" + d.img;
					}).on("click", profileNodeClicked).attr("cursor", "auto");

	selectedNode.append("text").attr('class', "label--selected").attr("y", -50)
			.attr("x", centerX - 230).text(d.label);

	$
			.get(
					serverUrl + "/documents/" + d.index,
					function(documentsString) {

						var documents = JSON.parse(documentsString);

						var container = selectedNode.append("g");

						var offset = 0;

						for (docIndex in documents) {

							var doc = documents[docIndex];

							var docNode = container.append("image");

							var defaultX = centerX / 2 + offset;
							var defaultY = centerY + 100
									* Math.floor(docIndex / maxRowSize);

							var filtered = doc.tagged.filter(function(n) {
								return n.node == d.index;
							});

							var x, y;

							if (filtered) {

								x = filtered[0].position ? filtered[0].position.x
										: defaultX;
								y = filtered[0].position ? filtered[0].position.y
										: defaultY;

							} else {

								x = defaultX;
								y = defaultY;
							}

							docNode
									.attr("width", 100)
									.attr("id", doc.index)
									.attr("title", doc.title)
									.attr("url", "./docs/" + doc.file)
									.attr("date", getDate(doc))
									.attr("height", 80)
									.attr(
											"xlink:href",
											function() {
												return doc.file.substr(-4) === ".pdf" ? "./docs/default_pdf.png"
														: "./docs/" + doc.file;
											}).attr("class",
											"myCursor-pointer-move").attr("x",
											x).attr("y", y).on("mouseover",
											thumbnailMouseovered).on(
											"mouseout", thumbnailMouseouted)
									.on("click", docClicked).call(docDrag);

							offset += 100;
							if (offset >= 100 * maxRowSize) {
								offset = 0;
							}
						}
					});

	d3.event.stopPropagation();
};

function clickSvg(d) {

	if (d3.event.defaultPrevented) {
		return;
	}

	onDetail = false;
	var sel = svg.selectAll(".selection");
	sel.remove();

	svg.selectAll(".tree-leaf").style("pointer-events", "all");
};

function zoomed() {

	container.attr("transform", "translate(" + d3.event.translate + ")scale("
			+ d3.event.scale + ")");
}

function nodeDragstarted(d) {

	if (!onDetail) {
		d3.event.sourceEvent.stopPropagation();
		d3.select(this).classed("dragging", true);
	}
}

function nodeDragged(d) {

	if (!onDetail) {
		d3.select(this).attr("x", d.x = d3.event.x).attr("y", d.y = d3.event.y);
	}
}

function nodeDragended(d) {

	if (!onDetail) {
		d3.select(this).classed("dragging", false);

		$.get(serverUrl + '/updateNode?label=' + d.label + '&x=' + d.x + '&y='
				+ d.y);
	}
}

function docDragstarted(d) {

	d3.event.sourceEvent.stopPropagation();
	svg.selectAll(".thumbnailText").remove();
	d3.select(this).classed("dragging", true);
}

function docDragged(d) {

	var sel = d3.select(this);
	sel.attr("x", d.x = d3.event.x - parseInt(sel.attr("width")) / 2).attr("y",
			d.y = d3.event.y - parseInt(sel.attr("height")) / 2);
}

function docDragended(d) {

	var sel = d3.select(this);
	sel.classed("dragging", false);

	var document = sel[0][0];
	var x = document.x.baseVal.value;
	var y = document.y.baseVal.value;
	var id = document.attributes.id.nodeValue;

	$.get(serverUrl + '/updateDoc?node=' + d.index + '&index=' + id + '&x=' + x
			+ '&y=' + y);
}
