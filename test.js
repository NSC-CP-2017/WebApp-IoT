var request = require("request");
var url = 'https://api.mapbox.com/styles/v1/mapbox/streets-v10/static/-122.337798,37.810550,9.67,0.00,0.00/1000x600@2x?access_token=pk.eyJ1Ijoia2FtZW1vcyIsImEiOiJjamJseHB4ZGIzNzV5MzNyNjJkanEzcjdlIn0.799r9GCkmUnwkw96jkeWWA';
request(url,(error,response,body)=>{
    if(!error && response.statusCode == 200){
        console.log(body);
    }
});