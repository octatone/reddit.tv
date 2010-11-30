var channels = {"channels": [
    {"channel": "All", "feed": "/r/all/.json"}
    ,{"channel": "Videos", "feed": "/r/videos/.json"}
    ,{"channel": "Funny", "feed": "/r/funny/.json"}
    ,{"channel": "Politics", "feed": "/r/politics/.json"}
    ,{"channel": "WTF", "feed": "/r/wtf/.json"}
    ,{"channel": "Gaming", "feed": "/r/gaming/.json"}
    ,{"channel": "Science", "feed": "/r/science/.json"}
    ,{"channel": "Geek", "feed": "/r/geek/.json"}
    ,{"channel": "AWW", "feed": "/r/aww/.json"}
    ,{"channel": "Music", "feed": "/r/music/.json"}
    ,{"channel": "Sports", "feed": "/r/sports/.json"}
    ,{"channel": "TED", "feed": "/r/ted/.json"}
  ]
};

var videos = new Array();
var cur_video = 0;
var cur_chan = 0;
var cur_req = null;

$().ready(function(){
	displayChannels();
	loadChannel("Videos");
	$('#next-button').click(function() {
		loadVideo('next');
	    });
	$('#prev-button').click(function() {
		loadVideo('prev');;
	    });
	//bind arrow keys
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
		}
	});
});

var displayChannels = function displayChannels() {
    var $channel_list = $('#channel-list');
    var list = $(
		 '<ul>'
		 +'</ul>'
		 );
    $channel_list.html(list);
    for(var x in channels.channels){
	$('#channel-list>ul').append('<li id="channel-'+x+'" title="'+channels.channels[x].feed.slice(0,-5)+'">'+channels.channels[x].channel+'</li>');
	$('#channel-'+x).bind(
			       'click'
			       ,{channel: channels.channels[x].channel}
			       , function(event) {
				   loadChannel(event.data.channel);
			       });
    }
}

var loadChannel = function loadChannel(channel) {
    var last_req = cur_req;
    if(last_req != null){
	last_req.abort();
    }

    cur_chan = getChan(channel);

    var $video_embed = $('#video-embed');
    var $video_title = $('#video-title');

    $video_title.html('Loading '+channels.channels[cur_chan].feed.slice(0,-5)+' ...');
    $video_embed.addClass('loading');
    $video_embed.empty();
    
    $('#channel-list>ul>li').removeClass('chan-selected');
    $('#channel-'+getChan(channel)).addClass('chan-selected');
    
    var feed = getFeedName(channel);
    cur_req = $.jsonp({
	url: "http://www.reddit.com"+feed+"?limit=100&jsonp=callback",
	callback: "callback",
	success: function(data) {
	    // This will be called in case of success no matter the callback name
	    videos = new Array(); //clear out stored videos
            for(var x in data.data.children){
                if(!isEmpty(data.data.children[x].data.media_embed)
                         && data.data.children[x].data.media.type != 'soundcloud.com'
                         && data.data.children[x].data.media.type != 'craigslist.org'
                  )
                {
                    videos.push(data.data.children[x].data);
                }
            }
	    cur_video = 0;
	    loadVideo('first');
	},
	error: function() {
	    // This will be called in case of error no matter the callback name
	    alert('no data loaded');
	}
    });
}

var loadVideo = function loadVideo(video) {
    var this_video = cur_video;
    if(video == 'next' && cur_video < Object.size(videos)-1){
	cur_video++;
    }else if (cur_video > 0 && video != 'next'){
	cur_video--;
    }
    if(this_video != cur_video || video == 'first') {
	var title = $.unescapifyHTML(videos[cur_video].title);
	var permalink = 'http://reddit.com'+$.unescapifyHTML(videos[cur_video].permalink);
	$('#video-title').html('<a href="'+permalink+'" target="_blank" title="'+videos[cur_video].title+'">'+title+'</a>');
	$('#video-embed').html($.unescapifyHTML(videos[cur_video].media_embed.content));
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
	loadChannel(channels.channels[cur_chan].channel);
    }
}

var getFeedName = function getFeedName(channel) {
    for(var x in channels.channels){
	if(channels.channels[x].channel == channel){
	    return channels.channels[x].feed;
	}
    }
}

var getChan = function getChan(channel) {
    for(var x in channels.channels){
        if(channels.channels[x].channel == channel){
            return x;
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
