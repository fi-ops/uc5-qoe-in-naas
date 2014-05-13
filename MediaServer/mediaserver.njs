var http = require('http');
var dispatcher = require('./node_modules/httpdispatcher/'); 
var videolist = require('./createlist');
const ipserverproxy = '192.168.2.110';
const portserverproxy = '1337';
const ipmediaserver = '0.0.0.0';
const portmediaserver = '1338';



http.createServer(function (req, res) {
    dispatcher.dispatch(req, res);
}).listen(portmediaserver, ipmediaserver); 

//Define and do a post request to server proxy to say media server join the system
var requp = http.request({
	  						host: ipserverproxy,
	  						port: portserverproxy,
	  						path: '/push',
	  						method: "POST",
	  						headers: { 'Content-Type' : 'application/x-www-form-urlencoded' }
	  					 }, function(response) {
	  						 }
	  					 ); 	
	  					 
var msg = "I am up";
requp.write(msg, function(err){
	if(err){
 		console.log(err);
	   } else {
		   console.log(msg);
		   console.log('Connect to server proxy: ' +ipserverproxy+':'+portserverproxy );   
		}
});
requp.end();
requp.on('error', function(err){
console.log('Problem connecting to server proxy: ' +ipserverproxy+':'+portserverproxy + err);
});

//Make available the list of file of the media server at the page /list
dispatcher.onGet("/list", function(req, res) {
  res.writeHead(200, {'Content-Type': 'application/json'});
  res.write(JSON.stringify(videolist.creationlist()),function(err) {
		if(err){
			console.log(err);
		} else {
			console.log("List of file sent" );
		  }
	});
  res.end()
  res.on('error', function(err){
	  console.log('Distpacher Get List: ' + err);
	  });
});

