const APP_ID = "dc19d57c51164ff4a7e3717c431012fe"

let uid = sessionStorage.getItem('uid')
//if no uid then generate a new one and store it in session storage
if (!uid) {
    uid = String(Math.floor(Math.random() * 10000))
    sessionStorage.setItem('uid', uid)
}
//authentication in production for users
let token = null;

let client;

//for client for Real Time Chat
let rtmClient;
let channel;


//getting url value
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
let roomId =urlParams.get('room');
//room.html?room=21214

if (!roomId) {
    roomId='main'
}

let displayName = sessionStorage.getItem('display_name');
if (!displayName) { 
    window.location = 'lobby.html'
}

//local streams
let localTracks = []
//other users streams 
let remoteUsers={}

//user's screen
let localScreenTracks;
let sharingScreen = false;


let joinRoomInit = async () => {
    
    //join rtm channel by making the rtmClient
    rtmClient = await AgoraRTM.createInstance(APP_ID);
    await rtmClient.login({ uid,token });
    //gives the client object an attribute of name
    await rtmClient.addOrUpdateLocalUserAttributes({ 'name': displayName });
    //join the RTMchannel
    channel = await rtmClient.createChannel(roomId);
    await channel.join();
   
    //event listener for the member joined room
    channel.on('MemberJoined', handleMemberJoined);
    //event listener for the member left room
    channel.on('MemberLeft', handleMemberLeft);
    //event listener for channel message
    channel.on('ChannelMessage', handleChannelMessage);

    //get all the members in the channel
    getMembers();

    addBotMessageToDom(`Welcome to the room ${displayName}!`)

    client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' })
    await client.join(APP_ID, roomId, token, uid)
    
    //This line sets up an event listener for the user-published event. When a new user publishes their stream, the handleUserPublished function will be called.
    //When a user publishes their stream, the Agora SDK automatically notifies all other clients in the same channel. This is done through the user-published event
    // event listener for the user-published is on on all the clients 
    client.on('user-published', handleUserPublished);

    //All the clients have this user-left event listener and then it calls the corresponding fn 
    client.on('user-left',handleUserLeft)
    joinStream()
}

let joinStream = async () => {
    // asks for the permissions for the audio and video tracks 
    // then adds the audio and video tracks to this localTracks
    localTracks = await AgoraRTC.createMicrophoneAndCameraTracks();

    let player=`<div class="video__container" id="user-container-${uid}">
                        <div class="video-player" id="user-${uid}"></div>
                    </div>`
    
    document.getElementById('streams__container').insertAdjacentHTML('beforeend', player);
    document.getElementById(`user-container-${uid}`).addEventListener('click', expandVideoFrame)
    //need to publish this local track to the channel so others can see our track .
    // or to view remote tracks 
    localTracks[1].play(`user-${uid}`);//video track

    //triggers the user-piblished event
    await client.publish([localTracks[0], localTracks[1]]);

    
}

// when screen tracks is unpublish then switch to camera
let switchToCamera = async () => { 
    let player=`<div class="video__container" id="user-container-${uid}">
                        <div class="video-player" id="user-${uid}"></div>
                    </div>`
    
    displayFrame.insertAdjacentHTML('beforeend', player);

    //mute ourselves
    await localTracks[0].setMuted(true);
    await localTracks[1].setMuted(true);

    document.getElementById('mic-btn').classList.remove('active');
    document.getElementById('screen-btn').classList.remove('active');

    // play the video track 
    localTracks[1].play(`user-${uid}`);
    // publish the video track(only video)
    await client.publish(localTracks[1]);

}

