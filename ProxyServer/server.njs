var http = require('http');
var bind = require('bind');
var dispatcher = require('httpdispatcher');
var mediaServers=[]; //Array of available media servers
var ports=[]; //ports used by the proxy applications (i.e. VLC)
var selectedMediaServer=0;
var  childs={}; //Processes of instance of VLC
// A default struct has to be declared to contain the links
var strLinks={ links :
    	[{link: '',
    	 name : '',
    		 ip:''}]
        ,selected : {
        	link : '',
        	name : 'Default video',
        	localAddress : '0.0.0.0',
        	port:8080}
    };


//-------------- Global Variables-----------------------
IPServerProxy='0.0.0.0'; // IP of the local interface to bind
PortServerProxy=1337; //Port to bind
PortMediaServer=8554; //Port of the remote media server
PortServer=1338; //Port of the application that assists Media Server


// Creation of the server that handles the incoming 
http.createServer(function (req, res) {
	  dispatcher.setStaticDirname('.');
	  dispatcher.dispatch(req, res);
	}).listen(PortServerProxy, IPServerProxy);

console.log('Server running at http://'+IPServerProxy+':'+PortServerProxy);

// function that requests the list of the file available on media servers that has ip 'addr'
var reqMediaServer=function(addr)
{
	var reqA=http.request({
			  host: addr,
			  port: PortServer,
			  path: '/list'
			}, function(response) {
				var str = '';
				//list is retrieved in chunk
				response.on('data', function (chunk) {
				  str += chunk;
				});
				//the whole list has been received
				response.on('end', function () {
					try {
						var responseList = JSON.parse(str);
						// put the list in the array result
						// each element is an object {name,link}
					var result = [];
					for (var i in responseList['children']) {
						if (!(responseList['children'][i]['type']))
							result.push({link: 'rtsp://'+addr+':'+PortMediaServer+'/File/'+responseList['children'][i]['name'], name : responseList['children'][i]['name'],ip :addr });			
					}
					// Adding only the new links (no duplicates) in local struct strLinks
					oldLinks=strLinks.links;
					// removing the links belong the server
					for(i=0;i<oldLinks.length;i++)
					{
					if(oldLinks[i].ip==addr)
						{
						oldLinks.splice(i,1);
						i--;
						}
						
					}
					// then adding the links not duplicate
					for(i=0;i<result.length;i++)
						{
						var found=false;
						for(j=0;j<oldLinks.length;j++)
							{
								if(oldLinks[j].link==result[i].link)
									found=true;
							}
						if(!found)
							oldLinks.push(result[i]);
						}
					strLinks.links=oldLinks;
					} catch(e){console.log('Error parsing JSON: '+e);}
				});
			});
	reqA.end();
	reqA.on('error', function(e) {
		  //if contacting the server there is an error, the server and its links are removed
		  if(mediaServers.indexOf(addr)>-1)
			  {
			  	mediaServers.splice(mediaServers.indexOf(addr),1);
			  	oldLinks=strLinks.links;
				for(i=0;i<oldLinks.length;i++)
					{
					if(oldLinks[i].ip==addr)
						{
							oldLinks.splice(i,1);
							i--;
						}
					}
				strLinks.links=oldLinks;
			  	}
				console.log('Problem contacting '+addr+': ' + e.message +". Now we have "+ mediaServers.length+ " servers");
		});
}
var reqMediaServers= function(){
	// requesting list of links to one server in a turn
	// the servers are cycled
	if (mediaServers.length>0)
		{
		reqMediaServer(mediaServers[(selectedMediaServer)%(mediaServers.length)]);
		selectedMediaServer++;
		}else
		{
		console.log("No media server to contact");
		}	
}

// Requesting the new list to one server every 5 seconds
setInterval(reqMediaServers,5*1000);

