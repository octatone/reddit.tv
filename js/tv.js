$( document ).ready(function() {
  $('#content-wrapper').hide();
  setTimeout(function() {
     $('#splash').fadeTo(1);
     $('#content-wrapper').show();
  }, 500 );
  setTimeout(function() {
     $('#splash').fadeTo(1500, 0, function(){
       $(this).hide();
     });
     boxy()
  }, 4000 );
});

if ( window.localStorage.getItem('mainChannel') === '' || localStorage.getItem("mainChannel") === null){
  window.localStorage.setItem('mainChannel','nottimanderic');
}

var mainChannel = window.localStorage.getItem('mainChannel');

/* Globals */
var Globals = {
    /* build uri for search type channels */
    search_str: (function () {

        var one_day = 86400,
            date = new Date(),
            unixtime_ms = date.getTime(),
            unixtime = parseInt(unixtime_ms / 1000);
        return "search/.json?q=%28and+%28or+site%3A%27youtube.com%27+site%3A%27vimeo.com%27+site%3A%27youtu.be%27%29+timestamp%3A"+(unixtime - 5*one_day)+"..%29&restrict_sr=on&sort=top&syntax=cloudsearch";
    })(),

    /* Channels Object */
    channels: [
        {channel: 'NotTimAndEric', type: 'normal', feed: '/r/' + mainChannel + '/'}
        ],



    /* Video Domains */
    domains: ['youtube.com', 'youtu.be'],

    sorting: 'hot',

    videos: [],
    user_channels: [],
    cur_video: 0,
    cur_chan: 0,
    cur_chan_req: null,
    cur_vid_req: null,
    current_anchor: null,
    auto: true,
    sfw: false,
    shuffle: true,
    shuffled: [],
    theme: 'light',

    content_minwidth: 130,  // minimum width of #content w/o width of player
    content_minheight: 320, // minimum height of #content w/o height of player
    vd_minwidth: 30,        // minimum width of #video-display w/o width of player
    vd_minheight: 213      // minimum height of #video-display w/o height of player
};

/* MAIN (Document Ready) */
$().ready(function(){
setTimeout(function() {
console.log("I'm done waiting!")
    loadSettings();
    loadTheme(Globals.theme);


    loadChannel("NotTimAndEric", null);


    /* Bindings */
    $('#css li a').click(function() {
        loadTheme($(this).attr('rel'));
        return false;
    });
    $('#auto').click(function() {
        Globals.auto = ($('#auto').is(':checked')) ? true : false;
        $.jStorage.set('auto', Globals.auto);
    });
    $('#shuffle').click(function() {
        Globals.shuffle = ($('#shuffle').is(':checked')) ? true : false;
        Globals.shuffled = []; //reset
        $.jStorage.set('shuffle', Globals.shuffle);
    });
    $('#sfw').click(function() {
        Globals.sfw = ($('#sfw').is(':checked')) ? true : false;
        if(!Globals.sfw){
            if(!confirm("Are you over 18?")){
                $("#sfw").prop("checked", true);
                Globals.sfw = true;
            }
        }
        $.jStorage.set('sfw', Globals.sfw);
        showHideNsfwThumbs(Globals.sfw, Globals.cur_chan);
    });
    $('#next-button').click(function() {
        loadVideo('next');
        playSound();
    });
    $('#prev-button').click(function() {
        loadVideo('prev');
        playSound();
    });
    $('#video-list').bind('mousewheel', function(event,delta){
        this.scrollLeft -= (delta * 30);
    });
    $('#sorting').on('change', function () {

        Globals.sorting = $('#sorting').val();
        Globals.videos = [];
        loadChannel(Globals.channels[Globals.cur_chan].channel, null);
    });
    $(document).keydown(function (e) {
        if(!$(e.target).is('form>*')) {
            var keyCode = e.keyCode || e.which, arrow = {left: 37, up: 38, right: 39, down: 40 };
            switch (keyCode) {
            case arrow.left:  case 74: // j
                loadVideo('prev');
                playSound();
                break;
            case arrow.right: case 75: // k
                loadVideo('next');
                playSound();
                break;
            case 72:
                hackMode();
                break;
            case 73:
                window.localStorage.setItem('mainChannel','nottimanderic');
                reload();
                break;
            /*case 32:
                togglePlay();
                break; */
            case 70:
                launchFullScreen(document.getElementById("player"));
                break;
            case 27:
                  launchFullScreen(document.getElementById("player"));
                break;
            case 67:
                window.open($('#video-title>a').attr('href'), '_blank');
                break;
            }
            return false;
        }
    });

    /* clear add sr on click */
    $('#channel-name').click(function(){
        $(this).val('');
    });

    /* Anchor Checker */
    if("onhashchange" in window){
        checkAnchor(); //perform initial check if hotlinked
        window.onhashchange = function(){
            checkAnchor();
        };
    }else{
        setInterval(checkAnchor, 100);
    }
}, 6000);
});

