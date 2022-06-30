const { LocalDate } = require("@js-joda/core");
const List = require("collections/list");
const LocalDateTime= require("@js-joda/core").LocalDateTime;

class BalanceNetoHorario{
    constructor(msg){
        if(msg===undefined){
        this.startTime=LocalDateTime.now().withMinute(0).withSecond(0).withNano(0);
        this.endTime=this.startTime.plusHours(1);
        this.batterySlots=new List();
        this.readTimeStamp=null;
        this.length=null;
        this.isConsolidable=false;
        }else{
            this.startTime=LocalDateTime.parse(msg.startTime);
            this.endTime=LocalDateTime.parse(msg.endTime);
            this.batterySlots=msg.batterySlots;
            this.readTimeStamp=msg.readTimeStamp;
            this.length=msg.length;
            this.isConsolidable=msg.isConsolidable;
        }
    }
    addBatterySlot(slot){
        var slotStart=LocalDateTime.parse(slot.readTimeStamp.toString());
        console.log(slotStart);

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
            let slotsInHour=(60*60*1000)/item.length;
            count+=item.producedInWatsH/slotsInHour;
        });
        return count;
    }
    getFeeded(){
        let count=0;
        this.batterySlots.forEach(function(item){
            let slotsInHour=(60*60*1000)/item.length;
            count+=item.feededInWatsH/slotsInHour;
        });
        return count;
    }
    getConsumed(){
        let count=0;
        this.batterySlots.forEach(function(item){
            let slotsInHour=(60*60*1000)/item.length;
            count+=item.consumedInWatsH/slotsInHour;
        });
        return count;
    }

    
    get(){
        return {
            balanceNetoHorario:{
            feeded:this.getFeeded(),
            consumed:this.getConsumed(),
            produced:this.getProduced(),
            startAt:this.startTime,
            endAt:this.endTime,
            isConsolidable:this.isConsolidable,
            batterySlots:this.batterySlots,
            length:this.batterySlots.length,
            startTime:this.startTime,
            endTime:this.endTime
            }
        }
    }

    isConsolidable(){
        return this.isConsolidable;
    }
    
    
}


module.exports = function(RED) {
    

    function VirtualBatteryBalanceNetoHorarioNode(config) {
        var balance=null;
        var lastResetWas=LocalDateTime.now();
        var resetTimeout=null;
        var node;
        var nodeContext;


        RED.nodes.createNode(this,config);
        node=this;
        nodeContext= this.context();
        resetTimeout=config.resetTimeout;
        node.log("INIT");
        balance=_readContext(nodeContext);

        this.on('close', function() {
            _writeContext(nodeContext,balance);
           });
        
        node.on('input',function(msg, send, done){
          node.log("Received Battery slot: "+msg);
          try{
          if(_isJson(msg.payload)){
            msg.payload=JSON.parse(msg.payload);
          }

          balance.addBatterySlot(msg.payload);
          _writeContext(nodeContext,balance);
          }catch(error){
            node.error(error,"Cannot add battery slot");
          }
          needsResetAndSend(balance,node,send,lastResetWas);
          node.status({fill:"green",shape:"dot",text:"SLOTS IN "+balance.batterySlots.length+"|"+balance.get().feeded+"|"+balance.get().produced});        
          done();
        });
    }    

function needsResetAndSend(balance,node,send,lastResetWas){
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

function _writeContext(nodeContext,balance){
    nodeContext.set("lastPayload",JSON.stringify(balance.get()));
    // this.startTime=LocalDateTime.now().withMinute(0).withSecond(0).withNano(0);
    // this.endTime=this.startTime.plusHours(1);
    // this.batterySlots=new List();
    // this.readTimeStamp=null;
    // this.length=null;
    // this.isConsolidable=false;

}

function _readContext(nodeContext){
    let lastPayload=nodeContext.get("lastPayload");
    if(lastPayload!==undefined){
        return balance=new BalanceNetoHorario(JSON.parse(lastPayload).balanceNetoHorario);
        // lastPayload.batterySlots.forEach(element=>{
        //     balance.addBatterySlot(element);
        // });

    }
    return new BalanceNetoHorario();

}

function _isJson(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}
    RED.nodes.registerType("virtual-battery-balance-neto-horario",VirtualBatteryBalanceNetoHorarioNode);
}