"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeBalanceNetoHorario = void 0;
const core_1 = require("@js-joda/core");
const BalanceNetoHorario_js_1 = require("@virtualbat/entities/dist/src/BalanceNetoHorario.js");
const BatterySlot_js_1 = require("@virtualbat/entities/dist/src/BatterySlot.js");
class NodeBalanceNetoHorario {
    constructor(node, config) {
        this.node = null;
        this.nodeContext = null;
        this.balance = null;
        this.reset = { lastResetWas: core_1.LocalDateTime.now(), resetTimeout: null };
        this.node = node;
        this.reset.resetTimeout = config.resetTimeout;
    }
    setNodeContext(nodeContext) {
        this.nodeContext = nodeContext;
    }
    onInput(msg, send, done) {
        var _a, _b, _c;
        this.node.log("Received Battery slot: " + msg);
        try {
            /*if(_isJson(msg.payload)){
              msg.payload=JSON.parse(msg.payload);
            }*/
            (_a = this.balance) === null || _a === void 0 ? void 0 : _a.addBatterySlot(new BatterySlot_js_1.BatterySlot(msg.payload));
            this.serialize();
        }
        catch (error) {
            this.node.log(error);
            this.node.error(error, "Cannot add battery slot");
        }
        this.balance = this.needsResetAndSend(send);
        let debugmsg = (_b = this.balance) === null || _b === void 0 ? void 0 : _b.get();
        this.node.status({ fill: "green", shape: "dot", text: "SLOTS IN " + ((_c = this.balance) === null || _c === void 0 ? void 0 : _c.batterySlots.length) + "|" + (debugmsg === null || debugmsg === void 0 ? void 0 : debugmsg.balanceNetoHorario.feeded) + "|" + (debugmsg === null || debugmsg === void 0 ? void 0 : debugmsg.balanceNetoHorario.produced) });
        done();
    }
    serialize() {
        var _a;
        this.nodeContext.set("lastPayload", JSON.stringify((_a = this.balance) === null || _a === void 0 ? void 0 : _a.get()));
        // this.startTime=LocalDateTime.now().withMinute(0).withSecond(0).withNano(0);
        // this.endTime=this.startTime.plusHours(1);
        // this.batterySlots=new List();
        // this.readTimeStamp=null;
        // this.length=null;
        // this.isConsolidable=false;
    }
    unSerialize() {
        let lastPayload = this.nodeContext.get("lastPayload");
        if (lastPayload !== undefined) {
            this.balance = new BalanceNetoHorario_js_1.BalanceNetoHorario(JSON.parse(lastPayload).balanceNetoHorario);
            if (core_1.LocalDateTime.parse(this.balance.startTime.toString()).until(core_1.LocalDateTime.now(), core_1.ChronoUnit.MINUTES) > 60) {
                this.balance = new BalanceNetoHorario_js_1.BalanceNetoHorario(undefined);
            }
            // lastPayload.batterySlots.forEach(element=>{
            //     balance.addBatterySlot(element);
            // });
        }
        return this.balance;
    }
    needsResetAndSend(send) {
        var _a, _b;
        var msg = { payload: "empty" };
        msg.payload = (_a = this.balance) === null || _a === void 0 ? void 0 : _a.get().balanceNetoHorario;
        if (this.balance !== null) {
            if (core_1.LocalDateTime.parse((_b = this.balance) === null || _b === void 0 ? void 0 : _b.endTime.toString()).isBefore(core_1.LocalDateTime.now()) || core_1.LocalDateTime.now().isAfter(this.reset.lastResetWas.plusSeconds(this.reset.resetTimeout !== null ? this.reset.resetTimeout / 1000 : 0))) {
                this.balance.endTime = core_1.LocalDateTime.now();
                this.balance.consolidable = true;
                msg.payload = this.balance.get().balanceNetoHorario;
                this.balance = new BalanceNetoHorario_js_1.BalanceNetoHorario(undefined);
                this.reset.lastResetWas = core_1.LocalDateTime.now();
            }
            this.node.log("Sending:" + JSON.stringify(msg));
            send(msg);
        }
        return this.balance;
    }
}
exports.NodeBalanceNetoHorario = NodeBalanceNetoHorario;
