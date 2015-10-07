/**
 * Created by daniele on 15/09/15.
 */

controllers.controller('FileUploadController', ['$scope', 'FileUploader', 'dateFilter', function($scope, FileUploader, dateFilter) {

        var uploader = $scope.uploader = new FileUploader({
            url: 'http://localhost:8091/documents/upload'
        });

        // FILTERS

        uploader.filters.push({
            name: 'customFilter',
            fn: function(item /*{File|FileLikeObject}*/, options) {
                return this.queue.length < 10;
            }
        });

        // CALLBACKS

        uploader.onWhenAddingFileFailed = function(item /*{File|FileLikeObject}*/, filter, options) {
            console.info('onWhenAddingFileFailed', item, filter, options);
        };
        uploader.onAfterAddingFile = function(fileItem) {
            console.info('onAfterAddingFile', fileItem);
        };
        uploader.onAfterAddingAll = function(addedFileItems) {
            console.info('onAfterAddingAll', addedFileItems);
        };
        uploader.onBeforeUploadItem = function(item) {
            console.info('onBeforeUploadItem', item);
        };
        uploader.onProgressItem = function(fileItem, progress) {
            console.info('onProgressItem', fileItem, progress);
        };
        uploader.onProgressAll = function(progress) {
            console.info('onProgressAll', progress);
        };
        uploader.onSuccessItem = function(fileItem, response, status, headers) {
            console.info('onSuccessItem', fileItem, response, status, headers);

            if(status===200){
                $scope.uploadNewDocument(fileItem.file.name, fileItem.dataTitle, dateFilter(fileItem.dataDate, 'dd/MM/yyyy'), fileItem.dataUsers);
            }
        };
        uploader.onErrorItem = function(fileItem, response, status, headers) {
            console.info('onErrorItem', fileItem, response, status, headers);
        };
        uploader.onCancelItem = function(fileItem, response, status, headers) {
            console.info('onCancelItem', fileItem, response, status, headers);
        };
        uploader.onCompleteItem = function(fileItem, response, status, headers) {
            console.info('onCompleteItem', fileItem, response, status, headers);
        };
        uploader.onCompleteAll = function() {
            console.info('onCompleteAll');
        };

        console.info('uploader', uploader);
}]);
controllers.controller('UploadItemController', ['$scope', function($scope) {

    $scope.init = function(item){

        $scope.uploadItem = item;

        $scope.itemTaggableUsers = angular.copy($scope.taggableUsers);
        $scope.itemTaggedUsers = angular.copy($scope.taggedUsers);

        $scope.addTag = function(user){
            $scope.itemTaggableUsers.splice($scope.itemTaggableUsers.indexOf(user), 1);
            $scope.itemTaggedUsers.push(user);
        };

        $scope.removeTag = function(user){
            $scope.itemTaggedUsers.splice($scope.itemTaggedUsers.indexOf(user), 1);
            $scope.itemTaggableUsers.push(user);
        };

        $scope.uploadItem.dataUsers = $scope.itemTaggedUsers;
    };
}]);