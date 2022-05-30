const { LocalDate } = require("@js-joda/core");
const List = require("collections/list");
const LocalDateTime= require("@js-joda/core").LocalDateTime;

class BalanceNetoHorario{
    constructor(msg){
        this.startTime=LocalDateTime.now().withMinute(0).withSecond(0).withNano(0);
        this.endTime=this.startTime.plusHours(1);
        this.batterySlots=new List();
        this.readTimeStamp=null;
        this.length=null;
        this.isConsolidable=false;
    }

    addBatterySlot(slot){
        var slotStart=LocalDateTime.parse(slot.readTimeStamp.toJSON());
        if(slotStart.isBefore(this.startTime)){
            throw "Slot time is before than this slot start time";
        }
        if(slot.length===null){
            throw "Discarded slot, because no lenght defined";
        }

        this.batterySlots.add(slot);
    }

    getProduced(){
        let count=0;
        this.batterySlots.forEach(function(item){
            count+=item.producedInWatsH;
        });
        return count;
    }
    getFeeded(){
        let count=0;
        this.batterySlots.forEach(function(item){
            count+=item.feededInWatsH;
        });
        return count;
    }
    getConsumed(){
        let count=0;
        this.batterySlots.forEach(function(item){
            count+=item.consumedInWatsH;
        });
        return count;
    }

    
    get(){
        return {
            balanceNetoHorario:{
            feeded:this.getFeeded()/12,
            consumed:this.getConsumed()/12,
            produced:this.getProduced()/12,
            startAt:this.startTime,
            endAt:this.endTime,
            isConsolidable:this.isConsolidable
            }
        }
    }

    isConsolidable(){
        return this.isConsolidable;
    }
    
    
}


module.exports = function(RED) {
    var balance=new BalanceNetoHorario();
    var lastResetWas=LocalDateTime.now();
    var resetTimeout=null;
    var node;

    function VirtualBatteryBalanceNetoHorarioNode(config) {
        RED.nodes.createNode(this,config);
        node=this;
        resetTimeout=config.resetTimeout;
        node.log("INIT");
        node.on('input',function(msg, send, done){
          node.log("Received Battery slot: "+JSON.stringify(msg));
          try{
          balance.addBatterySlot(msg.payload);
          }catch(error){
            node.error(error,"Cannot add battery slot");
          }
          needsResetAndSend(node,send);
          node.status({fill:"green",shape:"dot",text:"SLOTS IN "+balance.batterySlots.length});        
          done();
        });
    }    

function needsResetAndSend(node,send){
    var msg={payload:"empty"};
    msg.payload=balance.get().balanceNetoHorario;
   
    if(balance.endTime.isBefore(LocalDateTime.now()) || LocalDateTime.now().isAfter(lastResetWas.plusSeconds(resetTimeout/1000))){
        balance.endTime=LocalDateTime.now();
        balance.isConsolidable=true;
        msg.payload=balance.get().balanceNetoHorario;
        balance=new BalanceNetoHorario();
        lastResetWas=LocalDateTime.now();
    }
    
    node.log("Sending:"+JSON.stringify(msg));
    send(msg);
    
}
    RED.nodes.registerType("virtual-battery-balance-neto-horario",VirtualBatteryBalanceNetoHorarioNode);
}