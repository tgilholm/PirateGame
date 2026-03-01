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
})(ServerEvent || (exports.ServerEvent = ServerEvent = {}));
var ClientEvent;
(function (ClientEvent) {
    ClientEvent["READY"] = "PLAYER_READY";
    ClientEvent["REQUEST_JOIN"] = "REQUEST_JOIN";
    ClientEvent["REQUEST_SYNC"] = "REQUEST_SYNC";
    ClientEvent["ACTION"] = "ACTION";
})(ClientEvent || (exports.ClientEvent = ClientEvent = {}));
var ActionType;
(function (ActionType) {
    ActionType["MOVE"] = "MOVE";
    ActionType["FIRE"] = "FIRE";
    ActionType["UPGRADE"] = "UPGRADE";
    ActionType["MESSAGE"] = "MESSAGE";
    ActionType["INTERACT"] = "INTERACT";
    ActionType["DIG"] = "DIG";
    ActionType["RELEASE"] = "RELEASE";
})(ActionType || (exports.ActionType = ActionType = {}));
