(function($){
    $(function(){

        $('.button-collapse').sideNav();
        $('.parallax').parallax();
        $(".dropdown-button").dropdown();
        $('.slider').slider({
            full_width: true,
            //height: 1200
        });
        $('select').material_select();
        $('#regisForm').submit(function(e){

            if($("#rpass").val().length < 8 ) {
                $("#rpass").addClass("invalid");
                e.preventDefault();
                return false;
            } else {
                $("#rpass").removeClass("invalid");	
            } 
            if($("#rpass").val() != $("#cpass").val() ) {
                $("#cpass").addClass("invalid");
                e.preventDefault();
                return false;
            } else {
                $("#cpass").removeClass("invalid");	
            }
            return true;
        });

        $('.deletepj').click(function() {
            var a = $(this).attr("value");
            if(a) {
                var r = confirm("Are you sure to delete project ID : "+a+"?");
                if (r == true) {
                    window.location = 'https://iot-chula.com/projects/delete/'+a;
                    return true;
                } else {
                    return false;
                }
            }
        });
        $('.deletereact').click(function() {
            var a = $(this).attr("value");
            if(a) {
                var r = confirm("Are you sure to delete this ReAct ?");
                if (r == true) {
                    window.location = 'https://iot-chula.com/reacts/delete/'+a;
                    return true;
                } else {
                    return false;
                }
            }
        });

        $("#reactSetting select[name=appID]").change(function(){
            var t = $(this).val();
            var target = $("#reactSetting select[name=slot]");
            target.material_select('destroy');
            target.parent().find("span.caret").remove();
            var html = '<option value="" disabled selected>Choose DataSlot...</option>';
            if(typeof vslots[t] != 'undefined') {
                for(var k in vslots[t]){
                    html+= '<option value="'+vslots[t][k]+'"> '+vslots[t][k]+' </option>';
                }
            }
            target.html(html).material_select();
        });


        $("#reactSetting select[name=sms]").change(function(){
            var a = $(this).val();
            console.log("called");
            if(a == '1'){
                $("#reactSetting .col.email").hide();
                $("#reactSetting .col.sms").show();
                $("#reactSetting .col.email input").removeAttr("required");
                $("#reactSetting .col.sms input").attr("required","required");
            } else {
                $("#reactSetting .col.email").show();
                $("#reactSetting .col.sms").hide();
                $("#reactSetting .col.email input").attr("required","required");
                $("#reactSetting .col.sms input").removeAttr("required");
            }
        }).trigger("change");

        $("#devAddInput").click(function()	{
            var countBox = $(".devicesList").length;
            var boxName="device"+(++countBox); 
            $('#field').append('<div class="row devicesList"><div class="input-field col s12"><input id="'+boxName+'" type="text" name="dev" pattern="[a-zA-Z0-9]+" class="validate"><label for="'+boxName+'">Data Slot '+countBox+'</label></div></div>');
        });

        $(".add-slot-btn").click(function()	{	
            var countBox = $(".slotList").length;
            var boxName="slot-"+(++countBox); 
            if(countBox <= 24) $('#dataSlots').append('<div class="input-field slotList col s6"><input id="'+boxName+'" type="text" name="dev" pattern="[a-zA-Z0-9]+" class="validate"><label for="'+boxName+'">Data Slot '+countBox+'</label></div>');
        });


        $('nav a[href*=#]:not([href=#]), section a[href*=#]:not([href=#]), #home a[href*=#]:not([href=#])').click(function() {
            if (location.pathname.replace(/^\//, '') === this.pathname.replace(/^\//, '') && location.hostname === this.hostname) {

                var target = $(this.hash);
                target = target.length ? target : $('[name=' + this.hash.slice(1) + ']');
                if (target.length) {
                    $('html,body').animate({
                        scrollTop: target.offset().top - 100
                    }, 1000);
                    return false;
                }
            }
        });
        $('ul.tabs').tabs();



        /* Preloader */

        setTimeout(function(){
            jQuery('body').addClass('loaded');
        }, 100);



        if($("#viewProject").length) {
            UpdateConfig();
            clientConnect();
            loadDevices();
            updateMaps();
            loadData();
            updateView();

            $("#configLive").change(function(){
                UpdateConfig();
                clientConnect();
            });
            $("input[name=viewCol]").change(function(){
                UpdateConfig();
                updateView();
            });
            $("input[name=graphType]").change(function(){
                UpdateConfig();
                loadData();
            });
            $("input[name=xTime]").change(function(){
                UpdateConfig();
                loadData();
            });
            $(".collapsible-header a").click(function(){
                $(this).attr("target",$(this).attr("href"));
                $(this).parent().trigger("click");
            });
            $(document).on("click","#devicesList .chip",function(){
                var t = $(this).attr("dev").trim();
                if(typeof config.devices[t] != 'undefined'){
                    config.view.map.setCenter({lat:config.devices[t].lat,lng:config.devices[t].lon});
                    config.view.map.setZoom(18);
                }
            });
            $( document ).ajaxError(function( event, jqxhr, settings, thrownError ) {
                if(jqxhr.status == 401) window.location.reload();
            });

        }

        if($("#viewData").length) {
            $(".compare input").change(function(){
                loadData2();
            });

            $("input[name=timing], input[name=grouping]").change(function(){
                config.grouping.approximation = $("input[name=grouping]:checked").attr("value").trim();
                config.grouping.units = $("input[name=timing]:checked").attr("value").trim();
                renderGraph2();
            });
            $("input[name=graphType], input[name=xTime]").change(function(){
                config.view.gType = $("input[name=graphType]:checked").attr("value").trim();
                loadData2();
            });

            $("#gType1").trigger("change");

        }


        if($("#home").length || $("#title-banner").length) {
            $( window ).scroll(function() {
                var a = $(window).scrollTop();
                if($("#home").length){
                    var h = $("#home").outerHeight();
                    if(a < h - 70) {
                        $("header nav").addClass("top-nav");
                        $("#home .header").css("opacity",(h-a)/h);
                    } else {
                        $("header nav").removeClass("top-nav");
                    }
                } else if($("#title-banner").length){
                    var h = $("#title-banner").outerHeight();
                    if(a < h - 50) {
                        $("header nav").addClass("top-nav");
                        $("#title-banner .container ").css("opacity",(h-a)/h);
                    } else {
                        $("header nav").removeClass("top-nav");
                    }
                }
            }).trigger("scroll");
        }

        if(window.location.hash) {
            var hash = window.location.hash.slice(1);
            var target = $("#"+hash);
            console.log(hash,target.length);
            target = target.length ? target : $('[name=' + hash + ']');
            if (target.length) {
                $('html,body').animate({
                    scrollTop: target.offset().top - 100
                }, 1000);
                return false;
            }
        }


    }); // end of document ready
})(jQuery); // end of jQuery name space



// Youtube embed

(function() {
    var v = document.getElementsByClassName("youtube-player");
    for (var n = 0; n < v.length; n++) {
        var p = document.createElement("div");
        p.innerHTML = labnolThumb(v[n].dataset.id);
        p.onclick = labnolIframe;
        v[n].appendChild(p);
    }
})();

function labnolThumb(id) {
    return '<img class="youtube-thumb" src="https://img.youtube.com/vi/' + id + '/maxresdefault.jpg"><div class="play-button"></div>';
}

function labnolIframe() {
    var iframe = document.createElement("iframe");
    iframe.setAttribute("src", "https://www.youtube.com/embed/" + this.parentNode.dataset.id + "?autoplay=1&autohide=2&border=0&wmode=opaque&enablejsapi=1&controls=0&showinfo=0");
    iframe.setAttribute("frameborder", "0");
    iframe.setAttribute("id", "youtube-iframe");
    this.parentNode.replaceChild(iframe, this);
}





var color = ['#ff0000', '#ff6f00', '#ffb200', '#00d0b0', '#006529', '#7fde00', '#00b5ce', '#56dcff', '#5388ff', '#0043d5', '#001292', '#8500b0', '#ff50a6', '#ff87bb', '#ffbae5', '#5c3d3a', '#2c304b', '#444444', '#707477'];
var defaultCoor = {lat: 13.736800, lng: 100.533067};


function UpdateConfig(){
    config.view.columns = Number($("input[name=viewCol]:checked").attr("value"));
    config.view.live = $("#configLive").is(":checked");
    config.view.gType = $("input[name=graphType]:checked").attr("value").trim();
    config.view.XisTime = $("input[name=xTime]:checked").attr("value") == "true";
    //console.log("Configs Updated");
}

function clientConnect(){
    if(config.view.live){
        config.view.client = new Paho.MQTT.Client('iot-chula.com', 8083, "/", "SIoTP-"+config.project.AppKey);

        // set callback handlers
        config.view.client.onConnectionLost = onConnectionLost;
        config.view.client.onMessageArrived = onMessageArrived;

        $("#offlineStat, #onlineStat").hide();

        // connect the client
        config.view.client.connect({userName:config.project.AppKey,password:config.project.AppSecret, useSSL: true, onSuccess:function() {
            // Once a connection has been made, make a subscription and send a message.
            $("#onlineStat").show();
            console.log("onConnect");
            for(var t in config.slots){
                config.view.client.subscribe(config.project.AppID+"/"+t);	
            }
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(function(position) {
                    defaultCoor = {lat:position.coords.latitude,lng:position.coords.longitude};
                    var message = new Paho.MQTT.Message(position.coords.latitude+","+position.coords.longitude);
                    message.destinationName = "latlon";
                    config.view.client.send(message);
                });
            }
        }});

        config.view.devInt = setInterval(loadDevices, 500);
    } else {
        $("#offlineStat").show(); $("#onlineStat").hide();
        if(config.view.client != null) config.view.client.disconnect();
        loadData();
        clearInterval(config.view.devInt);
    }
}

