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

var domains = ['5min.com', 'abcnews.go.com', 'animoto.com', 'atom.com',
	       'bambuser.com', 'bigthink.com', 'blip.tv', 'break.com',
	       'cbsnews.com', 'cnbc.com', 'cnn.com', 'colbertnation.com', 'collegehumor.com',
	       'comedycentral.com', 'crackle.com', 'dailymotion.com',
	       'dotsub.com', 'edition.cnn.com', 'escapistmagazine.com', 'espn.go.com',
	       'fancast.com', 'flickr.com', 'fora.tv', 'foxsports.com',
	       'funnyordie.com', 'gametrailers.com', 'godtube.com', 'howcast.com', 'hulu.com',
	       'justin.tv', 'kinomap.com', 'koldcast.tv', 'liveleak.com', 'livestream.com',
	       'mediamatters.org', 'metacafe.com', 'money.cnn.com',
	       'movies.yahoo.com', 'msnbc.com', 'nfb.ca', 'nzonscreen.com',
	       'overstream.net', 'photobucket.com', 'qik.com', 'redux.com',
	       'revision3.com', 'revver.com', 'schooltube.com',
	       'screencast.com', 'screenr.com', 'sendables.jibjab.com',
	       'spike.com', 'teachertube.com', 'techcrunch.tv', 'ted.com',
	       'thedailyshow.com', 'theonion.com', 'traileraddict.com', 'trailerspy.com',
	       'trutv.com', 'twitvid.com', 'ustream.com', 'viddler.com', 'video.google.com',
	       'video.pbs.org', 'video.yahoo.com', 'vids.myspace.com', 'vimeo.com',
	       'wordpress.tv', 'worldstarhiphop.com', 'xtranormal.com',
	       'youtube.com', 'zapiks.com'];

var videos = new Array();
var cur_video = 0;
var cur_chan = 0;
var cur_chan_req = null;
var cur_vid_req = null;
var auto = true;
var sfw = true;
var theme = 'light';
var yt_player = false;

