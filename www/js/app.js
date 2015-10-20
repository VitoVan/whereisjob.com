var APP_SESSION = {baseUrl:"/", threadUrl:'http://v2ex.com/t/'};
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
        onclick: function(event, element, elementType) {
        },
        onmessage: function(name, data){
            if(name === 'zoomComplete'){
                console.log('show data',data);
                $(moduleEl).find('ul').hide();
                $(moduleEl).find('.job').not('.template').remove();
                data.map(function(obj, index, arr){
                    jobService.getJob(obj.getExtData());
                });
            }else if(name === 'jobComplete'){
                var template = $(moduleEl).find('.job.template').clone();
                template.removeClass('template');
                if(data.cities.toString().indexOf('remote') !== -1){
                    template.addClass('remote');
                }
                template.find('[name="title"]').html(data.title);
                template.find('[name="date"]').html(new Date(data.date * 1000).pattern("MM月dd日"));
                template.find('[name="site"]').html(data.site==='NIL'?'':data.site);
                template.find('[name="email"]').html(data.site==='NIL'?'':data.email);
                template.find('[name="content"]').html(data.content.replace(/\n/g, '<br>'));
                template.find('[name="source"]').attr('href',APP_SESSION.threadUrl + data.tid).html(APP_SESSION.threadUrl + data.tid);
                template.find('[name="avatar"]').attr('src',data.avatar);
                template.find('[name="cities"]').html(data.cities?data.cities.toString():'');
                template.find('[name="more"]').click(function(e){
                    console.log(e);
                    template.find('[name="content"]').toggle();
                    if(template.find('[name="content"]').is(':visible')){
                        $(this).text('[Hide]');
                    }else{
                        $(this).text('[More]');                        
                    }
                });
                $(moduleEl).append(template);
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
                cursor: 'default',
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
            AMap.event.addListener(APP_SESSION.map, 'moveend', function(e){
                //after zoom, caculate current visible markers, and then broadcast
                console.log('MOVE::::所有MARKER',APP_SESSION.markers);
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
            AMap.event.addListener(marker, 'click', function(e){
                APP_SESSION.map.setZoomAndCenter(APP_SESSION.map.getZoom() + 1, e.lnglat);
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
                // then remove the loading stuff
                $('.loading').remove();
            }
        },
        getCities: function(){
            var me = this;
            $.post(APP_SESSION.baseUrl + 'cities',function(data){
                APP_SESSION.dataJobCities = data;
                APP_SESSION.markers = [];
                if(data){
                    data.map(function(obj, index, arr){
                        obj.cities.map(function(city){
                            me.getCityLngLat(city,function(result){
                                console.log(obj.id,city,result);
                                //do not skip remote
                                //if(city !== 'remote'){
                                    me.addMarker(obj.id, result.geocodes[0].location);
                                //}
                            });                        
                        });
                    });
                }
            });
        }
    };
});


$(document).ready(function(){
    Box.Application.init({
        debug:true,
    });
});

