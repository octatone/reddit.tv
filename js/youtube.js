/* youtube module */
var youtube = (funtion(){

    var obj; //will hold listeners, etc.

    function togglePlay(){
	//unstarted (-1), ended (0), playing (1), paused (2), buffering (3), video cued (5)
        if(obj.getPlayerState() !== 1){
            obj.playVideo();
        }else{
            obj.pauseVideo();
        }
    }

    function stateListener(state){
        if(auto){ //global scope
            if(state === 0){
                loadVideo('next');
            }else if(state === -1){
                togglePlay();
            }
        }
    }

    return {
        stateListener: stateListener,
        togglePlay: togglePlay,
	obj: obj
    };

}());

/* youtube listener - called by youtube flash/html5 when present */
function onYouTubePlayerReady(playerId) {
    youtube.obj = document.getElementById("ytplayer");
    youtube.obj.addEventListener("onStateChange", youtube.stateListener, true);
}