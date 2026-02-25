const chatbox = document.getElementById("chat-input");
const testMessage = document.getElementById("testMessage");

document.addEventListener("keydown", function(event){
    // enter chat with /
    if (event.key === "/"){
        event.preventDefault();
        chatbox.focus();
        chatbox.classList.add("active");
    }
    // send message with enter if chatbox is 'active'
    if (event.key === "Enter" && document.activeElement === chatbox){
        event.preventDefault();
        const chatMessage = chatbox.ariaValueMax.trim();
        if (chatMessage.length > 0){
            testMessage.innerText = chatMessage;
            // send message to server and have that echo it
        }
    }
    // leave chat with escape
    if (event.key === "Escape" && document.activeElement === chatbox){
        event.preventDefault();
        closeChat();
    }
})

function closeChat(){
    chatbox.blur();
    chatbox.classList.remove("active")
} 