var channels = {"channels": [
    {"channel": "All", "feed": "/r/all/.json"}
    ,{"channel": "Videos", "feed": "/r/videos/.json"}
    ,{"channel": "YouTube", "feed": "/domain/youtube.com/.json"}
    ,{"channel": "Funny", "feed": "/r/funny/.json"}
    ,{"channel": "Politics", "feed": "/r/politics/.json"}
    ,{"channel": "WTF", "feed": "/r/wtf/.json"}
    ,{"channel": "Gaming", "feed": "/r/gaming/.json"}
    ,{"channel": "Science", "feed": "/r/science/.json"}
    ,{"channel": "Geek", "feed": "/r/geek/.json"}
    ,{"channel": "AWW", "feed": "/r/aww/.json"}
    ,{"channel": "Music", "feed": "/r/music/.json"}
    ,{"channel": "Listen", "feed": "/r/listentothis/.json"}
    ,{"channel": "Sports", "feed": "/r/sports/.json"}
    ,{"channel": "TED", "feed": "/domain/ted.com/.json"}
  ]
};

var videos = new Array();
var cur_video = 0;
var cur_chan = 0;
var cur_req = null;
var auto = true;
var sfw = true;
var theme = 'light';
var yt_player = false;

$().ready(function(){
    loadSettings();
    loadTheme(theme);
    displayChannels();
    loadChannel("Videos");

    $filloverlay = $('#fill-overlay');
    $fillnav = $('#fill-nav');
    
    $filloverlay.mouseenter(function() {
	$fillnav.slideDown('slow');
    });
    $filloverlay.mouseleave(function() {
        $fillnav.slideUp('slow');
    });
    $fillnav.click(function(){
	fillScreen();
    });
    $('#css li a').click(function() { 
	loadTheme($(this).attr('rel'));
	return false;
    });
    $('#auto').click(function() {
        auto = ($('#auto').is(':checked')) ? true : false;
	$.cookie('auto', auto);
    });
    $('#sfw').click(function() {
        sfw = ($('#sfw').is(':checked')) ? true : false;
	$.cookie('sfw', sfw);
    });
    $('#fill').click(function() {
	fillScreen();
    });
    $('#next-button').click(function() {
	loadVideo('next');
    });
    $('#prev-button').click(function() {
	loadVideo('prev');
    });
    $(document).keydown(function (e) {
	var keyCode = e.keyCode || e.which;
	var arrow = {left: 37, up: 38, right: 39, down: 40 };
	switch (keyCode) {
	    case arrow.left:
	        loadVideo('prev');
		break;
	    case arrow.up:
	        chgChan('up');
		break;
	    case arrow.right:
		loadVideo('next');
		break;
	    case arrow.down:
	        chgChan('down');
		break;
	    case 32:
                ytTogglePlay();
	        break;
	    case 70:
	        if(yt_player){
		    $('#fill').attr('checked', true);
	            fillScreen();
	        }
	        break;
	    case 27:
	        if($('#fill').is(':checked')){
		    fillScreen();
	        }
		break;
	}
    });
    setInterval("checkAnchor()", 100);
});

var loadSettings = function loadSettings() {
    var auto_cookie = ($.cookie('auto') == 'true') ? true : false;
    var sfw_cookie = ($.cookie('sfw') == 'true') ? true : false;
    var theme_cookie = $.cookie('theme');
    if(auto_cookie != auto){
	auto = auto_cookie;
	$('#auto').attr('checked', auto_cookie);
    }
    if(sfw_cookie != sfw){
	sfw = sfw_cookie;
	$('#sfw').attr('checked', sfw_cookie);
    }
    if(theme_cookie !== null && theme_cookie != theme){
        theme = theme_cookie;
    }
}

var loadTheme = function loadTheme(id) {
    $('#theme').attr('href', './css/theme_' + id + '.css');
    $.cookie('theme', id);
}

var displayChannels = function displayChannels() {
    var $channel_list = $('#channel-list');
    var list = $('<ul></ul>');
    $channel_list.html(list);
    for(var x in channels.channels){
	$('#channel-list>ul').append('<li id="channel-'+x+'" title="'+channels.channels[x].feed.slice(0,-5)+'">'+channels.channels[x].channel+'</li>');
	$('#channel-'+x).bind(
			       'click'
	                       ,{channel: channels.channels[x].channel, feed: channels.channels[x].feed}
			       ,function(event) {
				   //loadChannel(event.data.channel);
				   var parts = event.data.feed.split("/");
				   window.location.hash = "/"+parts[1]+"/"+parts[2]+"/";
			       });
    }
}

