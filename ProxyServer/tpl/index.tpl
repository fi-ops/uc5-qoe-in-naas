<!DOCTYPE html>
<html>
<head>

    <meta http-equiv="content-type" content="text/html; charset=utf-8">
    <title></title>
    <link rel="stylesheet" type="text/css" href="static/style.css"/>

</head>
<body>

<div id="lateralmenu">
    <div id="addnewfamilink">
        <div id="plusinaddfamilink"><img src="static/video.png"/></div>

        <b id="txtaddfamilink"> Videos </b>
        
        (: links ~

        <a href="index.html?video=[: link ~ linknonvalido :]&name=[:name ~ nomenovalido:]"><h1>[: name ~ nomenonvalido :]</h1> </a>
        :)

    </div>



</div>

<div id="wrapalldettail">


    <div class="wrapdatetimepicker"> 
        <div class="titlefild">
        (: selected ~
            <b>[:name ~ nomenonvalido:]</b>
        </div>
    </div> 
    <div id="blanckspace">
	    </div>
    <div class="video_canvas">
    <embed type="application/x-vlc-plugin"
	    name="video1"
	    id="video1"
	    class="vlcPlayer"
	    autoplay="yes" loop="yes" width="580" height="360"
	    (^: target="http://:^)[:localAddress ~ 0.0.0.1 :]:[: port ~ 8080:][: path ~ pathnonvalido:]"
	    :)
    </embed>

           

</div>

</body>






</html>
