/* youtube listener - called by youtube flash/html5 when present */
function onYouTubePlayerReady(playerId) {
    youtube.obj = document.getElementById("ytplayer");
    youtube.obj.addEventListener("onStateChange", youtube.stateListener, true);
}

/* youtube module */
var youtube = (funtion(){

    var obj; //will hold listeners, etc.

    function stateListener(state){
	if(state === 0){
	    loadVideo('next');
        }else if(state === -1){
	    ytTogglePlay();
        }
    }

    function togglePlay(){
	//unstarted (-1), ended (0), playing (1), paused (2), buffering (3), video cued (5)
        if(yt_player.getPlayerState() !== 1){
            yt_player.playVideo();
        }else{
            yt_player.pauseVideo();
        }
    }

    return {
        stateListener: setPerson,
        togglePlay: togglePlay,
	obj: obj
    };

}());