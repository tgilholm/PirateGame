const chatbox = document.getElementById("chat-input");

document.addEventListener("keydown", function(event){
    // enter chat with /
    if (event.key === "/"){
        event.preventDefault();
        chatbox.focus();
        chatbox.classList.add("active");
    }
    // send message
    if (event.key === "Enter"){
        // check for message input existing then send
    }
    // leave chat with escape
    if (event.key === "Escape"){
        chatbox.blur();
        chatbox.classList.remove("active");
    }
})