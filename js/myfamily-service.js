app.service('MyFamilyService', function($http, $q) {

	var serverUrl = 'http://localhost:8091';

	this.getUser = function(name) {

		var deferred = $q.defer();

		$http.get(serverUrl + "/graph/namesakes?name=" + name).success(
				function(namesakes) {

					deferred.resolve(namesakes);
				});

		return deferred.promise;
	};

	this.addUser = function(name) {

		var deferred = $q.defer();

		$http.get($.get(serverUrl + '/graph/addPerson?name=' + name).success(
				function(data) {

					if (data) {

						deferred.resolve(data.personId);
					}
				}));

		return deferred.promise;
	};

});