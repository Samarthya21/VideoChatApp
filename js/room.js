
let messagesContainer = document.getElementById('messages');
messagesContainer.scrollTop = messagesContainer.scrollHeight;

const memberContainer = document.getElementById('members__container');
const memberButton = document.getElementById('members__button');

const chatContainer = document.getElementById('messages__container');
const chatButton = document.getElementById('chat__button');

let activeMemberContainer = false;

memberButton.addEventListener('click', () => {
  if (activeMemberContainer) {
    memberContainer.style.display = 'none';
  } else {
    memberContainer.style.display = 'block';
  }

  activeMemberContainer = !activeMemberContainer;
});

let activeChatContainer = false;

chatButton.addEventListener('click', () => {
  if (activeChatContainer) {
    chatContainer.style.display = 'none';
  } else {
    chatContainer.style.display = 'block';
  }

  activeChatContainer = !activeChatContainer;
});



//main box
let displayFrame = document.getElementById('stream__box');
// all the others remote users stream 

let videoFrames = document.getElementsByClassName('video__container');
//alert('videoFrames', videoFrames);
let userIdInDisplayFrame = null;

//adding the remote user video to the main box
let expandVideoFrame = (e) => { 
  let child = displayFrame.children[0];
  
  //checks if there is already someone in the main box
  if (child) {
    // removes it from the main box and add it to the remote users container
    document.getElementById('streams__container').appendChild(child);
  }
  
  displayFrame.style.display = 'block';
  
  //adds the remote user to the main box
  displayFrame.appendChild(e.currentTarget);
  userIdInDisplayFrame = e.currentTarget.id;

  for (let i = 0; i < videoFrames.length; i++){
    if(videoFrames[i].id !== userIdInDisplayFrame){
      videoFrames[i].style.height = '100px';
      videoFrames[i].style.width = '100px';
    }
    
  }

}
for (let i = 0; i < videoFrames.length; i++){
  videoFrames[i].addEventListener('click', expandVideoFrame);
}

let hideDisplayFrame = () => { 
  userIdInDisplayFrame = null;
  displayFrame.style.display = null;
  let child = displayFrame.children[0];
  //move the user down to the remote users container
  document.getElementById('streams__container').appendChild(child);

  //bring the remote users to previos dimensions 300px*300px
  for (let i = 0; i < videoFrames.length; i++){
    videoFrames[i].style.height = '300px';
    videoFrames[i].style.width = '300px';
  }

}

displayFrame.addEventListener('click', hideDisplayFrame);