var loadChannel = function loadChannel(channel) {
    var last_req = cur_req;
    if(last_req != null){
	last_req.abort();
    }

    cur_chan = getChan(channel);

    $('#vote-button').empty();

    var $video_embed = $('#video-embed');
    var $video_title = $('#video-title');

    $video_title.html('Loading '+channels.channels[cur_chan].feed.slice(0,-5)+' ...');
    $video_embed.addClass('loading');
    $video_embed.empty();
    
    $('#channel-list>ul>li').removeClass('chan-selected');
    $('#channel-'+getChan(channel)).addClass('chan-selected');

    if(videos[cur_chan] == undefined){
	var feed = getFeedName(channel);
	cur_req = $.jsonp({
	    url: "http://www.reddit.com"+feed+"?limit=100&jsonp=callback",
	    callback: "callback",
	    success: function(data) {
		videos[cur_chan] = new Object;
		videos[cur_chan].video = new Array(); //clear out stored videos
		for(var x in data.data.children){
                    if(!isEmpty(data.data.children[x].data.media_embed)
                       && data.data.children[x].data.media.type != 'soundcloud.com'
                       && data.data.children[x].data.media.type != 'craigslist.org'
                      )
                    {
			videos[cur_chan].video.push(data.data.children[x].data);
                    }
		}
		cur_video = 0;
		loadVideo('first');
	    },
	    error: function() {
		alert('Could not load feed. Is reddit down?');
	    }
	});
    }else{
	cur_video = 0;
	loadVideo('first');
    }
}

