"""Extract a verified inventory from a DXF (converted from DWG) into JSON + render PNG.
Usage: python -I tools/extract.py <in.dxf> <out_dir> <tag>
All values are copied from entities with their handle (Verified). Nothing is inferred here.
"""
import sys, json, re, collections
import ezdxf
from ezdxf import recover
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.collections import LineCollection

KEYWORDS = ["single door", "double door", "door", "ladder", "ladd", "louver", "louvre", "cable",
            "drain", "alarm", "sand trap", "sand", "motoriz", "floor", "entry", "access"]


def clean(t):
    t = re.sub(r"\\[A-Za-z][^;]*;", "", t or "")
    return " ".join(t.replace("\\P", " ").replace("{", "").replace("}", "").split())


def main(path, out, tag):
    doc, aud = recover.readfile(path)
    msp = doc.modelspace()
    res = {"tag": tag, "insunits": doc.header.get("$INSUNITS"), "dims": [], "texts": [], "mleaders": [],
           "circles": [], "inserts": [], "block_text": {}}
    for d in msp.query("DIMENSION"):
        try:
            m = round(d.get_measurement(), 2)
        except Exception:
            m = None
        p = d.dxf.defpoint
        res["dims"].append({"handle": d.dxf.handle, "layer": d.dxf.layer, "measure": m,
                            "override": d.dxf.get("text", ""), "x": round(p.x, 1), "y": round(p.y, 1),
                            "block": d.dxf.get("geometry", "")})
    for e in msp.query("TEXT MTEXT"):
        t = clean(e.dxf.text if e.dxftype() == "TEXT" else e.plain_text())
        if t:
            ip = e.dxf.insert
            res["texts"].append({"handle": e.dxf.handle, "layer": e.dxf.layer, "text": t,
                                 "x": round(ip.x, 1), "y": round(ip.y, 1)})
    for e in msp.query("MULTILEADER"):
        try:
            t = clean(e.get_mtext_content())
        except Exception:
            t = ""
        pt = e.context.mtext.insert if getattr(e.context, "mtext", None) else None
        res["mleaders"].append({"handle": e.dxf.handle, "text": t,
                                "x": round(pt.x, 1) if pt else None, "y": round(pt.y, 1) if pt else None})
    for e in msp.query("CIRCLE"):
        res["circles"].append({"handle": e.dxf.handle, "layer": e.dxf.layer, "r": round(e.dxf.radius, 2),
                               "x": round(e.dxf.center.x, 1), "y": round(e.dxf.center.y, 1)})
    for e in msp.query("INSERT"):
        res["inserts"].append({"handle": e.dxf.handle, "name": e.dxf.name, "layer": e.dxf.layer,
                               "x": round(e.dxf.insert.x, 1), "y": round(e.dxf.insert.y, 1),
                               "sx": e.dxf.get("xscale", 1), "rot": e.dxf.get("rotation", 0)})
    for b in doc.blocks:
        ts = [clean(e.dxf.text if e.dxftype() == "TEXT" else e.plain_text()) for e in b.query("TEXT MTEXT")]
        ts = [t for t in ts if t]
        if ts:
            res["block_text"][b.name] = ts[:10]
    allt = [(t["text"], t["handle"], t["x"], t["y"]) for t in res["texts"]] + \
           [(t["text"], t["handle"], t["x"], t["y"]) for t in res["mleaders"] if t["text"]]
    hits = collections.defaultdict(list)
    for txt, h, x, y in allt:
        for k in KEYWORDS:
            if k in txt.lower():
                hits[k].append({"text": txt, "handle": h, "x": x, "y": y})
    res["keyword_hits"] = hits
    with open(f"{out}/{tag}.json", "w", encoding="utf-8") as fh:
        json.dump(res, fh, indent=1, ensure_ascii=False)

    # render model space lines/arcs/polylines/circles
    segs = []
    for e in msp.query("LINE"):
        segs.append([(e.dxf.start.x, e.dxf.start.y), (e.dxf.end.x, e.dxf.end.y)])
    for e in msp.query("LWPOLYLINE"):
        pts = [(p[0], p[1]) for p in e.get_points()]
        if e.closed and pts:
            pts.append(pts[0])
        segs.append(pts)
    for e in msp.query("ARC CIRCLE ELLIPSE SPLINE"):
        try:
            v = [(p.x, p.y) for p in e.flattening(5)] if e.dxftype() != "SPLINE" else [(p.x, p.y) for p in e.flattening(5)]
            segs.append(v)
        except Exception:
            pass
    fig = plt.figure(figsize=(26, 16), dpi=110)
    ax = fig.add_axes([0, 0, 1, 1])
    ax.add_collection(LineCollection(segs, linewidths=0.35, colors="k"))
    for t in res["texts"][:400]:
        ax.text(t["x"], t["y"], t["text"][:30], fontsize=5, color="b")
    ax.autoscale()
    ax.set_aspect("equal")
    ax.axis("off")
    fig.savefig(f"{out}/{tag}_model.png")
    print(tag, "dims", len(res["dims"]), "texts", len(res["texts"]), "mleaders", len(res["mleaders"]),
          "hits", {k: len(v) for k, v in hits.items()})


if __name__ == "__main__":
    main(*sys.argv[1:4])
