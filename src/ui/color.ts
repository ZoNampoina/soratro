/** Choose a readable label against the actual user-selected note fill. */
export function contrastInk(hex:string){
  const rgb=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
  return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722>.179?'#191322':'#ffffff';
}
