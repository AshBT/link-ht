'use strict';

// TODO: inject an entity service, and use it to get the entity object
angular.module('memexLinkerApp')
  .controller('EntitydetailCtrl', function ($scope, $stateParams) {
    $scope.entity = {
    	phone:'555-555-5555',
    	names:['John Doe'],
    	ages:[21,22,23],
    	ethnicities:['Lilliputian'],
    	heights:['2\'3\"','2\'7\"']
    };

    $scope.ads = [
    	{
    		title:'An ad title',
    		id:'adId',
    		phone:'123.456.7890',
    		text:'The time has come the walrus said...',
            imgs: ['https://placekitten.com/g/600/300',
                    'https://placekitten.com/g/601/300',
                    'https://placekitten.com/g/602/300',
                    ]
    	}
    ];

    $scope.reviews = [];

    $scope.id = $stateParams.id;
  });
