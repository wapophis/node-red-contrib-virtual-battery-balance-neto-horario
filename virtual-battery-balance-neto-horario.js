const { LocalDate } = require("@js-joda/core");
const List = require("collections/list");
const LocalDateTime= require("@js-joda/core").LocalDateTime;
const NodeBalanceNetoHorario=require("./build/NodeBalanceNetoHorario.js");


/*class BalanceNetoHorario{
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
        
        if(slotStart.isBefore(this.startTime)){
            throw "Slot time is before than this slot start time";
        }
        if(slot.length===null){
            throw "Discarded slot, because no lenght defined";
        }

        if(slot.consumedInWatsH===undefined || isNaN(slot.consumedInWatsH)){
            throw "Error in slot data, consumedInWatsH undefined";
        }

        if(slot.feededInWatsH===undefined || isNaN(slot.feededInWatsH) ){
            throw "Error in slot data, feededInWatsH undefined";
        }

        if(slot.producedInWatsH===undefined || isNaN(slot.producedInWatsH) ){
            throw "Error in slot data, producedInWatsH undefined";
        }

        this.batterySlots.add(slot);
    }

    getProduced(){
        let count=0;
        this.batterySlots.forEach(function(item){
            let slotsInHour=(60*60*1000)/item.length;
            count+=item.producedInWatsH/slotsInHour;
            if(isNaN(count)){
                console.log(item);
            }
        });
        return count;
    }
    getFeeded(){
        let count=0;
        this.batterySlots.forEach(function(item){
            let slotsInHour=(60*60*1000)/item.length;
            count+=item.feededInWatsH/slotsInHour;
            if(isNaN(count)){
                console.log(item);
            }
        });
        return count;
    }
    getConsumed(){
        let count=0;
        this.batterySlots.forEach(function(item){
            let slotsInHour=(60*60*1000)/item.length;
            count+=item.consumedInWatsH/slotsInHour;
            if(isNaN(count)){
                console.log(item);
            }
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
*/

module.exports = function(RED) {
    

    function VirtualBatteryBalanceNetoHorarioNode(config) {
        
        var balance=null;
        //const reset={lastResetWas:LocalDateTime.now(),resetTimeout:null};
       
        var node;
        var nodeContext;

        RED.nodes.createNode(this,config);
        node=this;
        nodeContext= this.context();
        var nodeBalanceNetoHorario=new NodeBalanceNetoHorario.NodeBalanceNetoHorario(node,config);
        nodeBalanceNetoHorario.setNodeContext(nodeContext);

      //  reset.resetTimeout=config.resetTimeout;
        node.log("INIT");
      //  balance=_readContext(nodeContext);
        
        nodeBalanceNetoHorario.unSerialize();

        this.on('close', function() {
            nodeBalanceNetoHorario.serialize();
           });
        
        node.on('input',function(msg, send, done){
            nodeBalanceNetoHorario.onInput(msg,send,done);
         
        });
    }    

   /* function needsResetAndSend(balance,node,send,reset){
        var msg={payload:"empty"};
        msg.payload=balance.get().balanceNetoHorario;
       
        if(balance.endTime.isBefore(LocalDateTime.now()) || LocalDateTime.now().isAfter(reset.lastResetWas.plusSeconds(reset.resetTimeout/1000))){
            balance.endTime=LocalDateTime.now();
            balance.isConsolidable=true;
            msg.payload=balance.get().balanceNetoHorario;
            balance=new BalanceNetoHorario();
            reset.lastResetWas=LocalDateTime.now();
        }
        
        node.log("Sending:"+JSON.stringify(msg));
        send(msg);
    
        return balance;
    }*/

/*function _writeContext(nodeContext,balance){
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

}*/

/*function _isJson(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}*/
    RED.nodes.registerType("virtual-battery-balance-neto-horario",VirtualBatteryBalanceNetoHorarioNode);
}