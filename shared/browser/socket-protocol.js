/*
    Defines the communication protocol between clients and servers. This avoids messy
    "string-based" communication, which is prone to typos
*/
export var ServerEvent;
(function (ServerEvent) {
    ServerEvent["GAME_STATE"] = "GAME_STATE";
    ServerEvent["INIT_GAME"] = "INIT_GAME";
    ServerEvent["KICKED"] = "KICKED";
    ServerEvent["JOIN_FAILED"] = "JOIN_FAILED";
})(ServerEvent || (ServerEvent = {}));
export var ClientEvent;
(function (ClientEvent) {
    ClientEvent["READY"] = "READY";
    ClientEvent["ACTION"] = "ACTION";
})(ClientEvent || (ClientEvent = {}));
export var ActionType;
(function (ActionType) {
    ActionType["MOVE"] = "MOVE";
    ActionType["FIRE"] = "FIRE";
    ActionType["UPGRADE"] = "UPGRADE";
    ActionType["MESSAGE"] = "MESSAGE";
    ActionType["INTERACT"] = "INTERACT";
    ActionType["DIG"] = "DIG";
    ActionType["RELEASE"] = "RELEASE";
})(ActionType || (ActionType = {}));
