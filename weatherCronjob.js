var request = require('request');
var cronjob = require('cron').CronJob;

module.exports = function(){
	var job = new cronjob('0 0 */3 * * *', function() {
		console.log("update weather at "+new Date());
		// request({
		// 	uri:"http://localhost:3352/fetchweather",
		// 	method: "get",
		// }, function(error, response, body) {
		// console.log('notification update at : '+Date());
		// });
	}, null, true, 'Asia/Bangkok');
	return job;
}
