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

$().ready(function(){
	displayChannels();
	$('#channel-1').css('background-color', '#cee3f8');
	loadChannel("Videos");
	$('#next-button').click(function() {
		loadVideo('next');
	    });
	$('#prev-button').click(function() {
		loadVideo('prev');;
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
	$('#channel-list>ul').append('<li id="channel-'+x+'">'+channels.channels[x].channel+'</li>');
	$('#channel-'+x).bind(
			       'click'
			       ,{channel: channels.channels[x].channel}
			       , function(event) {
				   $('#channel-list>ul>li').css('background-color','');
				   $(this).css('background-color','#cee3f8');
				   loadChannel(event.data.channel);
			       });
    }
}

var loadChannel = function loadChannel(channel) {
    var $video_embed = $('#video-embed');
    var $video_title = $('#video-title');

    $video_title.html('Loading ...');
    $video_embed.addClass('loading');
    $video_embed.empty();
    
    var feed = getFeedName(channel);
    $.getJSON("http://www.reddit.com"+feed+"?limit=100&jsonp=?", null
              , function(data) {
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
		  var title = $.unescapifyHTML(videos[cur_video].title);
		  var permalink = 'http://reddit.com'+$.unescapifyHTML(videos[cur_video].permalink);
		  $video_title.html('<a href="'+permalink+'" target="_blank">'+title+'</a>');
		  $video_embed.html($.unescapifyHTML(videos[0].media_embed.content));
              });
}

var loadVideo = function loadVideo(video) {
    var this_video = cur_video;
    if(video == 'next' && cur_video < Object.size(videos)-1){
	cur_video++;
    }else if (cur_video > 0 && video != 'next'){
	cur_video--;
    }
    if(this_video != cur_video) {
	var title = $.unescapifyHTML(videos[cur_video].title);
	var permalink = 'http://reddit.com'+$.unescapifyHTML(videos[cur_video].permalink);
	$('#video-title').html('<a href="'+permalink+'" target="_blank">'+title+'</a>');
	$('#video-embed').html($.unescapifyHTML(videos[cur_video].media_embed.content));
    }
}

var getFeedName = function getFeedName(channel) {
    for(var x in channels.channels){
	if(channels.channels[x].channel == channel){
	    return channels.channels[x].feed;
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
