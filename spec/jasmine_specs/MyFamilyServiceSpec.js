describe('MyFamilyService', function() {

  var $rootScope, $scope, $injector, myfamilyService;

  beforeEach(module('main'));

  beforeEach(function() {
          originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
          jasmine.DEFAULT_TIMEOUT_INTERVAL = 9000;
  });

  beforeEach(inject(function(_$rootScope_, _$injector_) {

        $rootScope = _$rootScope_;
        $scope = $rootScope.$new();
        $injector = angular.injector(['main', function($provide) {
                var $rootElement = angular.element(document.querySelector('body'));
                $provide.value('$rootElement', $rootElement);
            }
        ]);
        myfamilyService = $injector.get('MyFamilyService');
    }));

    afterEach(function() {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
    });

    it('should exist', function() {
          expect(myfamilyService).toBeDefined();
    });

    it('should get the server url', function() {

        var url = myfamilyService.getServerUrl();
        expect(url).toEqual(jasmine.any(String));
    });

    it('should get the file path', function() {

        var filePath = myfamilyService.getFilePath();
        expect(filePath).toEqual(jasmine.any(String));
    });

    // Temporarely disabled
    xit('should send an email', function() {

        return myfamilyService.sendMail("Testing myfamily service",
                                                "This is a test",
                                                "michele.minno@gmail.com")
            .then(function (result) {

                console.log(result);
                expect(result).toEqual(jasmine.any(String));
            });
    });

    it('should get all the users with a specific name and relatives', function() {

        return myfamilyService.getUsers("Michele", "",
                                        "", "",
                                        "", "")
            .then(function (result) {

                expect(result.data).toEqual(jasmine.any(Array));
            });
    });

    var addedUserId;

    it('should add a new user by name', function() {

        return myfamilyService.addUser("Michele AddByName")
            .then(function (result) {

                addedUserId = result;
                expect(result).toBeDefined();
                expect(result).toEqual(jasmine.any(Number));
            });
    });


    it('should add a new user by node', function() {

        return myfamilyService.internalRegisterUserFromNode("Michele AddByNode",
                                                            "ABC123",
                                                            "mic.min@gmail.com",
                                                            addedUserId)
            .then(function (result) {

                expect(result).toBeDefined();
                expect(result.id).toEqual(jasmine.any(Number));
            });
    });

    it('should add undefined relatives to a user', function() {

        return myfamilyService.addRelatives(addedUserId, undefined, undefined,
                                            undefined, undefined, undefined)
            .then(function (result) {

                expect(result).toBeDefined();
                expect(result).toEqual(jasmine.any(String));
            });
    });

    it('should manage adding a new user', function() {

        return myfamilyService.manageUserAdding(addedUserId, "Michele Manage",
                                               "ABC123", "mic.min@gmail.com", undefined,
                                               undefined, undefined,
                                               undefined, undefined)
            .then(function(result) {

                expect(result).toBeDefined();
                expect(result.id).toEqual(jasmine.any(Number));
            });
    });

    it('should make nested calls', function() {

        return myfamilyService.testNestedCalls("call 1", "call 2")
            .then(function(result) {

                expect(result).toBeDefined();
                expect(result).toEqual(jasmine.any(String));
            });
    });

    it('should register a new user', function() {

        return myfamilyService.registerNewUser("Michele Register",
                                               "ABC123", "mic.min@gmail.com", undefined,
                                               undefined, undefined,
                                               undefined, undefined)
            .then(function (result) {

                expect(result).toBeDefined();
                expect(result.id).toEqual(jasmine.any(Number));
            });
    });

 });
