# Node in wich you can configure balance-neto-horario
This node gives you a balance neto horario each time its updates with input battery-slot readings. 
This node expect the following input: 

|INPUT PAYLOAD | DESCRIPTION
|---------------|:------------:|
| readTimeStamp | TimeStamp of the adquired reading from the inverter, usually inverters send this field in the readings. ISO FORMATTED DATE STRING [2022-05-30T14:48:54].|
|length         | Battery slot lenght in ms. |
|producedInWatsH| Solar plant energy generation. Unit of measure: Wat per Hour|
|feededInWatsH  | Feeded energy to the main network, positive values means solar to main network feeding. Negative values means main network to home feeding. Unit of measure: Wat per Hour |
|consumedInWatsH| Consumed energy, formally the diference between producedInWatH and feededInWatsH. Unit of measure: Wat per Hour


You must activate nodered context persistence in disk, to recover from node stops with the latest values registered, for this balance-neto-horario node. To do this activate context-persistence in settings.js of your node-red install. Otherwise when the node is resseted, the data in this hour will be lossed and counters restart from zero. 