/* Main Functions */
function loadSettings() {
    var channels_cookie = $.jStorage.get('user_channels'),
        auto_cookie = $.jStorage.get('auto'),
        sfw_cookie = $.jStorage.get('sfw'),
        theme_cookie = $.jStorage.get('theme'),
        shuffle_cookie = $.jStorage.get('shuffle');

    if(auto_cookie !== null && auto_cookie !== Globals.auto){
        Globals.auto = (auto_cookie === 'true') ? true : false;
        $('#auto').attr('checked', Globals.auto);
    }
    if(shuffle_cookie !== null && shuffle_cookie !== Globals.shuffle){
        Globals.shuffle = (shuffle_cookie === 'true') ? true : false;
        $('#shuffle').attr('checked', Globals.shuffle);
    }
    if(sfw_cookie !== null && sfw_cookie !== Globals.sfw){
        Globals.sfw = (sfw_cookie === 'true') ? true : false;
        $('#sfw').attr('checked', Globals.sfw);
    }
    if(theme_cookie !== null && theme_cookie !== Globals.theme){
        Globals.theme = theme_cookie;
    }
    if(channels_cookie !== null && channels_cookie !== Globals.user_channels){
        Globals.user_channels = channels_cookie;
        for(var x in Globals.user_channels){
            Globals.channels.push(Globals.user_channels[x]);
        }
    }
}

function loadTheme(id) {
    $('#theme').attr('href', 'css/theme_' + id + '.css');
    $.jStorage.set('theme', id);
}