let handleUserPublished = async (user, mediaType) => { 
    remoteUsers[user.uid] = user

    await client.subscribe(user, mediaType);
    let player = document.getElementById(`user-container-${user.uid}`)
    // check for duplicate players
    if (player === null) {
        player = `<div class="video__container" id="user-container-${user.uid}">
                        <div class="video-player" id="user-${user.uid}"></div>
                    </div>`
    
        document.getElementById('streams__container').insertAdjacentHTML('beforeend', player);

        // whenever a new remote user joins it should be able to expand the video frame
        document.getElementById(`user-container-${uid}`).addEventListener('click', expandVideoFrame)
    }

    if (displayFrame.style.display) {
        let videoFrame = document.getElementById(`user-container-${user.uid}`);
        videoFrame.style.height = '100px';
        videoFrame.style.width = '100px';
        
    }

    if(mediaType === 'video'){
        user.videoTrack.play(`user-${user.uid}`);
    }
    if(mediaType === 'audio'){
        user.audioTrack.play();
    }
    
}

let handleUserLeft = async (user) => { 
    delete remoteUsers[user.uid]
    document.getElementById(`user-container-${user.uid}`).remove()

    //see if the user that left was in the main box/stream box
    if(userIdInDisplayFrame === `user-container${user.uid}`){
        displayFrame.style.display = null;

        let videoFrames = document.getElementsByClassName('video-container');
        // if main user left then set every other users to 300px
        for(let i = 0; i < videoFrames.length; i++){
            videoFrames[i].style.height = '300px';
            videoFrames[i].style.width = '300px';
        }
    }
}

let toggleMic = async (e) => {
    let button = e.currentTarget;

    //remove active class
    if (localTracks[0].muted) {
        //turn on the audio
        await localTracks[1].setMuted(false);
        button.classList.add('active');
    }
    else {
        //turn off the audio
        await localTracks[1].setMuted(true);
        button.classList.remove('active');
    }
}

let toggleCamera = async (e) => {
    let button = e.currentTarget;

    //remove active class
    if (localTracks[1].muted) {
        //turn on the camera
        await localTracks[1].setMuted(false);
        button.classList.add('active');
    }
    else {
        //turn off the camera
        await localTracks[1].setMuted(true);
        button.classList.remove('active');
    }
}

let toggleScreen = async (e) => { 
    let screenButton = e.currentTarget;
    //removes camera button when sharing screen
    let cameraButton = document.getElementById('camera-btn');
    
    if (!sharingScreen) {
        sharingScreen = true;

        screenButton.classList.add('active');

        cameraButton.classList.remove('active');
        cameraButton.style.display = 'none';

        //user's screen recording/video
        localScreenTracks = await AgoraRTC.createScreenVideoTrack();
        //removes your video trak (camera)
        document.getElementById(`user-container-${uid}`).remove();
        displayFrame.style.display = 'block';

        //adds the screen track to the main box
        let player = `<div class="video__container" id="user-container-${uid}">
        <div class="video-player" id="user-${uid}"></div>
    </div>`
        //takes this new video player(user'screen) and add it to the main box(locally)
        // this will only be seen by the local user
        displayFrame.insertAdjacentHTML('beforeend', player);
        document.getElementById(`user-container-${uid}`).addEventListener('click', expandVideoFrame);

        userIdInDisplayFrame = `user-container-${uid}`;

        localScreenTracks.play(`user-${uid}`);
 
        //unpublish camera track 
        await client.unpublish([localTracks[1]]);
        //publish the screen track to remote users
        //this will make sure the screen track is seen by all the remote users
        await client.publish([localScreenTracks]);

        let videoFrames = document.getElementsByClassName('video__container');
        for (let i = 0; i < videoFrames.length; i++){
            if(videoFrames[i].id !== userIdInDisplayFrame){
              videoFrames[i].style.height = '100px';
              videoFrames[i].style.width = '100px';
            }
            
        }




    }
    else { 
        //if currently sharing screen and want to stop (toggle)
        sharingScreen = false;
        cameraButton.style.display = 'block';
        document.getElementById(`user-container-${uid}`).remove();


        //unpublish the user's screen tracks to remote users
        await client.unpublish([localScreenTracks]);
        //publish the camera track to remote users


        switchToCamera();

    }
}


document.getElementById('camera-btn').addEventListener('click', toggleCamera)
document.getElementById('mic-btn').addEventListener('click', toggleMic)
document.getElementById('screen-btn').addEventListener('click', toggleScreen)

joinRoomInit()