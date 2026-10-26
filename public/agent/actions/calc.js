'use strict';

const CalcActions = [
  {
    name: 'calculate',
    description: '计算数学表达式，和页面同一解析器。^/** 为幂（右结合），% 为百分比，mod 为取余；sin/cos/tan、sqrt、log/log10、ln、abs、pi/e，角度默认 deg。拒绝非法语法和非有限结果。',
    meta: {tier:'standard',tags:['calculate','math','计算','数学','科学','expression'],category:'calc'},
    parameters: {type:'object',properties:{expression:{type:'string',maxLength:4096},angle:{type:'string',enum:['deg','rad'],default:'deg'}},required:['expression'],additionalProperties:false},
    async execute({expression,angle='deg'}) {
      try { const math=await window.ToolCompute.load('math'),result=math.evaluate(expression,{angle});return {success:true,data:{result,angle},display:expression+' = '+math.format(result)}; }
      catch(error){return {success:false,error:error.message};}
    },
  },
  {
    name:'unit_convert',
    description:'单位换算，与页面共用单位表和精度。类型 length/mass/temperature/area/volume/time/storage/speed；旧 weight/temp 仍可用。存储 B/kB/KB/MB/GB/TB 为 SI 1000，KiB/MiB/GiB/TiB 为 IEC 1024。可先 unit_list 查看单位 ID。',
    meta:{tier:'standard',tags:['unit','convert','length','weight','temperature','storage','speed','单位','存储','换算'],category:'calc'},
    parameters:{type:'object',properties:{value:{type:'number'},from:{type:'string'},to:{type:'string'},type:{type:'string',enum:['length','mass','weight','temperature','temp','area','volume','time','storage','speed']}},required:['value','from','to','type'],additionalProperties:false},
    async execute({value,from,to,type}){
      try{const result=(await window.ToolCompute.load('units')).convert(type,value,from,to);return {success:true,data:{result,unit:to},display:`${value} ${from} = ${result} ${to}`};}
      catch(error){return {success:false,error:error.message};}
    },
  },
  {
    name:'unit_list',description:'列出可用换算类别及单位 ID，供 unit_convert 选择。',
    meta:{tier:'standard',tags:['unit','units','单位','换算','storage'],category:'calc'},
    parameters:{type:'object',properties:{type:{type:'string',enum:['length','mass','temperature','area','volume','time','storage','speed']}},additionalProperties:false},
    async execute({type}={}){const {categories}=await window.ToolCompute.load('units');return {success:true,data:{categories:Object.fromEntries(Object.entries(categories).filter(([id,c])=>c.units&&(!type||id===type)).map(([id,c])=>[id,c.units.map(u=>({id:u[0],name:u[3]}))]))}};},
  },
  {
    name:'date_diff', description:'日历日期差：仅接受 YYYY-MM-DD。返回有符号 days、整月 months、完整 calendar 年/月/日间隔，以及包含首尾日期、只排除周末的 weekdays（不含节假日规则）。',
    meta:{tier:'standard',tags:['date','diff','days','calendar','日期','工作日'],category:'calc'},
    parameters:{type:'object',properties:{from:{type:'string',maxLength:10},to:{type:'string',maxLength:10}},required:['from','to'],additionalProperties:false},
    async execute({from,to}) {try{const data=(await ToolCompute.load('date')).diff(from,to);return {success:true,data,display:String(data.days)};}catch(e){return {success:false,error:e.message};}}
  },
  {
    name:'color_convert',description:'与页面共用严格颜色转换：HEX 3/4/6/8 位、RGB(A)、HSL(A)、HSV、CMYK。from 默认 auto；HEX/RGB/HSL 保留透明度，HSV/CMYK 的透明度单独返回 a。拒绝越界通道。',
    meta:{tier:'standard',tags:['color','hex','rgb','hsl','alpha','convert','颜色','透明度'],category:'calc'},
    parameters:{type:'object',properties:{input:{type:'string',maxLength:200},from:{type:'string',enum:['auto','hex','rgb','rgba','hsl','hsla','hsv','cmyk']},to:{type:'string',enum:['hex','rgb','rgba','hsl','hsla','hsv','cmyk']}},required:['input','to'],additionalProperties:false},
    async execute({input,from='auto',to}){try{const data=(await ToolCompute.load('color')).convert(input,{from,to});return {success:true,data,display:data.result};}catch(e){return {success:false,error:e.message};}}
  },
  {
    name:'ip_calc',description:'严格 IPv4 CIDR 子网计算，与页面共用。prefix 0–32，拒绝小数/尾缀/前导零。返回总地址 totalHosts、可用主机 usableHosts、掩码/范围/地址类别；/31 为点对点的两个地址，/32 为一个。',
    meta:{tier:'standard',tags:['ip','cidr','network','subnet','网络','子网'],category:'calc'},
    parameters:{type:'object',properties:{cidr:{type:'string',maxLength:40}},required:['cidr'],additionalProperties:false},
    async execute({cidr}){try{const data=(await ToolCompute.load('ip')).calculate(cidr);return {success:true,data,display:data.cidr};}catch(e){return {success:false,error:e.message};}}
  },
];
window.CalcActions = CalcActions;
