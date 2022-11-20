import { ChronoField, ChronoUnit, LocalDateTime } from "@js-joda/core";
import { BalanceNetoHorario} from "@virtualbat/entities/dist/src/BalanceNetoHorario.js";
import { BatterySlot } from "@virtualbat/entities/dist/src/BatterySlot.js";


export class NodeBalanceNetoHorario{
    node:any=null;
    nodeContext:any=null;
    balance:BalanceNetoHorario|null=null;

    reset={lastResetWas:LocalDateTime.now(),resetTimeout:null};

    constructor(node:any,config:any){
        this.node=node;
        this.reset.resetTimeout=config.resetTimeout;
    }

    setNodeContext(nodeContext:any){
        this.nodeContext=nodeContext;
    }

    onInput(msg:any,send:any,done:any){
        this.node.log("Received Battery slot: "+msg);
        try{
        /*if(_isJson(msg.payload)){
          msg.payload=JSON.parse(msg.payload);
        }*/

        this.balance?.addBatterySlot(new BatterySlot(msg.payload));
        this.serialize();
        }catch(error){
          this.node.log(error);
          this.node.error(error,"Cannot add battery slot");
        }
        this.balance=this.needsResetAndSend(send);
        let debugmsg=this.balance?.get();
        this.node.status({fill:"green",shape:"dot",text:"SLOTS IN "+this.balance?.batterySlots.length+"|"+debugmsg?.balanceNetoHorario.feeded+"|"+debugmsg?.balanceNetoHorario.produced});        
        done();
    }

    serialize(){
        this.nodeContext.set("lastPayload",JSON.stringify(this.balance?.get()));
        // this.startTime=LocalDateTime.now().withMinute(0).withSecond(0).withNano(0);
        // this.endTime=this.startTime.plusHours(1);
        // this.batterySlots=new List();
        // this.readTimeStamp=null;
        // this.length=null;
        // this.isConsolidable=false;
    
    }
    
    unSerialize(){
        let lastPayload=this.nodeContext.get("lastPayload");
        if(lastPayload!==undefined){
            this.balance=new BalanceNetoHorario(JSON.parse(lastPayload).balanceNetoHorario);
            if(LocalDateTime.parse(this.balance.startTime.toString()).until(LocalDateTime.now(),ChronoUnit.MINUTES)>60){
                this.balance=new BalanceNetoHorario(undefined);
            }
            // lastPayload.batterySlots.forEach(element=>{
            //     balance.addBatterySlot(element);
            // });
    
        }
        return this.balance;
    }


    needsResetAndSend(send:any){
        var msg:any={payload:"empty"};
        msg.payload=this.balance?.get().balanceNetoHorario;
        if(this.balance!==null){
        if(LocalDateTime.parse(this.balance?.endTime.toString()).isBefore(LocalDateTime.now()) || LocalDateTime.now().isAfter(this.reset.lastResetWas.plusSeconds(this.reset.resetTimeout!==null?this.reset.resetTimeout/1000:0))){
           
                this.balance.endTime=LocalDateTime.now();
                this.balance.consolidable=true;
                msg.payload=this.balance.get().balanceNetoHorario;
                this.balance=new BalanceNetoHorario(undefined);
            
            this.reset.lastResetWas=LocalDateTime.now();
        }
                
        this.node.log("Sending:"+JSON.stringify(msg));
        send(msg);
    
        }

        return this.balance;
    }
}