function loadChannel(channel, video_id) {
    var last_req = Globals.cur_chan_req, this_chan = getChan(channel), $video_embed = $('#video-embed'), $video_title = $('#video-title'), title;

    // update promo state
    $('#promo-channel li').removeClass('chan-selected');

    if(last_req !== null){
        last_req.abort();
    }

    Globals.shuffled = [];
    Globals.cur_chan = this_chan;

    $('#video-list').stop(true, true).animate({ height:0, padding:0 }, 500, function() {
        $(this).empty().hide();
    });
    $('#prev-button,#next-button').css({ 'visibility':'hidden', 'display':'none' });
    $('#video-source').empty();

    title = Globals.channels[this_chan].feed.split("/");
    title = "/"+title[1]+"/"+title[2];

    $video_embed.empty();

    $('#channel-list>ul>li').removeClass('chan-selected');
    $('#channel-'+this_chan).addClass('chan-selected');



    if(Globals.videos[this_chan] === undefined){
        var feed = getFeedURI(channel);
        Globals.cur_chan_req = $.ajax({
            url: "http://www.reddit.com"+feed,
            dataType: "jsonp",
            crossDomain: true,
            jsonp: "jsonp",
            success: function(data) {
                Globals.videos[this_chan] = {};
                Globals.videos[this_chan].video = []; //clear out stored videos
                for(var x in data.data.children){
                    if(isVideo(data.data.children[x].data.domain) && (data.data.children[x].data.score > 1)){
                        if(isEmpty(data.data.children[x].data.media_embed) || data.data.children[x].data.domain === 'youtube.com' || data.data.children[x].data.domain === 'youtu.be'){
                            var created = createEmbed(data.data.children[x].data.url, data.data.children[x].data.domain);
                            if(created !== false){
                                data.data.children[x].data.media_embed.content = created.embed;
                                data.data.children[x].data.media = {};
                                data.data.children[x].data.media.oembed = {};
                                data.data.children[x].data.media.oembed.thumbnail_url = created.thumbnail;
                            }
                        }
                        if(data.data.children[x].data.media_embed.content){
                            Globals.videos[this_chan].video.push(data.data.children[x].data);
                        }
                    }
                }

                //remove duplicates
                Globals.videos[this_chan].video = filterVideoDupes(Globals.videos[this_chan].video);

                if(Globals.videos[this_chan].video.length > 0){
                    if(video_id !== null){
                        loadVideoById(video_id);
                    }else{
                        loadVideoList(this_chan);
                        Globals.cur_video = 0;
                        loadVideo('first');
                    }
                }else{
                    alert('No videos found.');
                }
            },
            error: function(jXHR, textStatus, errorThrown) {
                if(textStatus !== 'abort'){
                    alert('Could not load feed. Is reddit down?');
                }
            }
        });
    }else{
        if(Globals.videos[this_chan].video.length > 0){
            if(video_id !== null){
                loadVideoById(video_id);
            }else{
                loadVideoList(this_chan);
                Globals.cur_video = 0;
                loadVideo('first');
            }
        }else{
            alert('No videos loaded for '+Globals.channels[this_chan].feed.slice(0,-5));
        }
    }
}

