let form = document.getElementById('lobby__form')
let displayName = sessionStorage.getItem('display_name');

if (displayName) {
    form.names.value = displayName;
}

form.addEventListener('submit',  (e) => { 
    e.preventDefault();

    sessionStorage.setItem('display_name', e.target.name.value);
    let inviteCode = e.target.room.value;
    if (!inviteCode) {
        inviteCode = String(Math.floor(Math.random() * 10000));

    }
    //once the room is created or already exists, redirect to the room
    window.location.href = `room.html?room=${inviteCode}`;
})