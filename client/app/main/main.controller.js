'use strict';

angular.module('memexLinkerApp')
  .controller('MainCtrl', function ($scope, $http, socket, lodash) {
    $scope.entities = [];

    $http.get('/api/entities').success(function(res) {
        console.log(res);
        $scope.entities = lodash.map(res, function(e){
            var nodeData = e._node._data.data;
            return {'id' : nodeData.identifier};
        });
        console.log($scope.entities);
    });

    // $scope.awesomeThings = [];

    // $http.get('/api/things').success(function(awesomeThings) {
    //   $scope.awesomeThings = awesomeThings;
    //   socket.syncUpdates('thing', $scope.awesomeThings);
    // });

    // $scope.addThing = function() {
    //   if($scope.newThing === '') {
    //     return;
    //   }
    //   $http.post('/api/things', { name: $scope.newThing });
    //   $scope.newThing = '';
    // };

    // $scope.deleteThing = function(thing) {
    //   $http.delete('/api/things/' + thing._id);
    // };

    // $scope.$on('$destroy', function () {
    //   socket.unsyncUpdates('thing');
    // });

  //   $scope.entities = [{
  //                       id:1,
  //                       name:'Ada E. Yonath',
  //                       nPosts: '3',
  //                       phone:'123.456.7890',
  //                       imgs: ['https://placekitten.com/g/600/300',
  //                               'https://placekitten.com/g/601/300',
  //                               'https://placekitten.com/g/602/300',
  //                               ]
  //                     },
  //                     {
  //                       id:0,
  //                       name:'Dorothy C. Hodgkin',
  //                       nPosts: '4',
  //                       phone:'555.456.7890',
  //                       imgs: ['https://placekitten.com/g/200/300']
  //                     }];
   });



