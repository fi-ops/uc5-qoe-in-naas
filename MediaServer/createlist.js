var fs = require('fs');
var path = require('path');
var list;
//var outputFilename = '/tmp/list.json';


//Function that return the content of the input folder
function dirTree(filename) {
    var stats = fs.lstatSync(filename),
        info = {
            //path: filename,
            name: path.basename(filename)
        };

    if (stats.isDirectory()) {
        info.type = "folder";
        info.children = fs.readdirSync(filename).map(function(child) {
        	return dirTree(filename + '/' + child);
        });
    } else {
        //info.type = "file";
    }

    return info;
}

//Here I create a list of all the file content in folder File
var List = function (){					
	this.creationlist = function(){
		var util = require('util');
		console.log(dirTree('./File'));
		return list = dirTree('./File');  
	}
}	
module.exports = new List();


/*fs.writeFile(outputFilename,JSON.stringify(lista), function(err) {
	if(err){
		console.log(err);
	} else {
		console.log("JSON saved to" + outputFilename);
	}
});*/


/*fs.writeFile("/tmp/test", lista, function(err) {
if(err) {
    console.log(err);
} else {
    console.log("The file was saved!");
}
});*/

/*fs.readFile(outputFilename, 'utf8', function (err, data) {
  if (err) {
    console.log('Error: ' + err);
    return;
  }
 
  data = JSON.parse(data);
 
  console.log(data);
});*/
