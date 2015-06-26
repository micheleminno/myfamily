function makeEditable(d) {

	this.on("mouseover", function() {
		d3.select(this).style("fill", "red");
	}).on("mouseout", function() {
		d3.select(this).style("fill", null);
	}).on(
			"click",
			function(d) {

				var result = prompt('Enter a new name', d.name);

				if (result) {

					d.label = result;
					var selection = d3.select(this);
					var label = selection[0][0];
					label.textContent = result;

					var node = d3.select(this.parentNode.parentNode);
					var selection = node.selectAll(".nodeLabel");
					var label = selection[0][0];
					label.textContent = result;

					$.get(serverUrl + "/" + userId + '/graph/update/'
							+ d.originalId + '?field=label&value=' + result);
				}

				d3.event.stopPropagation();
			});
}

function thumbnailMouseovered(d) {

	var selection = d3.select(this);
	selection.moveToFront();

	var doc = selection[0][0];

	var parent = d3.select(this.parentNode);

	doc.width.baseVal.value = 200;
	doc.height.baseVal.value = 200;
	doc.x.baseVal.value -= 50;
	doc.y.baseVal.value -= 50;

	if (!onDetail || doc.attributes.url.nodeValue.substr(-4) === ".pdf") {

		parent.append("text").attr("class", "thumbnailText").attr("x",
				doc.x.baseVal.value).attr("y", doc.y.baseVal.value - 20).text(
				doc.attributes.title.nodeValue);

		if (!onDetail) {

			parent.append("text").attr("class", "thumbnailText").attr("x",
					doc.x.baseVal.value).attr("y", doc.y.baseVal.value + 235)
					.text(doc.attributes.date.nodeValue);

			node.classed("node--tagged", function(n) {

				if (d.node) {

					for (nodeIndex in d.node) {

						var taggedNode = d.node[nodeIndex];
						if (taggedNode == n.originalId) {
							return true;
						}
					}
				}

				return false;
			});
		}
	}
};

function thumbnailMouseouted(d) {

	svg.selectAll(".thumbnailText").remove();
	svg.selectAll(".thumbnail-frame").remove();

	var selection = d3.select(this);
	var doc = selection[0][0];

	doc.width.baseVal.value = 100;
	doc.height.baseVal.value = 100;
	doc.x.baseVal.value += 50;
	doc.y.baseVal.value += 50;

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

function redrawStream() {

	var nodes = [];
	node.each(function(d) {

		nodes.push({
			"originalId" : d.originalId
		});
	});

	fillStream(nodes);
};

var container;
var documentToAdd;

$('#uploadDocument').click(
		function() {

			$('#uploadDocumentForm').attr('action',
					serverUrl + '/documents/upload');

			$('#uploadDocumentForm').submit();

			var filePath = $('#document-upload').val();
			fileName = filePath.substring(filePath.lastIndexOf("\\") + 1);

			var title = $('#title').val();
			var date = $('#date').val();

			var tagged = [];
			$('#add-taggedArea > li').each(function() {

				tagged.push(parseInt(this.id));
			});

			var url = serverUrl + "/documents/add/document?file=" + fileName
					+ "&title=" + title + "&date=" + date + "&tagged="
					+ JSON.stringify(tagged) + '&owner=' + userId;

			$.get(url, function(addedDoc) {

				if (addedDoc) {

					documentToAdd = addedDoc;

					$('#addDocumentModal').modal('hide');

					// Display new document
					console.log(JSON.stringify(addedDoc));
					container = svg.selectAll(".docContainer");

					addedDoc.position = {
						x : documentPosition[0],
						y : documentPosition[1]
					};

					// update position on db
					$
							.get(serverUrl + '/documents/' + addedDoc.id
									+ '/updatePosition?node=' + tagged[0]
									+ '&x=' + addedDoc.position.x + '&y='
									+ addedDoc.position.y);

					documentPosition = [];

					setTimeout(documentUploadContinueExecution, 500);

				} else {
					console.log("Document not added!");
				}
			});
		});

function documentUploadContinueExecution() {

	drawDoc(documentToAdd, container, null, null, 0, null, false);

	redrawStream();
};

$('#updateDocument').click(
		function() {

			$('#editDocumentModal').modal('hide');

			var id = $('#edit-docId').text();
			var title = $('#edit-title').val();
			var date = $('#edit-date').val();

			var tagged = [];

			$('#edit-taggedArea li').each(function() {

				personId = $(this).attr('id');
				tagged.push(parseInt(personId));
			});

			var url = serverUrl + '/documents/' + id + '/update?title=' + title
					+ '&date=' + date + '&tagged=' + JSON.stringify(tagged);
			$.get(url);
		});

var nodeIdToUpdate;
var fileName;

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

	svg.selectAll(".profile-image").filter(function(d) {

		return d.originalId == nodeIdToUpdate;

	}).attr("xlink:href", "./docs/" + fileName);

	svg.selectAll(".profile-image--selected").attr("xlink:href",
			"./docs/" + fileName);
};

