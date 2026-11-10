import { useEffect, useMemo, useState } from 'react';
import { ArrowDownUp, Calculator as CalculatorIcon, ChevronDown } from 'lucide-react';

type Tab = 'calc' | 'currency';
const currencies = [
  ['KES','Kenyan Shilling'],['USD','US Dollar'],['EUR','Euro'],['GBP','British Pound'],
  ['JPY','Japanese Yen'],['CNY','Chinese Yuan'],['INR','Indian Rupee'],['UGX','Ugandan Shilling'],
  ['TZS','Tanzanian Shilling'],['ZAR','South African Rand'],['AED','UAE Dirham'],
  ['CAD','Canadian Dollar'],['AUD','Australian Dollar'],['CHF','Swiss Franc'],
  ['NGN','Nigerian Naira'],['GHS','Ghanaian Cedi'],['RWF','Rwandan Franc'],
  ['SAR','Saudi Riyal'],['SGD','Singapore Dollar'],['HKD','Hong Kong Dollar'],
  ['KRW','South Korean Won'],['SEK','Swedish Krona'],['NOK','Norwegian Krone'],
  ['BRL','Brazilian Real'],['MXN','Mexican Peso'],['EGP','Egyptian Pound']
] as const;
const fmt = (n:number) => new Intl.NumberFormat('en',{maximumFractionDigits:8}).format(n);
const clean = (n:number) => Number.isFinite(n) ? String(Number(n.toPrecision(11))) : '0';
const calc = (a:number,b:number,op:string) => op==='+'?a+b:op==='−'?a-b:op==='×'?a*b:op==='÷'?(b===0?0:a/b):b;

function Calculator() {
 const [value,setValue]=useState('0'),[saved,setSaved]=useState<number|null>(null),[op,setOp]=useState<string|null>(null),[fresh,setFresh]=useState(true),[line,setLine]=useState('');
 const press=(k:string)=>{
  if(/^\d$/.test(k)){setValue(v=>fresh||v==='0'?k:v.length<14?v+k:v);setFresh(false);return;}
  if(k==='.') {if(fresh){setValue('0.');setFresh(false);}else if(!value.includes('.'))setValue(value+'.');return;}
  if(k==='AC'){setValue('0');setSaved(null);setOp(null);setLine('');setFresh(true);return;}
  if(k==='⌫'){setValue(value.length>1?value.slice(0,-1):'0');setFresh(false);return;}
  if(k==='±'){setValue(String(-Number(value)));setFresh(false);return;}
  if(k==='%'){setValue(String(Number(value)/100));setFresh(false);return;}
  if(['+','−','×','÷'].includes(k)){
   const v=Number(value);
   if(saved!==null&&op&&!fresh){const r=calc(saved,v,op);setValue(clean(r));setSaved(r);setLine(clean(r)+' '+k);}
   else{setSaved(v);setLine(value+' '+k);}
   setOp(k);setFresh(true);return;
  }
  if(k==='='&&saved!==null&&op){const r=calc(saved,Number(value),op);setLine(saved+' '+op+' '+value+' =');setValue(clean(r));setSaved(null);setOp(null);setFresh(true);}
 };
 const keys=[['AC','soft'],['±','soft'],['%','soft'],['÷','operator'],['7',''],['8',''],['9',''],['×','operator'],['4',''],['5',''],['6',''],['−','operator'],['1',''],['2',''],['3',''],['+','operator'],['⌫','soft'],['0',''],['.',''],['=','equals']];
 return <section className="calculator-panel" aria-label="Calculator">
  <div className="display-panel"><div className="expression">{line||' '}</div><div className="main-display">{fmt(Number(value))}</div></div>
  <div className="keypad">{keys.map(([k,kind])=><button key={k} type="button" className={`calc-key ${kind}`} onClick={()=>press(k)} aria-label={k==='⌫'?'Delete last digit':k}>{k}</button>)}</div>
 </section>;
}