function loadDevices(){
    if(config.view.live) {
        $.get("https://iot-chula.com/getDevices/"+config.project.AppID+"/",function(data){
            config.devices = data;
            $("#devicesList").html("");
            var order = 0;
            for(var t in config.devices){
                var device = config.devices[t];
                var online = (device.online) ? 'online':'offline';
                config.devices[t].color = (device.online) ? color[(order++)%color.length] : '#999999';
                var name = (t == 'SIoTP-'+config.project.AppKey)? "Dashboard":t;
                $("#devicesList").append('<div class="chip '+online+'" dev="'+t+'" title="Lat: '+device.lat+', Lon: '+device.lat+'"><img style="background-color:'+config.devices[t].color+'"> '+name+'</div>');
            }
            var tot = $("#devicesList .chip").length;
            var onl = $("#devicesList .chip.online img").length;
            $("#deviceNum").text(tot);
            $("#deviceOnline").text(onl);
            updateMaps();
        },'json');
    } else {
        return true;
    }
}

function updateMaps(){
    if(config.view.map == null) {
        config.view.map = new google.maps.Map(document.getElementById('devicesLocation'), {
            center: defaultCoor,
            scrollwheel: true,
            zoom: 14
        });
    }
    for(var t in config.devices){
        var device = config.devices[t];
        var lt = ((Math.random()*10)-5)/10000000;
        var lg = ((Math.random()*10)-5)/10000000;
        var latlng = {lat: device.lat+lt, lng: device.lon+lg};
        if(latlng.lat == 0 && latlng.lng == 0)  latlng = defaultCoor;
        var icon = {
            path: 'M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z',
            fillColor: device.color,
            fillOpacity: 0.5,
            strokeOpacity: 0.9,
            strokeColor: device.color,
            strokeWeight: 1,
            scale: 1,
            anchor: new google.maps.Point(12, 17),
        }
        if(typeof config.view.marker[t] != 'undefined') {
            if(device.online) {
                config.view.marker[t].setIcon(icon);
                config.view.marker[t].setPosition(latlng);
            } else {
                config.view.marker[t].setMap(null);
                delete config.view.marker[t];
            }		
        } else if(device.online) {
            config.view.marker[t] = new google.maps.Marker({
                position: latlng,
                map: config.view.map,
                title: t,
                icon: icon,
            });
        }
    }
}

