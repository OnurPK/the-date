import os,sys,numpy as np
from PIL import Image
SRC='/tmp/fr'; OUTROOT='/sessions/exciting-relaxed-maxwell/mnt/roles-ai/worlds/pride-and-prejudice/characters/'
W,H=720,1280; FEET_Y=1186; TOP_Y=89; N=48
def load(cid,i): return np.array(Image.open('%s/%s/%03d.png'%(SRC,cid,i)).convert('RGB')).astype(np.float32)
def key(a):
    r,g,b=a[:,:,0],a[:,:,1],a[:,:,2]
    d=g-np.maximum(r,b)                       # greenness
    alpha=1-np.clip((d-8)/(60-8),0,1)         # d<=8 opaque, d>=60 transparent
    # despill: pull green down to max(r,b) where it dominates
    m=np.maximum(r,b); gg=np.where(g>m, m+ (g-m)*0.15, g)
    rgb=np.stack([r,gg,b],2)
    return rgb,alpha
def metrics(cid,n):
    out=[]
    for i in range(1,n+1):
        a=load(cid,i); rgb,al=key(a); m=al>0.5; ys,xs=np.where(m)
        hy=ys.min()+int((ys.max()-ys.min())*0.12); hr=a[ys.min():hy]; hm=m[ys.min():hy]
        skin=((hr[:,:,0]>150)&(hr[:,:,0]>hr[:,:,1]+15)&(hr[:,:,1]>hr[:,:,2])&(hr[:,:,0]-hr[:,:,2]>40)&hm).sum()
        out.append((xs.max()-xs.min(), skin))
    return np.array(out,dtype=float)
def keys_from(cid,n,manual=None):
    if manual: return manual
    m=metrics(cid,n); w=m[:,0]; s=m[:,1]
    # smooth
    k=np.ones(5)/5; ws=np.convolve(w,k,'same'); ss=np.convolve(s,k,'same')
    back=int(np.argmin(ss[10:n-10]))+10
    p1=int(np.argmin(ws[5:back]))+5
    p2=int(np.argmin(ws[back:n-5]))+back
    w0=ws[2]
    half=(p2-p1)/2.0; start=max(0,p1-half); end=min(n-1,p2+half)
    return [(start,0),(p1,90),(back,180),(p2,270),(end,360)]
def frame_at(keys,angle):
    for (f0,a0),(f1,a1) in zip(keys,keys[1:]):
        if a0<=angle<=a1: return f0+(f1-f0)*(angle-a0)/(a1-a0)
    return keys[-1][0]
def build(cid,n,manual=None,reverse=True):
    keys=keys_from(cid,n,manual); print(cid,'keys',keys)
    od=OUTROOT+cid+'/turntable'; os.makedirs(od,exist_ok=True)
    ref=None
    for k in range(N):
        ang=k*360/N; ca=(360-ang)%360 if reverse else ang
        fi=int(round(frame_at(keys,ca)))+1
        a=load(cid,fi); rgb,al=key(a)
        m=al>0.5; ys,xs=np.where(m); y0,y1,x0,x1=ys.min(),ys.max(),xs.min(),xs.max()
        if ref is None: ref=(y1-y0)
        # constant scale (locked camera) with the head top pinned: the AI clip shortens the legs at the back view,
        # so per-frame height normalisation would make the head bob — keep the head level, let the feet float a little
        sc=(FEET_Y-TOP_Y)/ref
        # premultiplied resize
        pm=np.concatenate([rgb*al[:,:,None],al[:,:,None]*255],2)
        crop=pm[y0:y1+1,x0:x1+1]
        nh=int(round(crop.shape[0]*sc)); nw=int(round(crop.shape[1]*sc))
        im=Image.fromarray(np.clip(crop,0,255).astype(np.uint8),'RGBA').resize((nw,nh),Image.LANCZOS)
        r=np.array(im).astype(np.float32); ra=r[:,:,3:4]/255
        un=np.where(ra>0, r[:,:,:3]/np.maximum(ra,1e-3), 0)
        out=np.zeros((H,W,4),np.float32)
        oy=TOP_Y; ox=(W-nw)//2
        # clip if out of bounds
        sy0=max(0,-oy); sx0=max(0,-ox); oy=max(0,oy); ox=max(0,ox)
        hh=min(nh-sy0,H-oy); ww=min(nw-sx0,W-ox)
        out[oy:oy+hh,ox:ox+ww,:3]=un[sy0:sy0+hh,sx0:sx0+ww]; out[oy:oy+hh,ox:ox+ww,3]=r[sy0:sy0+hh,sx0:sx0+ww,3]
        Image.fromarray(np.clip(out,0,255).astype(np.uint8),'RGBA').save('%s/f%02d.webp'%(od,k),quality=90,method=4)
    return keys
if __name__=='__main__':
    cid=sys.argv[1]; n=int(sys.argv[2]); manual=eval(sys.argv[3]) if len(sys.argv)>3 else None
    build(cid,n,manual)