function Currency(){
 const [amount,setAmount]=useState('1'),[from,setFrom]=useState('USD'),[to,setTo]=useState('KES');
 const [rates,setRates]=useState<Record<string,number>|null>(null),[updated,setUpdated]=useState(''),[loading,setLoading]=useState(true),[error,setError]=useState('');
 useEffect(()=>{let live=true;setLoading(true);setError('');
  fetch(`https://open.er-api.com/v6/latest/${from}`).then(r=>{if(!r.ok)throw Error();return r.json();}).then(d=>{if(d.result!=='success')throw Error();if(live){setRates(d.rates);setUpdated(d.time_last_update_utc||'');}}).catch(()=>{if(live)setError('Live rates could not be loaded. Check your connection and try again.');}).finally(()=>{if(live)setLoading(false);});
  return()=>{live=false;};
 },[from]);
 const result=useMemo(()=>{const rate=rates?.[to],n=Number(amount);return Number.isFinite(n)&&rate?n*rate:null;},[amount,rates,to]);
 const fromName=currencies.find(c=>c[0]===from)?.[1]||from,toName=currencies.find(c=>c[0]===to)?.[1]||to;
 return <section className="currency-panel" aria-label="Currency converter">
  <div className="currency-intro"><div className="currency-icon"><ArrowDownUp size={22}/></div><div><h2>Currency converter</h2><p>Convert using the latest available exchange rates.</p></div></div>
  <div className="currency-field"><label htmlFor="amount">Amount</label><input id="amount" type="number" inputMode="decimal" min="0" value={amount} onChange={e=>setAmount(e.target.value)}/></div>
  <div className="currency-select-wrap">
   <div className="currency-field"><label htmlFor="from">From</label><div className="select-shell"><select id="from" value={from} onChange={e=>setFrom(e.target.value)}>{currencies.map(([code,name])=><option key={code} value={code}>{code} — {name}</option>)}</select><ChevronDown size={17}/></div><span className="currency-name">{fromName}</span></div>
   <button className="swap-button" type="button" aria-label="Swap currencies" onClick={()=>{setFrom(to);setTo(from);}}><ArrowDownUp size={20}/></button>
   <div className="currency-field"><label htmlFor="to">To</label><div className="select-shell"><select id="to" value={to} onChange={e=>setTo(e.target.value)}>{currencies.map(([code,name])=><option key={code} value={code}>{code} — {name}</option>)}</select><ChevronDown size={17}/></div><span className="currency-name">{toName}</span></div>
  </div>
  <div className="conversion-result" aria-live="polite"><span className="result-label">Converted amount</span>{loading?<div className="result-value">Loading rates…</div>:result!==null?<div className="result-value">{fmt(result)} <span>{to}</span></div>:<div className="result-value">—</div>}{error?<p className="rate-error">{error}</p>:<p className="rate-note">{updated?'Rate updated: '+updated:'Rates provided by ExchangeRate-API'}</p>}</div>
  <p className="currency-footnote">Exchange rates are indicative and may differ from rates offered by banks or money transfer services.</p>
 </section>;
}

export default function App(){
 const [tab,setTab]=useState<Tab>('calc');
 return <main className="app-shell">
  <header className="page-header"><div className="heading-mark"><CalculatorIcon size={21}/></div><h1>My Calculator</h1></header>
  <div className="page-content">{tab==='calc'?<Calculator/>:<Currency/>}</div>
  <nav className="bottom-nav" aria-label="Main navigation">
   <button type="button" className={tab==='calc'?'nav-item active':'nav-item'} onClick={()=>setTab('calc')} aria-current={tab==='calc'?'page':undefined}><CalculatorIcon size={20}/><span>Calc</span></button>
   <button type="button" className={tab==='currency'?'nav-item active':'nav-item'} onClick={()=>setTab('currency')} aria-current={tab==='currency'?'page':undefined}><ArrowDownUp size={20}/><span>Currency</span></button>
  </nav>
 </main>;
}