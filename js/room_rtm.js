let handleMemberJoined = async (MemberId) => { 
    console.log('A new member joined has joined the room', MemberId);
    //when member joins the room , its added to the participant list 
    addMemberToDom(MemberId);

    let members = await channel.getMembers();
    updateMemberTotal(members);
    let {name}= await rtmClient.getUserAttributesByKeys(MemberId,['name']);
    addBotMessageToDom(`A new member has joined the room! ${name}`)
}

let addMemberToDom = async (MemberId) => { 
    let membersWrapper = document.getElementById('member__list');
    //get user name attribute from the rtmClient
    let {name} = await rtmClient.getUserAttributesByKeys(MemberId,['name']);
    let memberItem = `<div class="member__wrapper" id="member__${MemberId}__wrapper">
                    <span class="green__icon"></span>
                    <p class="member_name">${name}</p>
                </div>`
    
    membersWrapper.insertAdjacentHTML('beforeend',memberItem) 
}

let updateMemberTotal = async (members) => { 
    let total =document.getElementById('members__count')
    total.innerText= members.length
}

let handleMemberLeft = async (MemberId) => { 
    
    removeMemberFromDom(MemberId); 
    let members = await channel.getMembers();
    updateMemberTotal(members);
}

let removeMemberFromDom = async (MemberId) => { 
    let memberWrapper = document.getElementById(`member__${MemberId}__wrapper`);
    memberWrapper.remove();

    let { name } = await rtmClient.getUserAttributesByKeys(MemberId, ['name']);
    addBotMessageToDom(`${name} has left the room!`)
}

let getMembers = async () => { 
    let members = await channel.getMembers();
    updateMemberTotal(members);
    members.forEach(member => {
        addMemberToDom(member);
    });
}

let handleChannelMessage = async (messageData,MemberId) => { 
    console.log('A new message was received')
    let data = JSON.parse(messageData.text);
    
    if(data.type === 'chat'){
        addMessageToDom(data.displayName, data.message);
    }
}
let sendMessage = async (e) => { 
    e.preventDefault();
    let message = e.target.message.value;

    channel.sendMessage({ text: JSON.stringify({ 'type': 'chat', 'message': message, 'displayName': displayName }) });
    addMessageToDom(displayName, message);
    //forms reset after the message is sent
    e.target.reset();
}

let addMessageToDom = async (name, message) => {
    let messagesWrapper = document.getElementById('messages');
    let newMessage = `<div class="message__wrapper">
                        <div class="message__body">
                            <strong class="message__author">${name}</strong>
                            <p class="message__text">${message}</p>
                        </div>
                    </div>`
    
    messagesWrapper.insertAdjacentHTML('beforeend', newMessage);

    let lastMessage = document.querySelector('#messages .message__wrapper:last-child'); 
    if (lastMessage) {
        lastMessage.scrollIntoView();
    }

}

let addBotMessageToDom = async (botMessage) => {
    let messagesWrapper = document.getElementById('messages');
    let newMessage = `<div class="message__wrapper">
                        <div class="message__body__bot">
                            <strong class="message__author__bot">🤖 Bot</strong>
                            <p class="message__text__bot">${botMessage}</p>
                        </div>
                    </div>`
    
    messagesWrapper.insertAdjacentHTML('beforeend', newMessage);

    let lastMessage = document.querySelector('#messages .message__wrapper:last-child'); 
    if (lastMessage) {
        lastMessage.scrollIntoView();
    }

}
let leaveChannel = async () => { 
    await channel.leave();
    await client.logout();
}

window.addEventListener('beforeunload', leaveChannel);
let messageForm = document.getElementById('message__form');
messageForm.addEventListener('submit', sendMessage);