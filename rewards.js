// Shared credit-card reward rules (2026 Q4). Used by card-rewards.html and ledger.html.
// All amounts are NT$. Caps are shared across categories within one card.
const CATS = [
  {id:'g', name:'一般購物', sub:'百貨／服飾／紀念品（非指定店）', def:20000},
  {id:'d', name:'藥妝・家電', sub:'指定通路', def:15000},
  {id:'f', name:'餐飲', sub:'玉山指定店', def:10000},
  {id:'t', name:'交通卡儲值', sub:'Suica／ICOCA，用 Apple Pay', def:3000},
];
const CARDS = [
  {id:'ctbc', name:'中信 uniopen', short:'中信'},
  {id:'esun', name:'玉山 熊本熊', short:'玉山'},
  {id:'fubon', name:'富邦 J卡', short:'富邦 J'},
];
const emptySpend = () => ({g:0, d:0, f:0, t:0});

// Net reward (after overseas fee) for one card given NT$ spent on it per category.
function calc(card, a){
  const S = a.g + a.d + a.f + a.t;
  if (card === 'ctbc'){
    const bonus = Math.min(S*0.08, 500);
    return {net: S*0.03 + bonus - S*0.015, caps:[{label:'8% 加碼', used:bonus, max:500, spend:S, capSpend:6250}]};
  }
  if (card === 'esun'){
    const el = a.d + a.f + a.t, bonus = Math.min(el*0.06, 500);
    return {net: S*0.025 + bonus - S*0.015, caps:[{label:'6% 加碼', used:bonus, max:500, spend:el, capSpend:8333}]};
  }
  if (card === 'fubon'){
    const phys = a.g + a.d + a.f;
    const b1 = Math.min(phys*0.03, 1000), b2 = Math.min(a.t*0.07, 200);
    return {net: phys*0.03 + b1 + a.t*0.03 + b2, caps:[
      {label:'實體 3% 加碼', used:b1, max:1000, spend:phys, capSpend:33333},
      {label:'交通卡 7% 加碼', used:b2, max:200, spend:a.t, capSpend:2857}]};
  }
  return {net:0, caps:[]};
}

// Extra net reward if `ntd` more is spent on `cat` with `card`, given what each card already has.
function marginal(perCard, card, cat, ntd){
  const before = perCard[card] || emptySpend();
  const after = {...before, [cat]: before[cat] + ntd};
  return calc(card, after).net - calc(card, before).net;
}
