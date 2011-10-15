/*
 *  youtube singleton oh yeah! 
 */
var youtube = {
    obj: null //will hold the current youtube embed

    ,togglePlay: function(){
        //unstarted (-1), ended (0), playing (1), 
        //paused (2), buffering (3), video cued (5)
        if(youtube.obj.getPlayerState() !== 1){
            youtube.obj.playVideo();
        }else{
            youtube.obj.pauseVideo();
        }
    }

    ,stateListener: function(state){
        if(globals.auto){ //global scope
            if(state === 0){
                loadVideo('next');  //tv.js
            }else if(state === -1){
                youtube.togglePlay();
            }
        }
    }

    // prepares embed code for js api access
    ,prepEmbed: function(embed) {
        var js_str = '&enablejsapi=1&playerapiid=ytplayer';
        
        if(embed.indexOf('version=3') !== -1){
            split = embed.indexOf('version=3');
            embed = embed.substr(0,split+9)+js_str+embed.substr(split+9);
        }


        if(embed.indexOf('version=3&feature=oembed') !== -1){
            split = embed.indexOf('version=3&feature=oembed');
            embed = embed.substr(0,split+24)+js_str+embed.substr(split+24);
        }

        split = embed.indexOf('<embed')+6;
        embed = embed.substr(0,split)+' id="ytplayer" '+embed.substr(split);
    
        return embed;
    }
}

/* 
 *  youtube listener - called by youtube flash/html5 when present 
 */
function onYouTubePlayerReady(playerId) {
    youtube.obj = document.getElementById("ytplayer");
    youtube.obj.addEventListener("onStateChange", "youtube.stateListener", true);
}