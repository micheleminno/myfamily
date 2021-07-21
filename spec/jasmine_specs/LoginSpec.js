describe('LoginController', function() {

  var $rootScope, $scope, $location, $controller, loginCtrl;

  beforeEach(module('main'));

  beforeEach(inject(function(_$rootScope_, _$controller_, _$location_) {
        $rootScope = _$rootScope_;
        $location = _$location_;
        $scope = $rootScope.$new();
        $controller = _$controller_;

        loginCtrl = $controller('LoginCtrl', {'$rootScope' : $rootScope, '$scope': $scope});
    }));

    it('should exist', function() {
          expect(loginCtrl).toBeDefined();
    });

    it('should register a new user', function() {

        $scope.username = "michele";
        $scope.credentials = "ABC123";
        $scope.email = "mic.min@gmail.com";

        $scope.registerNewUser();

        expect($scope.user).toBeDefined();
        expect($location.path()).toEqual('/home');
    });

 });