// Function to create new proxy process, the information about link are retrieved through the variable remoteIP from strLinks
var creationProcess= function (num,remoteIP){
	// Execute vlc for proxing
	var sys = require('sys')
	var exec = require('child_process');
	var child;
	// executes cvlc and terminate the instance of previous proxy appplication on the same client (one proxy for one client)
	if (childs[remoteIP])
		{
		childs[remoteIP].killed=true;
		childs[remoteIP].kill('SIGTERM');
		}
	// take a free port to launch vlc with http protocol
	port=Math.floor(Math.random()*64510+1024);
	while(!(ports.indexOf(port)==-1)){
		port=Math.floor(Math.random()*64510+1024);
		}
	strLinks[remoteIP].port=port;
	ports.push(port);
	// creation of the instance and keep it in an array to possibly call it to kill it
	child = new exec.execFile( "/usr/bin/cvlc",[strLinks[remoteIP].link,"--sout","#standard{access=http,mux=ogg,dst="+IPServerProxy+":"+port+strLinks[remoteIP].path+"}",  "--sout-all", "--ttl","12","--play-and-exit", "-q"], function (error, stdout, stderr) {
		if (stdout)
			sys.print('stdout: ' + stdout);
		if (stderr)
			sys.print('stderr: ' + stderr);
		if (error !== null) {
		    console.log('exec error: ' + error);
		}
	});
	child.num=num; // number of calling of the same proxy, it will be higher than 0 if there is some problem to allocate port or stream
	child.port=port;
	child.ip=remoteIP;
	child.date=new Date();
	child.on('close',function(code, signal){
		console.log("Child proxy process terminated, level of recursion: "+ this.num +", remove port: "+child.port);
		var now=new Date();
		if((now.getTime()-child.date.getTime())<5000 && !('SIGTERM'==signal) && !this.killed && this.num<5)
			{
			// The process is closed in a fast way (less than 5 seconds), maybe some problem with stream.
			// Creation of the same process, adding one level of recursion
			// Try until 6 times to restart the proxy process
			creationProcess(this.num+1,this.ip);
			}
		if(ports.indexOf(this.port)>-1)
				ports.splice(ports.indexOf(this.port),1);
		})
	childs[remoteIP]=child;
}
	
// Receiving requests
dispatcher.onGet('/index.html', function(req, res, chain) {
	var url = require('url').parse(req.url, true);
	var remoteAddress=req.connection.remoteAddress;
	strLinks[remoteAddress]=strLinks.selected;
	// Requesting video from query
	if (url.query.video)
		{
		// Set information about the video to stream
		strLinks[remoteAddress].link=url.query.video;
		strLinks[remoteAddress].name=url.query.name;
		urlVideo=require('url').parse(url.query.video,true);
		strLinks[remoteAddress].path=urlVideo.pathname;
		console.log("Streaming video on "+req.connection.remoteAddress + " of "+strLinks[remoteAddress].path);
		// Creation of the proxy process
		creationProcess(0,remoteAddress);
	}else
		{
		// no video requested
		strLinks[remoteAddress].link='';
		strLinks[remoteAddress].name='';
		strLinks[remoteAddress].path='';
		}
	// Return the template with the list of the links
	strLinks[remoteAddress].localAddress=req.headers.host.split(":")[0];
	strLinks.selected=strLinks[remoteAddress];
	bind.toFile('tpl/index.tpl', strLinks, function(data) {
	    res.writeHead(200, {'Content-Type': 'text/html'});
	    res.end(data);
	});
});

// the media server notifies its presence using method POST on '/push' page
dispatcher.onPost('/push', function(req, res, chain) {
	if (mediaServers.indexOf(req.connection.remoteAddress)==-1)
		{
		mediaServers.push(req.connection.remoteAddress);
		console.log("Adding media server "+req.connection.remoteAddress + " for a total of "+mediaServers.length)
		// ask immediately the list of the server
		reqMediaServer(req.connection.remoteAddress);
		}
	res.writeHead(200, {'Content-Type': 'text/plain'});
	res.end('Thank you'); 
});