function loadData(key){
    if (key === undefined) {
        for(var key in config.slots){
            loadData(key);
        }
    } else {
        $.get("https://iot-chula.com/getData/"+config.project.AppID+"/"+key+"/?num="+config.view.dpc,function(res){
            var obj = res.key;
            config.slots[obj].data = [];
            var data = res.data.sort(function(a, b){return a.x-b.x});
            for(var i in data ){
                var item = {label:stampToDate(data[i].x),y:data[i].y,markerBorderColor:config.view.borderColor,markerColor:deviceColor(data[i].d)};
                if(config.view.XisTime) {
                    item = {x:data[i].x,y:data[i].y,markerBorderColor:config.view.borderColor,markerColor:deviceColor(data[i].d)};
                } 
                config.slots[obj].data.push(item);
            }
            renderGraph(obj);
        },'json');
    }
}
function renderGraph(key){
    if (key === undefined) {
        for(var key in config.slots){
            renderGraph(key);
        }
    } else {
        var options = {
            //title :{ text: key+" Data" },	
            animationEnabled: true,
            axisX:{ gridColor: "#DDDDDD", gridThickness:1,labelMaxWidth:90, lineThickness:1, tickThickness:1},
            axisY:{ gridColor: "#DDDDDD", gridThickness:1, lineThickness:1, tickThickness:1},
            data: [{ type: config.view.gType, dataPoints: config.slots[key].data}]
        }

        if(config.view.XisTime) {
            options.axisX.labelAngle = 0;
            options.data[0].xValueType = "dateTime";
            options.data[0].xValueFormatString = "D MMM YYYY - HH:mm:ss.fff";
        }
        config.slots[key].chart = $("#graph-"+key).CanvasJSChart(options);
        config.slots[key].chart.CanvasJSChart().render();
    }
}

