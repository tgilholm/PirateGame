"use strict";
/*
    Defines the communication protocol between clients and servers. This avoids messy
    "string-based" communication, which is prone to typos
*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActionType = exports.ClientEvent = exports.ServerEvent = void 0;
var ServerEvent;
(function (ServerEvent) {
    ServerEvent["GAME_STATE"] = "GAME_STATE";
    ServerEvent["INIT_GAME"] = "INIT_GAME";
    ServerEvent["KICKED"] = "KICKED";
    ServerEvent["JOIN_FAILED"] = "JOIN_FAILED";
    ServerEvent["DIG_MINIGAME_START"] = "DIG_MINIGAME_START";
    ServerEvent["DIG_MINIGAME_RESULT"] = "DIG_MINIGAME_RESULT";
})(ServerEvent || (exports.ServerEvent = ServerEvent = {}));
var ClientEvent;
(function (ClientEvent) {
    ClientEvent["READY"] = "READY";
    ClientEvent["ACTION"] = "ACTION";
})(ClientEvent || (exports.ClientEvent = ClientEvent = {}));
var ActionType;
(function (ActionType) {
    ActionType["AIM"] = "AIM";
    ActionType["MOVE"] = "MOVE";
    ActionType["FIRE"] = "FIRE";
    ActionType["UPGRADE"] = "UPGRADE";
    ActionType["MESSAGE"] = "MESSAGE";
    ActionType["INTERACT"] = "INTERACT";
    ActionType["DIG"] = "DIG";
    ActionType["RELEASE"] = "RELEASE";
    ActionType["TREASURE_INTERACT"] = "TREASURE_INTERACT";
})(ActionType || (exports.ActionType = ActionType = {}));
