function docMouseovered(d) {

	detail.transition().duration(200).style("opacity", .85);
	detail.html("<img src= './img/" + d.file + "' />");
};

function docMouseouted(d) {

	//detail.html("");
};
