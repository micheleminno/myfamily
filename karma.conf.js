// karma.conf.js
module.exports = function(config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine'],
    browserConsoleLogOptions: {
        terminal: true,
        level: ""
    },
    files: [

        "./bower_components/angular/angular.js",
        "./bower_components/angular-route/angular-route.js",
        "./bower_components/angular-cookies/angular-cookies.js",
        "./bower_components/jquery/dist/jquery.js",
        "./bower_components/bootstrap/dist/js/bootstrap.js",
        "./bower_components/angular-bootstrap/ui-bootstrap.js",
        "./bower_components/angular-bootstrap-datetimepicker/src/js/datetimepicker.js",
        "./bower_components/angucomplete-alt/angucomplete-alt.js",
        "./bower_components/angular-messages/angular-messages.js",
        "./bower_components/angular-mocks/angular-mocks.js",

        "./js/app.js",
        "./js/user-services.js",
        "./js/myfamily-service.js",
        "./js/controllers/loginController.js",

        './spec/jasmine_specs/LoginSpec.js',
        './spec/jasmine_specs/MyFamilyServiceSpec.js'
    ],
    exclude: [
    ],
    plugins: [
      'karma-jasmine'
    ],
    singleRun: false,
  });
};
