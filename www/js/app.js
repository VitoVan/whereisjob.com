var APP_SESSION = {baseUrl:"http://localhost:8083/"};
APP_SESSION.cities = {};
APP_SESSION.markers = [];

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

Box.Application.addService('map', function(application){
    'use strict';
    return {
        initMap: function(){
            console.log("Initing map.");
            var me = this;
            $('#map-container').height($(document).height() - 70);
            $(window).on('resize',function(){
                $('#map-container').height($(document).height() - 70);
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
            AMap.event.addListener(APP_SESSION.map, 'touchstart', function(){
                APP_SESSION.map.setZoomAndCenter(APP_SESSION.map.getZoom() + 1, e.lnglat);                
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
            console.log('adding marker',location);
			var marker = new AMap.Marker({				  
				position: location
			});
            APP_SESSION.markers.push(marker);
            //if markers is ready, show the cluster
            if(APP_SESSION.markers.length === APP_SESSION.serverCities.length/2){
                if(APP_SESSION.cluster){
                    APP_SESSION.cluster.setMap(null);
                }
                var sts=[{url:APP_SESSION.baseUrl + "pic/marker48.png", size:new AMap.Size(48,48),textSize:12,textColor:'#FFFFFF',offset:new AMap.Pixel(-24,-45)},
					     {url:APP_SESSION.baseUrl + "pic/marker48.png", size:new AMap.Size(48,48),textSize:12,textColor:'#FFFFFF',offset:new AMap.Pixel(-24,-45)},
					     {url:APP_SESSION.baseUrl + "pic/marker48.png", size:new AMap.Size(48,48),textSize:12,textColor:'#FFFFFF',offset:new AMap.Pixel(-24,-45)}];
                console.log(sts);
                APP_SESSION.map.plugin(["AMap.MarkerClusterer"],function(){
				    APP_SESSION.cluster = new AMap.MarkerClusterer(APP_SESSION.map, APP_SESSION.markers, {styles:sts});
			    });
            }
        },
        getCities: function(){
            var me = this;
            $.post(APP_SESSION.baseUrl + 'cities',function(data){
                APP_SESSION.serverCities = data;
                APP_SESSION.markers = [];
                data.map(function(obj, index, arr){
                    var currentId = 0;
                    if(typeof(obj) === 'number'){
                        currentId = obj;
                    }
                    if(typeof(obj) === 'string'){
                        me.getCityLngLat(obj,function(result){
                            console.log(currentId,obj,result);
                            me.addMarker(currentId, result.geocodes[0].location);
                        });
                    }
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

