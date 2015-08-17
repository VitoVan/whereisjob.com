var APP_SESSION = {baseUrl:"http://localhost:8083/"};
APP_SESSION.cities = {};
APP_SESSION.markers = [];
APP_SESSION.jobs = [];

Box.Application.addModule('map', function(context) {
    'use strict';
    var moduleEl,mapService;
    return {
        init: function(){
            moduleEl = context.getElement();
            mapService = context.getService('map');
            mapService.initMap();
        },
        destroy: function() {
            $(moduleEl).remove();
            moduleEl = null;
            mapService = null;
        }
    };
});

Box.Application.addModule('job', function(context) {
    'use strict';
    var moduleEl,jobService;
    return {
        messages: ['zoomComplete','jobComplete'],
        init: function(){
            moduleEl = context.getElement();
            jobService = context.getService('job');
        },
        onmessage: function(name, data){
            if(name === 'zoomComplete'){
                console.log('show data',data);
                data.map(function(obj, index, arr){
                    jobService.getJob(obj.getExtData());
                });
            }else if(name === 'jobComplete'){
                console.log('showing data', data);
            }
        },
        destroy: function() {
            $(moduleEl).remove();
            moduleEl = null;
            jobService = null;
        }
    };
});

Box.Application.addService('job', function(application){
    'use strict';
    return {
        getJob: function(id){
            if(APP_SESSION.jobs[id]){
                application.broadcast('jobComplete',APP_SESSION.jobs[id]);                
            }else{
                console.log('requesting...',id);
                $.post(APP_SESSION.baseUrl + 'job', {id: id}, function(data){
                    APP_SESSION.jobs[id] = data;
                    application.broadcast('jobComplete',data);                
                });
            }
        }
    }
});

Box.Application.addService('map', function(application){
    'use strict';
    return {
        initMap: function(){
            console.log("Initing map.");
            var me = this;
            $('#map-container').height($(document).height() - 70);
            $('.job-container').height($(document).height() - 70);
            $(window).on('resize',function(){
                $('#map-container').height($(document).height() - 70);
                $('.job-container').height($(document).height() - 70);
            });
            APP_SESSION.map = new AMap.Map('map-container', {
	            resizeEnable: true,
                rotateEnable: true,
	            view: new AMap.View2D({
                    center: new AMap.LngLat(113.665413,34.757977),
	                resizeEnable: true,
	                zoom:4//地图显示的缩放级别
	            }),
                features: ["bg","road","point"]
            });
            AMap.event.addListener(APP_SESSION.map, 'click', function(e){
                APP_SESSION.map.setZoomAndCenter(APP_SESSION.map.getZoom() + 1, e.lnglat);
            });
            AMap.event.addListener(APP_SESSION.map, 'zoomend', function(e){
                //after zoom, caculate current visible markers, and then broadcast
                console.log('所有MARKER',APP_SESSION.markers);
                var curMarkers = [];
                APP_SESSION.markers.map(function(obj, index, arr){
                    var curBounds = APP_SESSION.map.getBounds();
                    if(curBounds.contains(obj.getPosition())){
                        curMarkers.push(obj);
                    }
                });
                console.log('当前可见MARKER',curMarkers);
                application.broadcast('zoomComplete',curMarkers);
            });
            AMap.event.addListener(APP_SESSION.map, 'complete', function(){
                APP_SESSION.map.plugin(["AMap.ToolBar"],function(){		
		            var toolBar = new AMap.ToolBar();
		            APP_SESSION.map.addControl(toolBar);
                    toolBar.show();
	            });
                me.getCities();
            });
        },
        getCityLngLat: function(city,next){
            if(APP_SESSION.cities[city]){
                next(APP_SESSION.cities[city]);
            }else{
		        var MGeocoder;
		        AMap.service(["AMap.Geocoder"], function() {        
		            MGeocoder = new AMap.Geocoder();
                    console.log(city,'requesting......');
		            MGeocoder.getLocation(city, function(status, result){
		        	    if(status === 'complete' && result.info === 'OK'){
                            APP_SESSION.cities[city] = result;
		        		    next(result);
		        	    }
		            });
		        });
            }
        },
        addMarker: function(id, location){
            console.log('adding marker',id,location);
			var marker = new AMap.Marker({				  
				position: location,
                extData: id
			});
            APP_SESSION.markers.push(marker);
            //if markers is ready, show the cluster
            if(APP_SESSION.markers.length === APP_SESSION.dataJobCities.length){
                if(APP_SESSION.cluster){
                    APP_SESSION.cluster.setMap(null);
                }
                var sts=[{url:APP_SESSION.baseUrl + "pic/marker48.png", size:new AMap.Size(48,48),textSize:12,textColor:'#FFFFFF',offset:new AMap.Pixel(-24,-45)},
					     {url:APP_SESSION.baseUrl + "pic/marker48.png", size:new AMap.Size(48,48),textSize:12,textColor:'#FFFFFF',offset:new AMap.Pixel(-24,-45)},
					     {url:APP_SESSION.baseUrl + "pic/marker48.png", size:new AMap.Size(48,48),textSize:12,textColor:'#FFFFFF',offset:new AMap.Pixel(-24,-45)}];
                APP_SESSION.map.plugin(["AMap.MarkerClusterer"],function(){
				    APP_SESSION.cluster = new AMap.MarkerClusterer(APP_SESSION.map, APP_SESSION.markers, {styles:sts});
			    });
            }
        },
        getCities: function(){
            var me = this;
            $.post(APP_SESSION.baseUrl + 'cities',function(data){
                APP_SESSION.dataJobCities = data;
                APP_SESSION.markers = [];
                data.map(function(obj, index, arr){
                    obj.cities.map(function(city){
                        me.getCityLngLat(city,function(result){
                            console.log(obj.id,city,result);
                            me.addMarker(obj.id, result.geocodes[0].location);
                        });                        
                    });
                });
            });
        }
    };
});


$(document).ready(function(){
    Box.Application.init({
        debug:true,
    });
});