function loadVideoList(chan) {
    var this_chan = chan, $list = $('<span></span>');
    for(var i in Globals.videos[this_chan].video) {
        var this_video = Globals.videos[this_chan].video[i];

        if (! this_video.title_unesc) {
            this_video.title_unesc = $.unescapifyHTML(this_video.title);
            this_video.title_quot  = String(this_video.title_unesc).replace(/\"/g,'&quot;');
        }

        var $thumbnail = $('<img id="video-list-thumb-' + i + '"' + ' rel="' + i + '"' +
                           ' title="' + this_video.title_quot + '"/>');

	// make nsfw thumbnails easily findable
        if (this_video.over_18) {
            $thumbnail.addClass('nsfw_thumb');
        }

        $thumbnail
            .attr('src', 'img/loading.gif')
            .attr('data-original', getThumbnailUrl(this_chan, i))
            .click( function () {
                loadVideo( Number( $(this).attr('rel') ));
            });

        $list.append($thumbnail);
    }

    $('#video-list')
        .stop(true, true)
        .html($list)
        .show()
        .animate({ height: '88px', padding: '5px' }, 1000, function() {
            $('img').lazyload({
                effect : "fadeIn",
                container: $("#video-list")
            });
        });
}



function loadVideo(video) {
    var this_chan = Globals.cur_chan,
        this_video = Globals.cur_video,
        selected_video = this_video,
        videos_size = Object.size(Globals.videos[this_chan].video)-1;

    if(Globals.shuffle){
        if(Globals.shuffled.length === 0){
            shuffleChan(this_chan);
        }
        //get normal key if shuffled already
        selected_video = Globals.shuffled.indexOf(selected_video);
    }

    if(video === 'next' && selected_video <= videos_size){
        selected_video++;
        if(selected_video > videos_size){
            selected_video = 0;
        }
        while(sfwCheck(getVideoKey(selected_video), this_chan) && selected_video < videos_size){
            selected_video++;
        }
        if(sfwCheck(getVideoKey(selected_video), this_chan)){
            selected_video = this_video;
        }
    }else if(selected_video >= 0 && video === 'prev'){
        selected_video--;
        if(selected_video < 0){
            selected_video = videos_size;
        }
        while(sfwCheck(getVideoKey(selected_video), this_chan) && selected_video > 0){
            selected_video--;
        }
        if(sfwCheck(getVideoKey(selected_video), this_chan)){
            selected_video = this_video;
        }
    }else if(video === 'first'){
        selected_video = 0;
        if(sfwCheck(getVideoKey(selected_video), this_chan)){
            while(sfwCheck(getVideoKey(selected_video), this_chan) && selected_video < videos_size){
                selected_video++;
            }
        }
    }
    selected_video = getVideoKey(selected_video);

    if(typeof(video) === 'number'){ //must be a number NOT A STRING - allows direct load of video # in video array
        selected_video = video;
    }

    //exit if trying to load over_18 content without confirmed over 18
    if(sfwCheck(selected_video, this_chan)){
        return false;
    }

    if(selected_video !== this_video || video === 'first' || video === 0) {
        Globals.cur_video = selected_video;

        // scroll to thumbnail in video list and highlight it
        $('#video-list .focus').removeClass('focus');
        $('#video-list-thumb-' + selected_video).addClass('focus');
        $('#video-list').stop(true,true).scrollTo('.focus', { duration:1000, offset:-280 });

        // enable/disable nav-buttons at end/beginning of playlist
        var $prevbutton = $('#prev-button'), $nextbutton = $('#next-button');
        if(selected_video <= 0){
            $prevbutton.stop(true,true).fadeOut('slow', function() {
                $(this).css({ 'visibility':'hidden', 'display':'inline' });
            });
        }else if($prevbutton.css('visibility') === 'hidden'){
            $prevbutton.hide().css({ 'visibility':'visible' }).stop(true,true).fadeIn('slow');
        }

        if(Globals.cur_video >= videos_size){
            $nextbutton.stop(true,true).fadeOut('slow', function() {
                $(this).css({ 'visibility':'hidden', 'display':'inline' });
            });
        }else if($nextbutton.css('visibility') === 'hidden'){
            $nextbutton.hide().css({ 'visibility':'visible' }).stop(true,true).fadeIn('slow');
        }

        //set location hash
        var parts, hash = document.location.hash;
        if(!hash){
            var feed = Globals.channels[this_chan].feed;
            parts = feed.split("/");
            // hash = '/'+parts[1]+'/'+parts[2]+'/'+Globals.videos[this_chan].video[selected_video].id;
            hash = '/universe/'+Globals.videos[this_chan].video[selected_video].id;
        }else{
            var anchor = hash.substring(1);
            parts = anchor.split("/"); // #/r/videos/id
            hash = '/universe/'+Globals.videos[this_chan].video[selected_video].id;
        }
        Globals.current_anchor = '#'+hash;
        window.location.hash = hash;

        gaHashTrack();

        var $video_embed = $('#video-embed');

        $video_embed.empty();

        var embed = $.unescapifyHTML(Globals.videos[this_chan].video[selected_video].media_embed.content);
        embed = prepEmbed(embed, Globals.videos[this_chan].video[selected_video].domain);
        embed = prepEmbed(embed, 'size');

        var redditlink = 'http://reddit.com'+$.unescapifyHTML(Globals.videos[this_chan].video[selected_video].permalink);
        $('#video-title').html('<a href="' + redditlink + '" target="_blank"'
                               + ' title="' + Globals.videos[this_chan].video[selected_video].title_quot + '">'
                               + Globals.videos[this_chan].video[selected_video].title_unesc + '</a>');
        $video_embed.html(embed);

        onYouTubeIframeAPIReady();

        addListeners(Globals.videos[this_chan].video[selected_video].domain);

        var video_source_text = '' +
            '<a href="' + Globals.videos[this_chan].video[selected_video].url + '" target="_blank" title="Watch on Youtube">' +
            '<i class="material-icons md-18">&#xE04A;</i>' +
            '</a>';
        var $video_source = $('#video-source');
        $video_source.stop(true,true).fadeOut('slow', function() {
            $video_source.html(video_source_text).fadeIn('slow');
        });

        boxy();
    }
}

function getVideoKey(key){
    if(Globals.shuffle && Globals.shuffled.length === Globals.videos[Globals.cur_chan].video.length){
        return Globals.shuffled[key];
    }else{
        return key;
    }
}

function loadVideoById(video_id) {
    var this_chan = Globals.cur_chan, video = findVideoById(video_id, this_chan);  //returns number typed
    if(video !== false){
        loadVideoList(this_chan);
        loadVideo(Number(video));
    }else{
        //ajax request
        var last_req = Globals.cur_vid_req;
        if(last_req !== null){
            last_req.abort();
        }

        Globals.cur_vid_req = $.ajax({
            url: "http://www.reddit.com/by_id/t3_"+video_id+".json",
            dataType: "jsonp",
            jsonp: "jsonp",
            success: function(data) {
                if (!isEmpty(data.data.children[0].data.media_embed) && isVideo(data.data.children[0].data.media.type)) {

                    Globals.videos[this_chan].video.splice(0,0,data.data.children[0].data);
                }

                loadVideoList(this_chan);
                loadVideo('first');
            },
            error: function (jXHR, textStatus, errorThrown) {
                if (textStatus !== 'abort') {

                    alert('Could not load data. Is reddit down?');
                }
            }
        });
    }
}





function isVideo (video_domain) {

    return (Globals.domains.indexOf(video_domain) !== -1);
}

//http://dreaminginjavascript.wordpress.com/2008/08/22/eliminating-duplicates/
function filterVideoDupes (arr) {

    var i, out=[], obj={}, original_length = arr.length;

    //work from last video to first video (so hottest dupe is left standing)
    //first pass on media embed
    for (i=arr.length-1; i>=0; i--) {
        if(typeof obj[arr[i].media_embed.content] !== 'undefined'){
            delete obj[arr[i].media_embed.content];
        }
        obj[arr[i].media_embed.content]=arr[i];
    }
    for (i in obj) {
        out.push(obj[i]);
    }

    arr = out.reverse();
    out = [];
    obj = {};

    //second pass on url
    for (i=arr.length-1; i>=0; i--) {
        if(typeof obj[arr[i].url] !== 'undefined'){
            delete obj[arr[i].url];
        }
        obj[arr[i].url]=arr[i];
    }
    for (i in obj) {
        out.push(obj[i]);
    }

    return out.reverse();
}

function findVideoById(id,chan) {
    for(var x in Globals.videos[chan].video){
        if(Globals.videos[chan].video[x].id === id){
            return Number(x); //if found return array pos
        }
    }
    return false; //not found
}

function sfwCheck(video, chan) {
    return (Globals.sfw && Globals.videos[chan].video[video].over_18);
}

function showHideNsfwThumbs(sfw, this_chan) {
    $('.nsfw_thumb').each(function() {
            $(this).attr('src', getThumbnailUrl(this_chan, Number($(this).attr('rel'))));
    });
}

function getThumbnailUrl(chan, video_id) {
    if (sfwCheck(video_id, chan)) {
        return 'img/nsfw.png';
    }
    else if (Globals.videos[chan].video[video_id].media.oembed) {
        return Globals.videos[chan].video[video_id].media.oembed.thumbnail_url !== undefined ?
            Globals.videos[chan].video[video_id].media.oembed.thumbnail_url :
            'img/loading.gif';
    }
    else {
        return 'img/loading.gif';
    }
}

function getFeedURI(channel){
    for(var x in Globals.channels){
        if(Globals.channels[x].channel === channel){
            return formatFeedURI(Globals.channels[x]);
        }
    }
}

function formatFeedURI(channel_obj){

    var sorting = Globals.sorting.split(':');
    var sortType = '';
    var sortOption = '';
    var uri;

    if (sorting.length === 2) {

        sortType = sorting[0] + '/';
        sortOption = '&t=' + sorting[1];
    }

    if (channel_obj.type === 'search' && sorting.length === 1) {

        uri = channel_obj.feed + Globals.search_str + '&limit=100';
    }
    else {

        uri = channel_obj.feed + sortType + '.json?limit=100' + sortOption;
    }

    console.log(uri);
    return uri;
}

function getChanName(feed){
    for(var x in Globals.channels){
        if(Globals.channels[x].feed.indexOf(feed) !== -1){
            return Globals.channels[x].channel;
        }
    }
    return false;
}

function getChan(channel) {
    for(var x in Globals.channels){
        if(Globals.channels[x].channel === channel || Globals.channels[x].feed === channel){
            return x;
        }
    }
    return false;
}

function getUserChan(channel) {
    for(var x in Globals.channels){
        if(Globals.user_channels[x].channel === channel || Globals.user_channels[x].feed === channel){
            return x;
        }
    }
    return false;
}

function isUserChan(channel){
    for(var x in Globals.user_channels){
        if(Globals.user_channels[x].channel === channel){
            return true;
        }
    }
    return false;
}

function createEmbed(url, type){
    switch(type){
    case 'youtube.com': case 'youtu.be':
        return youtube.createEmbed(url);
    case 'vimeo.com':
        return vimeo.createEmbed(url);
    default:
        return false;
    }
}

function prepEmbed(embed, type){
    switch(type){
    case 'youtube.com': case 'youtu.be':
        return youtube.prepEmbed(embed);
    case 'vimeo.com':
        return vimeo.prepEmbed(embed);
    case 'size':
        embed = embed.replace(/height\="(\d\w+)"/gi, 'height="681"');
        embed = embed.replace(/width\="(\d\w+)"/gi, 'width="1255"');
        return embed;
    default:
        return embed;
    }

}

function addListeners (type) {

    switch (type) {
    case 'vimeo.com':
        vimeo.addListeners();
    }
}

function togglePlay(){
    switch(Globals.videos[Globals.cur_chan].video[Globals.cur_video].domain){
    case 'youtube.com': case 'youtu.be':
        youtube.togglePlay();
        break;
    case 'vimeo.com':
        vimeo.togglePlay();
        break;
    }
}

function shuffleChan (chan) { //by index (integer
    /*
       does not shuffle actual video array
       but rather creates a global array of shuffled keys
    */
    Globals.shuffled = []; // reset
    for(var x in Globals.videos[chan].video){
        Globals.shuffled.push(x);
    }
    Globals.shuffled = shuffleArray(Globals.shuffled);
    consoleLog('shuffling channel '+chan);
}

/* Anchor Checker */
//check fo anchor changes, if there are do stuff
function checkAnchor(){
    if(Globals.current_anchor !== document.location.hash){
        consoleLog('anchor changed');
        Globals.current_anchor = document.location.hash;
        if(!Globals.current_anchor){
            /* do nothing */
        }else{
            var anchor = Globals.current_anchor.substring(1);
            var parts = anchor.split("/"); // #/r/videos/id
            parts = $.map(parts, stripHTML);
            var feed = "/universe/";
            var new_chan_name = "NotTimAndEric";
            if(!new_chan_name){
                addChannel("NotTimAndEric");
                new_chan_name = "NotTimAndEric";
            }
            var new_chan_num = getChan(new_chan_name);
            if(new_chan_name !== undefined && new_chan_num !== Globals.cur_chan){
                if(parts[2] === undefined || parts[2] === null || parts[2] === ''){
                    loadChannel(new_chan_name, null);
                }else{
                    loadChannel(new_chan_name, parts[2]);
                }
            }else{
                if(Globals.videos[new_chan_num] !== undefined){
                    loadVideoById(parts[2]);
                }else{
                    loadChannel(new_chan_name, parts[2]);
                }
            }
        }
    }else{
        return false;
    }
}

/* Utility Functions */
//safe console log
function consoleLog(string){
    if(window.console) {
        console.log(string);
    }
}

//http://stackoverflow.com/questions/962802/is-it-correct-to-use-javascript-array-sort-method-for-shuffling/962890#962890
function shuffleArray(array) {
    var tmp, current, top = array.length;

    if(top){
        while(--top) {
            current = Math.floor(Math.random() * (top + 1));
            tmp = array[current];
            array[current] = array[top];
            array[top] = tmp;
        }
    }

    return array;
}

function isEmpty(obj) {
    for(var prop in obj) {
        if(obj.hasOwnProperty(prop)){
            return false;
        }
    }
    return true;
}

Object.size = function(obj) {
    var size = 0, key;
    for(key in obj) {
        if(obj.hasOwnProperty(key)){
            size++;
        }
    }
    return size;
};


function stripHTML (s) {
    return s.replace(/[&<>"'\/]/g, '');
}

/* analytics */
function gaHashTrack(){
    if(_gaq){
        _gaq.push(['_trackPageview',location.pathname + location.hash]);
    }
}

//Squares, and boxes, and stuff like that
var delay = (function(){
  var timer = 0;
  return function(callback, ms){
    clearTimeout (timer);
    timer = setTimeout(callback, ms);
  };
})();

function boxy(){
  $('#video-display').fadeOut( 0, function() {
    var contW = $('#content').width();
    var contH = $('#content').height();
    var contW3 = contW*1430/1632;
    var contH3 = contW*777/1632;
    var contB3 = contW*90/1632;
    $('#video-display, .embed-container, #video-embed').css({
        'width': contW3 + 'px',
        'height': contH3 + 'px',
        'margin': '0 auto ' + contB3 + 'px'
    });
    $('#player').css({
        'width': contW3 + 'px',
        'height': contH3 + 'px'
    });
  });
  $('#video-display').fadeIn(0);
}

$( document ).ready(function() {boxy()});
$( window ).load(function() {boxy()});
$( window ).keyup(function() {boxy()});
$( window ).resize(function() {
  delay(function(){
      boxy();
    }, 0);
});


// Find the right method, call on correct element
function launchFullScreen(element) {
  if(element.requestFullScreen) {
    element.requestFullScreen();
  } else if(element.mozRequestFullScreen) {
    element.mozRequestFullScreen();
  } else if(element.webkitRequestFullScreen) {
    element.webkitRequestFullScreen();
  }
}
// Whack fullscreen
function exitFullscreen() {
  if(document.exitFullscreen) {
    document.exitFullscreen();
  } else if(document.mozCancelFullScreen) {
    document.mozCancelFullScreen();
  } else if(document.webkitExitFullscreen) {
    document.webkitExitFullscreen();
  }
}

$( document ).ready(function() {
  $('#full').click(function(){
    launchFullScreen(document.getElementById("player"));
  })
});

function hackMode(){

  //Show the hack screen
  $("#hack-mode").show(0, function(){
    $("#hack-mode-input").focus();
  });

  //Remove default input functionality (enter)
  var input = $('#hack-mode-input');
  $(input).keydown(function (e) {
    if (e.which == 13) {
      $(input).submit();
      window.localStorage.setItem('mainChannel', input.val());
      reload();
      return false;    //<---- Add this line
    }
  });

}

function reload(){
  var re = /^https?:\/\/[^/]+/i;
  window.location.href = re.exec(window.location.href)[0];
}

//About
$( document ).ready(function() {
  $("#about").click(function(){
    $("#about-content-wrap").fadeIn(200);
  });
  $("#about-content-exit, #about-content-wrap").click(function(){
    $("#about-content-wrap").fadeOut(200);
  });
  $('#about-content').click(function(event){
      event.stopPropagation();
  });
});


audioElement = document.createElement('audio');
audioElement.setAttribute('src', 'audio/channel3.mp3');

var playSound = function(){
  $(".embed-container").hide(0, function(){audioElement.play()}).delay(650).show(0);
}