$().ready(function(){
    loadSettings();
    loadTheme(theme);
    displayChannels();
    loadChannel("Videos", null);

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
	$.cookie('auto', auto, {expires: 7});
    });
    $('#sfw').click(function() {
        sfw = ($('#sfw').is(':checked')) ? true : false;
	$.cookie('sfw', sfw, {expires: 7});
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
    var auto_cookie = $.cookie('auto');
    var sfw_cookie = $.cookie('sfw');
    var theme_cookie = $.cookie('theme');
    if(auto_cookie != null && auto_cookie != auto){
	auto = (auto_cookie == 'true') ? true : false;
	$('#auto').attr('checked', auto);
    }
    if(sfw_cookie != null && sfw_cookie != sfw){
	sfw = (sfw_cookie == 'true') ? true : false;
	$('#sfw').attr('checked', sfw);
    }
    if(theme_cookie !== null && theme_cookie != theme){
        theme = theme_cookie;
    }
}

var loadTheme = function loadTheme(id) {
    $('#theme').attr('href', './css/theme_' + id + '.css');
    $.cookie('theme', id, {expires: 7});
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

var loadChannel = function loadChannel(channel, video_id) {
    var last_req = cur_chan_req;
    if(last_req != null){
	last_req.abort();
    }

    var this_chan = getChan(channel);

    $('#video-list').stop(true, true).animate({ height:0, padding:0 }, 500, function() {
	$(this).empty().hide();
    });
    $('#vote-button').empty();
    $('#video-source').empty();

    var $video_embed = $('#video-embed');
    var $video_title = $('#video-title');

    $video_title.html('Loading '+channels.channels[this_chan].feed.slice(0,-5)+' ...');
    $video_embed.addClass('loading');
    $video_embed.empty();
    
    $('#channel-list>ul>li').removeClass('chan-selected');
    $('#channel-'+this_chan).addClass('chan-selected');

    if(videos[this_chan] == undefined){
	var feed = getFeedName(channel);
	cur_chan_req = $.jsonp({
	    url: "http://www.reddit.com"+feed+"?limit=100&jsonp=callback",
	    callback: "callback",
	    success: function(data) {
		videos[this_chan] = new Object;
		videos[this_chan].video = new Array(); //clear out stored videos
		for(var x in data.data.children){
                    if(!isEmpty(data.data.children[x].data.media_embed)
                       && isVideo(data.data.children[x].data.media.type)
                      )
                    {
			videos[this_chan].video.push(data.data.children[x].data);
                    }
		}

		if(video_id != null){
		    loadVideoById(video_id);
		}else{
		    loadVideoList(this_chan);
		    cur_video = 0;
		    loadVideo('first');
		}
	    },
	    error: function() {
		alert('Could not load feed. Is reddit down?');
	    }
	});
    }else{
	if(video_id != null){
            loadVideoById(vide_id);
        }else{
	    loadVideoList(this_chan);
	    cur_video = 0;
	    loadVideo('first');
	}
    }
    cur_chan = this_chan;
}

var loadVideoList = function loadVideoList(chan) {
    var this_chan = chan;
    var $list = $('<span></span>');
    for(var i in videos[this_chan].video) {
	if (! videos[this_chan].video[i].title_unesc) {
	    videos[this_chan].video[i].title_unesc = $.unescapifyHTML(videos[this_chan].video[i].title);
	    videos[this_chan].video[i].title_quot  = String(videos[this_chan].video[i].title_unesc).replace(/\"/g,'&quot;');
	}
	
	var img_url = videos[this_chan].video[i].media.oembed.thumbnail_url;
	if (! img_url) {
	    img_url = 'img/noimage.png'; //thumbnail_missing.jpg
	}
	if (over18(i)){
	    img_url = 'img/nsfw.png';
	}
	
	var $thumbnail = $('<img src="' + img_url + '"' +
			   ' id="video-list-thumb-' + i + '"' + ' class="video-list-thumb" rel="' + i + '"' +
			   ' title="' + videos[this_chan].video[i].title_quot + '"/>');
	
	$thumbnail.click(function() {
	    loadVideo(parseInt( $(this).attr('rel') ));
	});
	
	$list.append($thumbnail);
    }
    videos[this_chan].video_list = $list;

    $('#video-list')
        .stop(true, true)
	.html(videos[this_chan].video_list)
	.show()
	.animate({ height: '88px', padding: '5px' }, 1000);
}

var loadVideo = function loadVideo(video) {
    var this_chan = cur_chan;
    var this_video = cur_video;
    var selected_video = this_video;
    if(video == 'next' && selected_video < Object.size(videos[this_chan].video)-1){
	selected_video++;
	while(over18(selected_video) && selected_video < Object.size(videos[this_chan].video)-1){
	    selected_video++;
	}
	if(over18(selected_video)){
	    selected_video = this_video;
	}
    }else if (selected_video > 0 && video == 'prev'){
	selected_video--;
	while(over18(selected_video) && selected_video > 0){
	    selected_video--;
	}
	if(over18(selected_video)){
            selected_video = this_video;
        }
    }
    if(video == 'first'){
	if(over18(selected_video)){
            while(over18(selected_video) && selected_video < Object.size(videos[this_chan].video)-1){
		selected_video++;
            }
	}
    }
    if(typeof(video) == 'number'){ //must be a number NOT A STRING - allows direct load of video # in video array
	selected_video = video;
    }
    if(selected_video != this_video || video == 'first') {
	cur_video = selected_video;
	// scroll to thumbnail in video list and highlight it
	$('#video-list .focus').removeClass('focus');
	$('#video-list-thumb-' + selected_video).addClass('focus');
	$('#video-list').scrollTo('.focus', { duration:1000, offset:-280 });

	//set location hash
	var hash = document.location.hash;
        if(!hash){
	    var feed = channels.channels[this_chan].feed;
	    var parts = feed.split("/");
	    hash = '/'+parts[1]+'/'+parts[2]+'/'+videos[this_chan].video[selected_video].id;
        }else{
            var anchor = hash.substring(1);
            var parts = anchor.split("/"); // #/r/videos/id
            hash = '/'+parts[1]+'/'+parts[2]+'/'+videos[this_chan].video[selected_video].id;
	}
	currentAnchor = '#'+hash;
        window.location.hash = hash;

	$('#video-embed').empty();
	var embed = $.unescapifyHTML(videos[this_chan].video[selected_video].media_embed.content);
	if(videos[this_chan].video[selected_video].media.type == 'youtube.com'){
	    embed = prepYT(embed);
	}else{
	    yt_player = false;
	}

	var redditlink = 'http://reddit.com'+$.unescapifyHTML(videos[this_chan].video[selected_video].permalink);
	$('#video-title').html('<a href="' + redditlink + '" target="_blank"'
			       + ' title="' + videos[this_chan].video[selected_video].title_quot + '">'
			       + videos[this_chan].video[selected_video].title_unesc + '</a>');
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

	var score = videos[this_chan].video[selected_video].score;
	var num_comments = videos[this_chan].video[selected_video].num_comments;
	var reddit_string = '<a href="'+redditlink+'" target="_blank">'
	    + score + ((score == 1) ? ' vote' : ' votes')
	    + ' &bull; '
	    + num_comments + ((num_comments == 1) ? ' comment' : ' comments')
	    + '</a>';

	var $vote_button = $('#vote-button');
	$vote_button.fadeOut('slow', function() {
	    $vote_button.html(reddit_string).hide().fadeIn('slow');
	});

	var video_source_text = 'Source: '
	    + '<a href="' + videos[this_chan].video[selected_video].url + '" target="_blank">'
	    + videos[this_chan].video[selected_video].media.oembed.provider_name
	    + '</a>';
	var $video_source = $('#video-source');
	$video_source.fadeOut('slow', function() {
	    $video_source.html(video_source_text).hide().fadeIn('slow');
	});

	fillScreen();
    }
}

var loadVideoById = function loadVideoById(video_id) {
    var this_chan = cur_chan;
    var video = findVideoById(this_chan, video_id);  //returns number typed                                 
    if(video != false){
	loadVideoList(this_chan);
        loadVideo(video);
    }else{
        //ajax request
	var last_req = cur_vid_req;
	if(last_req != null){
            last_req.abort();
	}
	
	cur_vid_req = $.jsonp({
            url: "http://www.reddit.com/by_id/t3_"+video_id+".json?jsonp=callback",
            callback: "callback",
            success: function(data) {
                if(!isEmpty(data.data.children[0].data.media_embed)
                   && isVideo(data.data.children[0].data.media.type)
                  )
                {
                    videos[this_chan].video.splice(0,0,data.data.children[0].data);
                }
		loadVideoList(this_chan);
		loadVideo('first');
            },
            error: function() {
                alert('Could not load data. Is reddit down?');
            }
        });
    }
}

var isVideo = function isVideo(video_domain) {
    return (domains.indexOf(video_domain) != -1);
}

var findVideoById = function findVideoById(chan, id) {
    for(var x in videos[chan].video){
	if(videos[chan].video[x].id == id){
	    return Number(x); //if found return array pos
	}
    }
    return false; //not found
}

var over18 = function over18(video) {
    return (sfw && videos[cur_chan].video[video].over_18);
}

var chgChan = function chgChan(up_down) {
    var this_chan = cur_chan;
    if(up_down == 'up' && this_chan > 0){
	this_chan--;
    }else if(up_down != 'up' && this_chan < channels.channels.length-1){
	this_chan++;
    }
    if(this_chan != cur_chan){
	var parts = channels.channels[this_chan].feed.split("/");
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
	$object = $('#video-embed embed');
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
	    var new_chan_name = getChanName(feed);
	    var new_chan_num = getChan(new_chan_name);
	    if(new_chan_name != undefined && new_chan_num != cur_chan){
		if(parts[3] == undefined || parts[3] == null || parts[3] == ''){
                    loadChannel(new_chan_name, null);
		}else{
		    loadChannel(new_chan_name, parts[3]);
		}
	    }else{
		if(videos[new_chan_num] != undefined){
		    loadVideoById(new_chan_num, parts[3]);
		}else{
		    loadChannel(new_chan_name, parts[3]);
		}
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