var loadVideo = function loadVideo(video) {
    var this_video = cur_video;
    if(video == 'next' && cur_video < Object.size(videos[cur_chan].video)-1){
	cur_video++;
	while(over18() && cur_video < Object.size(videos[cur_chan].video)-1){
	    cur_video++;
	}
	if(over18()){
	    cur_video = this_video;
	}
    }else if (cur_video > 0 && video != 'next'){
	cur_video--;
	while(over18() && cur_video > 0){
	    cur_video--;
	}
	if(over18()){
            cur_video = this_video;
        }
    }
    if(video == 'first'){
	if(over18()){
            while(over18() && cur_video < Object.size(videos[cur_chan].video)-1){
		cur_video++;
            }
	}
    }
    if(this_video != cur_video || video == 'first') {
	$('#video-embed').empty();
	var title = $.unescapifyHTML(videos[cur_chan].video[cur_video].title);
	var esc_title = String(title).replace(/\"/g,'&quot;');
	var embed = $.unescapifyHTML(videos[cur_chan].video[cur_video].media_embed.content);
	if(videos[cur_chan].video[cur_video].media.type == 'youtube.com'){
	    embed = prepYT(embed);
	}else{
	    yt_player = false;
	}
	var permalink = 'http://reddit.com'+$.unescapifyHTML(videos[cur_chan].video[cur_video].permalink);
	$('#video-title').html('<a href="'+permalink+'" target="_blank" title="'+esc_title+'">'+title+'</a>');
	$('#video-embed').html(embed);
	
	/*
	var reddit_string="<iframe src=\"http://www.reddit.com/static/button/button1.html?width=120";
	//reddit_string += '&id=' + videos[cur_chan].video[cur_video].id;
        reddit_string += '&url=' + encodeURIComponent(videos[cur_chan].video[cur_video].url.replace(/&amp;/g, "&"));
        reddit_string += '&title=' + encodeURIComponent($.unescapifyHTML(videos[cur_chan].video[cur_video].title));
        //reddit_string += '&sr=' + encodeURIComponent($.unescapifyHTML(videos[cur_chan].video[cur_video].subreddit));
        //reddit_string += '&css=' + encodeURIComponent(window.reddit_css);
        //reddit_string += '&bgcolor=' + encodeURIComponent(window.reddit_bgcolor); 
        //reddit_string += '&bordercolor=' + encodeURIComponent(window.reddit_bordercolor); 
        reddit_string += '&newwindow=' + encodeURIComponent('1');
        reddit_string += "\" height=\"22\" width=\"150\" scrolling='no' frameborder='0'></iframe>";
	*/

	var reddit_string ="<a href=\"http://reddit.com"+videos[cur_chan].video[cur_video].permalink+"\" target=\"_blank\">";
	reddit_string += videos[cur_chan].video[cur_video].score+"</a>";

	var $vote_button = $('#vote-button');
	$vote_button.fadeOut('slow', function() {
	    $vote_button.html(reddit_string).hide().fadeIn('slow');
	});

	fillScreen();
    }
}

var over18 = function over18() {
    if(sfw && videos[cur_chan].video[cur_video].over_18){
	return true;
    }else{
	return false;
    }
}

var chgChan = function chgChan(up_down) {
    var this_chan = cur_chan;
    if(up_down == 'up' && this_chan > 0){
	cur_chan--;
    }else if(up_down != 'up' && this_chan < channels.channels.length-1){
	cur_chan++;
    }
    if(this_chan != cur_chan){
	var parts = channels.channels[cur_chan].feed.split("/");
        window.location.hash = "/"+parts[1]+"/"+parts[2]+"/";
    }
}

var getFeedName = function getFeedName(channel) {
    for(var x in channels.channels){
	if(channels.channels[x].channel == channel){
	    return channels.channels[x].feed;
	}
    }
}

var getChanName = function getChanName(feed) {
    for(var x in channels.channels){
        if(channels.channels[x].feed == feed){
            return channels.channels[x].channel;
        }
    }
}
var getChan = function getChan(channel) {
    for(var x in channels.channels){
        if(channels.channels[x].channel == channel || channels.channels[x].feed == channel){
            return x;
        }
    }
}

var prepYT = function prepYT(embed) {
    var embed = embed;
    var js_str = '&enablejsapi=1';
    if(embed.indexOf('?fs=1') != -1){
	split = embed.indexOf('?fs=1')+5;
	embed = embed.substr(0,split)+js_str+embed.substr(split);
    }else if(embed.indexOf('&fs=1') != -1){
	split = embed.indexOf('&fs=1')+5;
	embed = embed.substr(0,split)+js_str+embed.substr(split);
    }
    if(embed.indexOf('?fs=1" type="') != -1){
	split = embed.indexOf('?fs=1" type="')+5;
	embed = embed.substr(0,split)+js_str+embed.substr(split);
    }else if(embed.indexOf('&fs=1" type="') != -1){
	split = embed.indexOf('&fs=1" type="')+5;
        embed = embed.substr(0,split)+js_str+embed.substr(split);
    }
    split = embed.indexOf('embed')+5;
    embed = embed.substr(0,split)+' id="ytplayer" wmode="transparent"'+embed.substr(split);
    return embed;
}

var fillScreen = function fillScreen() {
    if(yt_player){
	$object = $('#video-embed>object>embed');
	$fill = $('#fill');
	$filloverlay = $('#fill-overlay');
	if($object.hasClass('fill-screen')){
	    $fill.attr('checked', false);
            $object.removeClass('fill-screen');
	    $filloverlay.css('display', 'none');
	}else if($fill.is(':checked')){
            $fill.attr('checked', true);
	    $object.addClass('fill-screen');
	    $filloverlay.css('display', 'block');
	}
    }
}

var currentAnchor = null;
//check fo anchor changes, if there are do stuff
function checkAnchor(){
    if(currentAnchor != document.location.hash){
        currentAnchor = document.location.hash;
        if(!currentAnchor){
        }else{
            var anchor = currentAnchor.substring(1);
	    var parts = anchor.split("/"); // #/r/videos/id
	    var feed = "/"+parts[1]+"/"+parts[2]+"/.json";
	    var new_chan = getChanName(feed);
	    if(new_chan != undefined){
		loadChannel(new_chan);
	    }
        }
    }else{
        return false;
    }
}

function onYouTubePlayerReady(playerId) {
    yt_player = document.getElementById("ytplayer");
    yt_player.addEventListener("onStateChange", "ytAuto");
}

function ytAuto(state) {
    if(auto){
	if(state == 0){
	    loadVideo('next');
	}else if(state == 5){
	    ytTogglePlay();
	}
    }
}

function ytTogglePlay() {
    if (yt_player) {
	//unstarted (-1), ended (0), playing (1), paused (2), buffering (3), video cued (5)
	if(yt_player.getPlayerState() != 1){
	    yt_player.playVideo();
	}else{
	    yt_player.pauseVideo();
	}
    }
}

var isEmpty = function isEmpty(obj) {
    for(var prop in obj) {
	if(obj.hasOwnProperty(prop))
            return false;
    }
    return true;
}

Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
	if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

function htmlEncode(value){ 
    return $('<div/>').text(value).html(); 
} 

function htmlDecode(value){ 
    return $('<div/>').html(value).text(); 
}