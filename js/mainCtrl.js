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
        $scope.generateMeasuments(data.pattern);
        $scope.draw();
      })
      .error(function(){
        console.log('error loading pattern' + $scope.ui.actPattern.file);
        $scope.ui.actPattern = null;
      });
  });

    //keep localstorage settings updated
  $scope.$watch('settings', function(){
    localStorageService.add('settings', JSON.stringify($scope.settings)); //update localstorage
    $scope.draw();
  }, true);

    //update drawing when changing measurements
  $scope.$watch('ui.defaults', function(){
    $scope.draw();
  }, true);

    //translate values to current units when we change the units value
  $scope.$watch('settings.units', function(){
    if(!$scope.ui.actPattern) return; //exit if no pattern loaded
      //set the conversion value
    var transf = $scope.settings.units === 'cms' ? 2.54 : 0.3937007874;
      //convert!
    angular.forEach($scope.ui.defaults, function(value, key) {
      $scope.ui.defaults[key] = value * transf;
    });
      //save settings locally
    localStorageService.add('settings', JSON.stringify($scope.settings)); //update localstorage
  });

    // process current pattern defaults and generate the measurements object
  $scope.generateMeasuments = function(pattern){
    $scope.ui.defaults = {};
      //asume pattern is in cms
    var i, transf = $scope.settings.units === 'cms' ? 1 : 0.3937007874;
    for (i = 0; i< pattern.defaults.length; i++){
      $scope.ui.defaults[pattern.measurements[i]] = transf * pattern.defaults[i];
    }
  }

    // transform settings into valid patterndraw settings and update them
  $scope.processSettings = function(){
    var settings = {
      constopt: $scope.settings.showConstLines,
      constptopt: $scope.settings.showConstPoints,
      gridopt: $scope.settings.showGrid,
      units: $scope.settings.units == "cms" ? 28.346 : 72
    };
    patterndraw.init(settings);
  };

  $scope.draw = function(){
    if(!$scope.ui.actPattern) return;
    $scope.processSettings();
    patterndraw.drawpattern($scope.ui.actPattern.pattern, $scope.ui.defaults);
  }
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
