'use strict';

angular.module('memexLinkerApp')
.directive('entityHeatmap', function ($http) {
    function link(scope, el) {
        var config = scope.config;
        var elemenent = el[0];
        var cal = new CalHeatMap();
        cal.options.afterLoadData = function(data){

            console.log('afterLoadData');
            console.log(data);
            var ads = _.map(data, function(element){ 
                var ad = {
                    'id':element.ad._id,
                    'labels':element.ad.labels,
                    'properties':element.ad.properties
                    };
                return ad;
            });

            var dateMap = new HashMap();
            _.forEach(ads, function(ad) {
                console.log(ad.properties.posttime);
                var utcSeconds = parseInt(Date.parse(ad.properties.posttime)) / 1000;
                if(dateMap.has(utcSeconds)) {
                    dateMap.set(utcSeconds, dateMap.get(utcSeconds)+1);
                } else {
                    dateMap.set(utcSeconds, 1);
                }
            });
            var outputData = {};
            dateMap.forEach(function(count, timestamp) {
                outputData[timestamp] = count;
            });
            console.log(outputData);
            return outputData;

        };

        cal.init({
            itemSelector: elemenent,
            domain: !config ? 'month': config.domain ? config.domain : 'month',
            subDomain: !config ? 'day': config.subDomain ? config.subDomain : 'day',
            subDomainTextFormat: !config ? '%d' : config.subDomainTextFormat ? config.subDomainTextFormat : '%d',
            data: !config ? '' : config.data ? config.data : '',
            start: !config ? new Date() : config.start ? config.start : new Date(),
            cellSize: !config ? 25 : config.cellSize ? config.cellSize : 25,
            range: !config ? 3 : config.range ? config.range : 3,
            domainGutter: !config ? 10 : config.domainGutter ? config.domainGutter : 10,
            legend: !config ? [2,4,6,8,10] : config.legend ? config.legend : [2, 4, 6, 8, 10],
            itemName: !config ? 'item' : config.itemName ? config.itemName : 'item',
        });

        cal.update('api/entities/' + config.entityId + '/linked');
}

return {
    template: '<div id="cal-heatmap" config="config"></div>',
    restrict: 'E',
    link: link,
    scope: { 
        config: '='
    }
};
});
