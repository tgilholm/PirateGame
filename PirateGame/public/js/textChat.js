// below const needs type wrapping or else vscode will flag as error, thanks vscode
/* global io */
const chatbox = (/** @type {HTMLInputElement} */ (document.getElementById("chat-input")));
const testMessage = document.getElementById("testMessage");
const socket = io();

document.addEventListener("keydown", function(event){
    // enter chat with /
    if (event.key === "/" && document.activeElement !== chatbox){
        event.preventDefault();
        chatbox.focus();
        chatbox.classList.add("active");
    }
    // send message with enter if chatbox is 'active'
    if (event.key === "Enter" && document.activeElement === chatbox){
        event.preventDefault();
        let chatMessage = chatbox.value.trim();
        if (chatMessage.length > 0){
            socket.emit("chatMessage", chatMessage);
            chatbox.value = "";
            closeChat();
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