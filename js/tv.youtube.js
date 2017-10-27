/*
 *  youtube singleton oh yeah!
 */
 // 1. This code loads the IFrame Player API code asynchronously.
 var tag = document.createElement('script');
 tag.src = "https://www.youtube.com/iframe_api";
 var firstScriptTag = document.getElementsByTagName('script')[0];
 firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);


var youtube = {
    obj: null, //will hold the current youtube embed

    createEmbed: function(url){
        var ID, parts, data = {};

        if(url.match(/(\?v\=|&v\=|&amp;v=)/)){
            parts = url.split('v=');
            ID = parts[1].substr(0,11);
        }else if(url.match(/youtu\.be/)){
            parts = url.split("/");
            ID = parts[3].substr(0,11);
        }

        if(ID){
            data.embed = "&lt;div class=\"embed-container\"&gt;"
            +"&lt;iframe id=\"player\" type=\"text/html\" src=\"http://www.youtube.com/embed/"+ID
            +"?autoplay=1&amp;controls=0&amp;iv_load_policy=3&amp;rel=0&amp;showinfo=0&amp;cc_load_policy=1&amp;disablekb=1&amp;showinfo=0&amp;autohide=1&amp;color=white&amp;enablejsapi=1\""
            +"frameborder=\"0\" allowfullscreen &gt;"
            +"&lt;/iframe&gt;"
            +"&lt;/div&gt;";
            data.thumbnail = "http://i2.ytimg.com/vi/"+ID+"/hqdefault.jpg";
            return data;
        }else{
            return false;
        }
    },

    // prepares embed code for js api access
    prepEmbed: function(embed) {
        var js_str = 'version=3&enablejsapi=1&playerapiid=player';

        embed = embed.replace(/version\=3/gi, js_str);
        embed = embed.replace(/\<embed/i,'<embed id="player"');

        return embed;
    }
};

// 2. This function creates an <iframe> (and YouTube player)
//    after the API code downloads.
var player;
function onYouTubeIframeAPIReady() {
  var player;
  player = new YT.Player('player', {
    events: {
      'onReady': onPlayerReady,
      'onStateChange': onPlayerStateChange,
      'onError': onPlayerError
    }
    });
}
// 4. The API calls this function when the player's state changes.
function onPlayerStateChange(event) {
  var done = false;
  if (event.data == YT.PlayerState.ENDED && !done) {
    loadVideo('next');  //tv.js
    boxy();
    done = true;
  }
}

function onPlayerError(event) {
  loadVideo('next');  //tv.js
  boxy();
}

function onPlayerReady(event) {
  event.target.setVolume(100);
  event.target.playVideo();
}
