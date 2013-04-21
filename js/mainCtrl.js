'use strinct';

  //angular.element(document.getElementById('clippee-app')).scope()
patshare  = angular.module('patternshare', ['LocalStorageModule'])
  /* advance browser interaction
  .config(function($locationProvider, $routeProvider) { 
    $locationProvider.html5Mode(true); 
  })*/
  .config(function($locationProvider, $routeProvider) {
    $locationProvider.hashPrefix("!");
    $locationProvider.html5Mode(false);
    $routeProvider.when('/main', {templateUrl: 'partials/home.html', controller: 'main'})
      .when('/patterns', {templateUrl: 'partials/patterns.html', controller: 'patternCtl', resolve: patternCtl.resolve})
      .when('/error', {templateUrl: 'partials/error.html', controller: 'error'})
      .otherwise({redirectTo: '/main'});
  });

function patternCtl ($scope, $http, localStorageService, $location, patterns, settings) { //controller!
    //check the imports are resolved ok, otherwise error
  if(patterns == "error" || settings == "error") $location.path('/error');
    //save model values
  $scope.patterns = patterns;
  $scope.settings = settings;
  $scope.ui = {
    'actPattern': null,
    'settingsEdit': false
  };
  $scope.app = {
    'units': {
      'cms': 'centimeters',
      'ins': 'inches'
    }
  };
    //load pattern when the selected pattern (actPattern.file) change
  $scope.$watch('ui.actPattern.file', function(){ 
    if(!$scope.ui.actPattern) return; //if null, exit
    $http.get('./data/patterns/' + $scope.ui.actPattern.file)
      .success(function(data) {
          //save settings to localstorage for further use
        $scope.ui.actPattern.pattern = data.pattern;
      })
      .error(function(){
        console.log('error loading pattern' + $scope.ui.actPattern.file);
        $scope.ui.actPattern = null;
      });
  });

    //keep localstorage settings updated
  $scope.$watch('settings', function(){
    localStorageService.add('settings', JSON.stringify($scope.settings)); //update localstorage
  }, true);

    //translate values to current units when we change the units value
  $scope.$watch('settings.units', function(){
    if(!$scope.ui.actPattern) return; //exit if no pattern loaded
      //set the conversion value
    var transf = $scope.settings.units === 'cms' ? 2.54 : 0.3937007874;
      //convert!
    angular.forEach($scope.ui.actPattern.pattern.defaults, function(value, key) {
      $scope.ui.actPattern.pattern.defaults[key] = value * transf;
    });
      //save settings locally
    localStorageService.add('settings', JSON.stringify($scope.settings)); //update localstorage
  });

}

  //requests before the pattern controler is loaded
patternCtl.resolve = {
  settings: function($q, $http, localStorageService) {
    var deferred = $q.defer();
    var settings = JSON.parse(localStorageService.get('settings'));
    if(settings){
      deferred.resolve(settings); //return the settings from localstorage
    } else {
      $http.get('./data/settings.json')
        .success(function(data) {
            //save settings to localstorage for further use
          localStorageService.add('settings', JSON.stringify(data)); //update localstorage
          deferred.resolve(data); //return the settings from defaults
        })
        .error(function(){
            //still no luck, set default setings
          deferred.resolve("error");
        });
    }
    return deferred.promise;
  },
  patterns: function($q, $http, localStorageService) {
    var deferred = $q.defer();
    var patterns = JSON.parse(localStorageService.get('patterns'));
    if(patterns){
      deferred.resolve(patterns); //return the settings from localstorage
    } else {
      $http.get('./data/patterns/pattern_list.json')
        .success(function(data) {
          console.log(data);
            //save patterns to localstorage for further use
          localStorageService.add('patterns', JSON.stringify(data)); //update localstorage
          deferred.resolve(data); //return the settings from defaults
        })
        .error(function(){
            //still no luck, set default setings
          deferred.resolve("error");
        });
    }
    return deferred.promise;
  }
};

function main ($scope, $http, $location) { //controller!
    //home controller, nothing here, just plain html
}
function error ($scope, $http, $location) { //controller!
    //error controller, nothing here, just plain html
}
