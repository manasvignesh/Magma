export interface ClothingItem { id: string; name: string; img: string; color?: string; }

export const CLOTHING: Record<string, ClothingItem[]> = {
  topwear: [
    { id:'t1', name:'White Tee', img:'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&h=300&fit=crop', color:'#fff' },
    { id:'t2', name:'Black Tee', img:'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=300&h=300&fit=crop', color:'#222' },
    { id:'t3', name:'Beige Tee', img:'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=300&h=300&fit=crop', color:'#d4b896' },
    { id:'t4', name:'Black Polo', img:'https://images.unsplash.com/photo-1618354691229-88d47f285158?w=300&h=300&fit=crop', color:'#1a1a1a' },
    { id:'t5', name:'Green Hoodie', img:'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=300&h=300&fit=crop', color:'#4a7c59' },
    { id:'t6', name:'Gray Sweatshirt', img:'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=300&h=300&fit=crop', color:'#888' },
    { id:'t7', name:'Denim Jacket', img:'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=300&h=300&fit=crop', color:'#5b7daa' },
    { id:'t8', name:'Flannel Shirt', img:'https://images.unsplash.com/photo-1589310243389-96a5483213a8?w=300&h=300&fit=crop', color:'#8b4444' },
    { id:'t9', name:'Blue Shirt', img:'https://images.unsplash.com/photo-1598032895397-b9472444bf93?w=300&h=300&fit=crop', color:'#4a90d9' },
    { id:'t10', name:'Striped Tee', img:'https://images.unsplash.com/photo-1627225924765-552d49cf2b5d?w=300&h=300&fit=crop', color:'#ddd' },
  ],
  bottomwear: [
    { id:'b1', name:'Black Cargo', img:'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=300&h=300&fit=crop', color:'#222' },
    { id:'b2', name:'Blue Jeans', img:'https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?w=300&h=300&fit=crop', color:'#4a6fa5' },
    { id:'b3', name:'Khaki Chinos', img:'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=300&h=300&fit=crop', color:'#c4a97d' },
  ],
  footwear: [
    { id:'f1', name:'White Sneakers', img:'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=300&h=300&fit=crop', color:'#f5f5f5' },
    { id:'f2', name:'Black Boots', img:'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=300&h=300&fit=crop', color:'#1a1a1a' },
  ],
  cap: [
    { id:'c1', name:'Beige Cap', img:'https://images.unsplash.com/photo-1588850561407-ed78c334e67a?w=300&h=300&fit=crop', color:'#d4b896' },
    { id:'c2', name:'Black Cap', img:'https://images.unsplash.com/photo-1572307480813-ceb0e59d8325?w=300&h=300&fit=crop', color:'#222' },
  ],
  goggles: [
    { id:'g1', name:'Sunglasses', img:'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=300&h=300&fit=crop', color:'#333' },
    { id:'g2', name:'Classic Shades', img:'https://images.unsplash.com/photo-1511499767350-a1590fdb7ca7?w=300&h=300&fit=crop', color:'#5a3e28' },
  ],
};

export type CatKey = keyof typeof CLOTHING;

export const CATEGORIES = [
  { key: 'cap' as CatKey, label: 'Caps & Hats', icon: '🧢' },
  { key: 'goggles' as CatKey, label: 'Eyewear', icon: '🕶️' },
  { key: 'topwear' as CatKey, label: 'Tops', icon: '👕' },
  { key: 'bottomwear' as CatKey, label: 'Bottoms', icon: '👖' },
  { key: 'footwear' as CatKey, label: 'Footwear', icon: '👟' },
];

export interface BodyScales {
  torsoWidth: number;
  shoulderWidth: number;
  legLength: number;
  hipWidth: number;
  overall: number;
}

export function calcBodyScales(height: number, weight: number): BodyScales {
  const bmi = weight / Math.pow(height / 100, 2);
  const heightRatio = height / 175;
  let torsoWidth = 1, shoulderWidth = 1, hipWidth = 1;
  if (bmi < 18.5) { torsoWidth = 0.85; shoulderWidth = 0.88; hipWidth = 0.85; }
  else if (bmi < 25) { torsoWidth = 1; shoulderWidth = 1; hipWidth = 1; }
  else if (bmi < 30) { torsoWidth = 1.12; shoulderWidth = 1.1; hipWidth = 1.15; }
  else { torsoWidth = 1.25; shoulderWidth = 1.18; hipWidth = 1.28; }
  return { torsoWidth, shoulderWidth, legLength: 0.85 + heightRatio * 0.15, hipWidth, overall: 0.95 + heightRatio * 0.05 };
}

export const ZONE_CONFIG: Record<string, { label: string; top: string; left: string; width: string; height: string }> = {
  cap:        { label: 'Head', top: '0%',  left: '25%', width: '50%', height: '12%' },
  goggles:    { label: 'Eyes', top: '9%',  left: '28%', width: '44%', height: '6%' },
  topwear:    { label: 'Torso', top: '16%', left: '12%', width: '76%', height: '30%' },
  bottomwear: { label: 'Legs', top: '46%', left: '18%', width: '64%', height: '36%' },
  footwear:   { label: 'Feet', top: '82%', left: '22%', width: '56%', height: '14%' },
};

export const OVERLAY_POS: Record<string, { top: string; left: string; width: string; height: string; clip?: string }> = {
  cap:        { top: '0%',  left: '32%', width: '36%', height: '10%' },
  goggles:    { top: '6%', left: '35%', width: '30%', height: '5%' },
  topwear:    { top: '15.5%', left: '16%', width: '68%', height: '30%', clip: 'polygon(18% 0%, 82% 0%, 90% 100%, 10% 100%)' },
  bottomwear: { top: '44%', left: '24%', width: '52%', height: '36%', clip: 'polygon(0% 0%, 100% 0%, 90% 48%, 75% 100%, 60% 100%, 52% 48%, 48% 48%, 40% 100%, 25% 100%, 10% 48%)' },
  footwear:   { top: '82%', left: '28%', width: '44%', height: '12%' },
};
