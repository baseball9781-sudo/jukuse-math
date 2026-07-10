// Three.js 最小スタブ: ビルダーを1フレーム走らせてランタイムエラーを検出する用
// 未実装APIを踏んだら例外を投げる(=バグ検出)。座標を保持しget系は実値を返す。
class V2 { constructor(x=0,y=0){this.x=x;this.y=y;} }
class V3 {
  constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z;}
  set(x,y,z){this.x=x;this.y=y;this.z=z;return this;}
  copy(v){this.x=v.x;this.y=v.y;this.z=v.z;return this;}
  clone(){return new V3(this.x,this.y,this.z);}
  add(v){this.x+=v.x;this.y+=v.y;this.z+=v.z;return this;}
  sub(v){this.x-=v.x;this.y-=v.y;this.z-=v.z;return this;}
  multiplyScalar(s){this.x*=s;this.y*=s;this.z*=s;return this;}
  setScalar(v){this.x=v;this.y=v;this.z=v;return this;}
  setFromUnitVectors(a,b){return this;}
}
class Color {
  constructor(c){this.c=c;}
  copy(o){this.c=o.c;return this;}
  lerp(o,t){return this;}
  set(c){this.c=c;return this;}
}
class Euler { constructor(){this.x=0;this.y=0;this.z=0;} }
class Quat { setFromUnitVectors(){return this;} }

class Attr {
  constructor(arr,item){ this.array = arr instanceof Float32Array ? arr : new Float32Array(arr); this.itemSize=item; this.count=this.array.length/item; this.needsUpdate=false; }
  setXYZ(i,x,y,z){ const o=i*this.itemSize; this.array[o]=x; this.array[o+1]=y; this.array[o+2]=z; return this; }
  setX(i,x){ this.array[i*this.itemSize]=x; }
  setY(i,y){ this.array[i*this.itemSize+1]=y; }
  setZ(i,z){ this.array[i*this.itemSize+2]=z; }
  getX(i){ return this.array[i*this.itemSize]; }
  getY(i){ return this.array[i*this.itemSize+1]; }
  getZ(i){ return this.array[i*this.itemSize+2]; }
}
class Geo {
  constructor(){ this.attributes={}; this.index=null; }
  setAttribute(n,a){ this.attributes[n]=a; return this; }
  getAttribute(n){ return this.attributes[n]; }
  setIndex(i){ this.index=i; return this; }
  setFromPoints(pts){ const a=new Float32Array(pts.length*3); pts.forEach((p,i)=>{a[i*3]=p.x;a[i*3+1]=p.y;a[i*3+2]=p.z;}); this.attributes.position=new Attr(a,3); return this; }
  computeVertexNormals(){}
  computeLineDistances(){}
  dispose(){}
}
const BufferGeometry=Geo;
class BoxGeometry extends Geo {}
class CircleGeometry extends Geo {}
class SphereGeometry extends Geo {}
class EdgesGeometry extends Geo {}
class LatheGeometry extends Geo { constructor(pts,seg,ps,pl){ super(); if(!Array.isArray(pts)) throw new Error("LatheGeometry needs points array"); } }
class PlaneGeometry extends Geo {}

class Obj3 {
  constructor(){ this.children=[]; this.position=new V3(); this.rotation=new Euler(); this.quaternion=new Quat(); this.scale=new V3(1,1,1); this.visible=true; this.userData={}; }
  add(...o){ this.children.push(...o); return this; }
  traverse(fn){ fn(this); this.children.forEach(c=>c.traverse&&c.traverse(fn)); }
}
class Scene extends Obj3 {}
class Group extends Obj3 {}
class Mesh extends Obj3 { constructor(g,m){ super(); this.geometry=g; this.material=m; } }
class Line extends Obj3 { constructor(g,m){ super(); this.geometry=g; this.material=m; } computeLineDistances(){ return this; } }
class LineSegments extends Line {}
class Sprite extends Obj3 { constructor(m){ super(); this.material=m; } }
class GridHelper extends Obj3 { constructor(){ super(); } }
class Light extends Obj3 {}

class Mat {
  constructor(o={}){ Object.assign(this,o); if(this.opacity===undefined) this.opacity=1; this.color=this.color!==undefined?new Color(this.color):new Color(0); this.needsUpdate=false; }
  clone(){ return new Mat({ ...this, color: this.color.c }); }
  dispose(){}
}
class CanvasTexture { constructor(){ this.minFilter=null; } dispose(){} }
class Cam extends Obj3 { constructor(){ super(); this.aspect=1; } updateProjectionMatrix(){} lookAt(){} }

const THREE = {
  Scene, Group, Mesh, Line, LineSegments, Sprite, GridHelper,
  BufferGeometry, BufferAttribute:Attr, Float32BufferAttribute:Attr,
  BoxGeometry, CircleGeometry, SphereGeometry, EdgesGeometry, LatheGeometry, PlaneGeometry,
  Vector2:V2, Vector3:V3, Color, Quaternion:Quat,
  MeshStandardMaterial:Mat, MeshBasicMaterial:Mat, MeshLambertMaterial:Mat,
  LineBasicMaterial:Mat, LineDashedMaterial:Mat, SpriteMaterial:Mat,
  CanvasTexture,
  AmbientLight:Light, DirectionalLight:Light,
  PerspectiveCamera:Cam,
  WebGLRenderer: class { setPixelRatio(){} setClearColor(){} setSize(){} render(){} get domElement(){return {};} },
  BackSide:2, DoubleSide:2, LinearFilter:1006,
};
module.exports = { THREE };