function profileImageClicked(d) {

	nodeIdToUpdate = d.originalId;

	$('#profile-img-upload').val(null);
	$('#profile-img-upload').click();
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

var onDetail = false;

var docDrag = d3.behavior.drag().on("dragstart", docDragstarted).on("drag",
		docDragged).on("dragend", docDragended);

function drawDoc(doc, container, centerX, centerY, offset, maxRowSize) {

	var docNode = container.append("image");

	var x, y;

	if (doc.position) {

		x = doc.position.x;
		y = doc.position.y;

	} else {

		var defaultX = centerX / 2 - 300 + offset;
		var defaultY = centerY + 100 * Math.floor(docIndex / maxRowSize);

		x = defaultX;
		y = defaultY;

	}

	docNode
			.attr("width", 100)
			.attr("id", doc.id)
			.attr("title", doc.title)
			.attr("url", "./docs/" + doc.file)
			.attr("date", getDate(doc.date))
			.attr("height", 80)
			.attr(
					"xlink:href",
					function() {
						return doc.file.substr(-4) === ".pdf" ? "./docs/default_pdf.png"
								: "./docs/" + doc.file;
					}).attr("class", function() {

				return "myCursor-pointer-move";
			}).attr("x", x).attr("y", y).on("click", docClicked).on(
					"mouseover", thumbnailMouseovered).on("mouseout",
					thumbnailMouseouted).call(docDrag);

	docNode.on('contextmenu', d3.contextMenu(onDocumentMenu));
};

function placeDocuments(serviceUrl, selectedNode, nodeIndex, centerX, centerY,
		maxRowSize) {

	$.get(serviceUrl, function(data) {

		var documents = data.documents;

		var container = selectedNode.append("g").attr("class", "docContainer");

		var offset = 0;

		for (docIndex in documents) {

			var doc = documents[docIndex];

			drawDoc(doc, container, centerX, centerY, offset, maxRowSize);

			offset += 100;

			if (offset >= 100 * maxRowSize) {

				offset = 0;
			}
		}
	});
};

function groundClicked(d) {

	var selectedNode = d3.select(this.parentNode).moveToFront().append("g")
			.attr("class", "selection").style("pointer-events", "click");

	selectedNode.append("rect").attr("class", "ground--selected").attr("width",
			3100).attr("height", 350).attr("x", -700).attr("y", 1050).attr(
			"cursor", "auto").on('contextmenu',
			d3.contextMenu(onHeritageMenu, function() {

				documentPosition = [ this.event.x + 800, this.event.y + 800 ];
			}));

	selectedNode.append("text").attr('class', "label--selected")
			.attr("y", 1130).attr("x", -650).text("Heritage");

	onDetail = true;

	var centerX = -200;
	var centerY = 1100;
	var maxRowSize = 40;

	placeDocuments(serverUrl + "/documents?node=-1&relation=tagged",
			selectedNode, -1, centerX, centerY, maxRowSize);

	d3.event.stopPropagation();
};

var documentPosition = [];

function clickNode(d) {

	if (!d3.event || d3.event.defaultPrevented) {
		return;
	}

	onDetail = true;

	var selectedNode = d3.select(this.parentNode).moveToFront().append("g")
			.attr("class", "selection").style("pointer-events", "click");

	var centerX = width / 10;
	var centerY = height / 1.7;
	var maxRowSize = 10;

	selectedNode.append("circle").attr('r', 615).attr("cx", centerX).attr("cy",
			centerY).attr('class', "node--selected").on("click",
			profileNodeClicked).attr("cursor", "auto").on('contextmenu',
			d3.contextMenu(onSelectedNodeMenu, function() {

				documentPosition = [ this.event.x, this.event.y ];
			}));

	var profileContainer = selectedNode.append("g").on("mouseover",
			profileMouseovered).on("mouseout", profileMouseouted).on("click",
			profileNodeClicked);

	profileContainer.append("rect").attr("width", 220).attr("height", 220)
			.attr('class', "profile-frame").attr("x", centerX - 155).attr("y",
					-10);

	profileContainer.append("image").attr("width", 200).attr("height", 200)
			.attr('class', "profile-image--selected").attr("x", centerX - 145)
			.attr("y", 0).attr(
					"xlink:href",
					function(d) {
						return d.img == "" ? "./docs/default_profile.jpg"
								: "./docs/" + d.img;
					}).on("click", profileImageClicked).attr("cursor", "auto")
			.append("title").text("Click to upload a new profile image");

	selectedNode.append("text").attr('class', "label--selected").attr("y", -50)
			.attr("x", centerX - 230).text(d.label).call(makeEditable);

	placeDocuments(serverUrl + "/documents?node=" + d.originalId
			+ "&relation=tagged", selectedNode, d.originalId, centerX, centerY,
			maxRowSize);

	d3.event.stopPropagation();

};

function clickSvg(d) {

	if (!d3.event || d3.event.defaultPrevented) {
		return;
	}

	onDetail = false;
	var sel = svg.selectAll(".selection");
	sel.remove();

	var actions = svg.selectAll(".action");
	actions.remove();

	svg.selectAll(".tree-leaf").style("pointer-events", "all");
};

function zoomed() {

	container.attr("transform", "translate(" + d3.event.translate + ")scale("
			+ d3.event.scale + ")");
};

function nodeDragstarted(d) {

	d3.select(this).classed("fixed", d.fixed = true);

	if (!onDetail) {
		d3.event.sourceEvent.stopPropagation();
		d3.select(this).classed("dragging", true);
	}

	var actions = svg.selectAll(".action");
	actions.remove();
};

function nodeDragged(d) {

	if (!onDetail) {
		d3.select(this).attr("x", d.x = d3.event.x).attr("y", d.y = d3.event.y);
	}
}

function nodeDragended(d) {

	if (!onDetail) {
		d3.select(this).classed("dragging", false);

		$.get(serverUrl + '/' + userId + '/view/' + selectedViewId
				+ '/update?node=' + d.originalId + '&x=' + d.x + '&y=' + d.y);
	}
};

function docDragstarted(d) {

	d3.event.sourceEvent.stopPropagation();

	svg.selectAll(".thumbnailText").remove();
	d3.select(this).classed("dragging", true);
};

function docDragged(d) {

	var sel = d3.select(this);
	sel.attr("x", d3.event.x - parseInt(sel.attr("width")) / 2).attr("y",
			d3.event.y - parseInt(sel.attr("height")) / 2);
};

function docDragended(d) {

	var sel = d3.select(this);
	sel.classed("dragging", false);

	var document = sel[0][0];
	var x = document.x.baseVal.value;
	var y = document.y.baseVal.value;
	var id = document.attributes.id.nodeValue;

	var nodeId = d ? d.originalId : -1;

	$.get(serverUrl + '/documents/' + id + '/updatePosition?node=' + nodeId
			+ '&x=' + x + '&y=' + y);
};

function removeDocument(docId) {

	svg.selectAll(".docContainer .myCursor-pointer-move").filter(function() {

		var sel = d3.select(this);

		var document = sel[0][0];
		var id = document.attributes.id.nodeValue;
		return id == docId;

	}).remove();

	redrawStream();
};

function isAlreadyTagged(nodeId, taggedAreaId) {

	var tagged = [];
	$(taggedAreaId + ' li').each(function() {

		tagged.push(parseInt(this.id));
	});

	return tagged.indexOf(nodeId) > -1;
}

function fillTaggedPersons(nodes, mode) {

	$('#' + mode + '-taggedPersons').html('');

	for (nodeIndex in nodes) {

		var node = nodes[nodeIndex];
		if (node.person
				&& !isAlreadyTagged(node.originalId, '#' + mode + '-taggedArea')) {

			$('#' + mode + '-taggedPersons').append(
					'<li id="' + node.id + '"><a href="#">' + node.label
							+ '</a></li>');
		}
	}

	$('#' + mode + '-taggedPersons li')
			.on(
					'click',
					function() {

						personId = $(this).attr('id');
						personLabel = $(this).find('a').text();
						$('#' + mode + '-taggedArea')
								.append(
										'<li id="'
												+ personId
												+ '">'
												+ personLabel
												+ '<a id="remove-'
												+ personId
												+ '" style="margin-left: 5px" href="#">(remove)</a></li>');

						fillTaggedPersons(nodes, mode);
					});
};

var onSelectedNodeMenu = [ {
	title : 'Add document',
	action : function(elm, d, i) {

		$('#add-taggedArea').html('');
		$('#add-taggedArea').append(
				'<li id="' + d.originalId + '">' + d.label + '</li>');

		fillTaggedPersons(nodes, 'add');

		$('#addDocumentModal').modal('show');
	}
} ];

var onHeritageMenu = [ {
	title : 'Add document',
	action : function(elm, d, i) {

		$('#add-taggedArea').html('');
		$('#add-taggedArea').append('<li id="-1">Heritage</li>');

		$('#addDocumentModal #tagged').hide();
		$('#addDocumentModal').modal('show');
	}
} ];

var onDocumentMenu = [
		{
			title : 'Edit',
			action : function(elm, d, i) {

				$
						.get(
								serverUrl + '/documents/' + elm.id,
								function(data) {

									if (data.document != -1) {

										$('#edit-taggedArea').html('');

										var tagged = data.document.tagged;
										for ( var taggedIndex in tagged) {

											tag = tagged[taggedIndex];
											if (tag.id != -1) {
												$('#edit-taggedArea')
														.append(
																'<li id="'
																		+ tag.id
																		+ '">'
																		+ tag.label
																		+ '<a id="remove-'
																		+ tag.id
																		+ '" style="margin-left: 5px" href="#">(remove)</a>'
																		+ '</li>');
											}
										}

										$('#edit-taggedArea li a').click(
												function() {

													fillTaggedPersons(nodes,
															'edit');
													$(
															'#edit-taggedArea '
																	+ personId)
															.remove();
												});

										fillTaggedPersons(nodes, 'edit');

										$('#edit-docId').text(data.document.id);
										$('#edit-file')
												.text(data.document.file);
										$('#edit-title').val(
												data.document.title);
										$('#edit-date').val(data.document.date);

										$('#editDocumentModal').modal('show');
									}
								});
			}
		},
		{
			title : 'Remove',
			action : function(elm, d, i) {

				$.get(serverUrl + '/documents/' + elm.id + '/remove',
						function() {

							removeDocument(elm.id);
						});
			}
		} ];