function updateView(){
    $("#chartArea .col").attr("class","col s12 m6 l"+config.view.columns);
}
function onConnectionLost(responseObject) {
    if (responseObject.errorCode !== 0) {
        $("#offlineStat").show(); $("#onlineStat").hide();
        var r = confirm("ขาดดการเชื่อมต่อกับเซิฟเวอร์ ต้องการเชื่อมต่อใหม่หรือไม่?");
        if (r == true) {
            clientConnect();
        } else {
            $("#configLive").prop('checked', false);
            UpdateConfig();
            clientConnect();
        }
        console.log("onConnectionLost: "+responseObject.errorMessage);
    }
}
function onMessageArrived(message) {
    if(message.destinationName == '') { 

    } else {
        for(var key in config.slots){
            if(message.destinationName == config.project.AppID+"/"+key){
                var val = Number(message.payloadString);
                var x = new Date().getTime();
                var latest = (config.slots[key].data.length) ? config.slots[key].data[config.slots[key].data.length-1].x + 1 : 0;
                var item = { x:latest,label:stampToDate(x),y:val,markerBorderColor:config.view.borderColor,markerColor:config.view.unknownColor };
                if(config.view.XisTime) {
                    item = { x:x, y:val, markerBorderColor:config.view.borderColor, markerColor:config.view.unknownColor };
                }
                config.slots[key].data.push(item);

                while(config.slots[key].data.length > config.view.dpc) config.slots[key].data.shift();

                config.slots[key].chart.CanvasJSChart().render();
                break;
            }
        }
    }		
    //console.log("onMessageArrived: ",message);
}

function deviceColor(key){
    return (typeof config.devices[key] != 'undefined' && config.devices[key].color != '') ? config.devices[key].color : config.view.unknownColor;		
}

function stampToDate(stanp){
    var a = new Date(stanp);
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var year = a.getFullYear();
    var month = months[a.getMonth()];
    var date = a.getDate();
    var hour = a.getHours();
    var min = a.getMinutes();
    var sec = a.getSeconds();
    var ff = a.getMilliseconds();
    var time = date+' '+month+' '+year+" "+hour+':'+min+':'+sec+'.'+ff;
    return time;
}



function renderGraph2(){
    Highcharts.setOptions({
        global: {
            useUTC: false,
        },
        acolors: color,
        subtitle: { text: document.ontouchstart === undefined ? 'คลิกแล้วลากเพื่อซูม' : 'ใช้นิ้วย่อและขยายกราฟข้อมูล' },
        credits: { enabled: false },
        xAxis: {
        },
        yAxis: {
        },
        plotOptions:{series:{dataGrouping: {
            approximation: config.grouping.approximation,
            enabled: (config.grouping.approximation != "disable")?true:false,
            forced: true,
            units: [[config.grouping.units]] 
        }}},
        tooltip: {
            pointFormat: '<span style="color:{series.color}">{series.name}</span>: <b>{point.y}<br/>',
            valueDecimals: 2
        },
    });
    var data = [];
    for(var a in config.series) {
        data.push({name: a,data: config.series[a]});
    }
    $('#graph').highcharts('StockChart',{
        title: { text: config.project.Name+" :: "+config.key },
        legend: { enabled: true },
        rangeSelector:{enabled: false},
        chart:{type:config.view.gType, zoomType: 'x'},
        series: data
    });


}
var seriesCount = 0, seriesTotal=0;
function loadData2(key){
    if (key === undefined) {
        config.series = [];
        seriesCount = 0;
        seriesTotal = $(".compare input:checked").length+1;
        console.log(seriesTotal);
        $(".compare input:checked").each(function(){ loadData2($(this).attr('name')); });
        loadData2(config.key);
    } else {
        $.getJSON("https://iot-chula.com/getData/"+config.project.AppID+"/"+key+"/?high", function (data) {
            config.series[key] = data.sort(function(a, b){return a[0]-b[0]});;
            seriesCount++;
            if (seriesCount === seriesTotal) {
                renderGraph2();
            }

        });
    }
}
