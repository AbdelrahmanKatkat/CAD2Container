import sys, collections, ezdxf
from ezdxf import recover
names = {1: 'C32 ISO20', 2: 'Encl 3512', 3: 'Encl 3516', 4: 'DropOver C27'}
for i in range(1, 5):
    try:
        doc, aud = recover.readfile(rf'{sys.argv[1]}\d{i}.dxf')
    except Exception as e:
        print(i, 'READ FAIL', e); continue
    msp = doc.modelspace()
    c = collections.Counter(e.dxftype() for e in msp)
    print(f'\n=== d{i} {names[i]} | ver={doc.dxfversion} | INSUNITS={doc.header.get("$INSUNITS")} | audit_errs={len(aud.errors)}')
    print(' modelspace entities:', sum(c.values()), dict(c.most_common(14)))
    print(' layouts:', [l.name for l in doc.layouts])
    for l in doc.layouts:
        if l.name != 'Model':
            print(f'   {l.name}: {len(l)} ents, viewports={len(l.query("VIEWPORT"))}')
    lay = collections.Counter(e.dxf.layer for e in msp)
    print(' layers used (top 12):', dict(lay.most_common(12)), '| total layers', len(doc.layers))
    blocks = [b for b in doc.blocks if not b.name.startswith('*')]
    ins = collections.Counter(e.dxf.name for e in msp.query('INSERT'))
    print(f' named blocks: {len(blocks)}; INSERTs in model: {sum(ins.values())}; top:', dict(ins.most_common(8)))
    dims = msp.query('DIMENSION')
    meas = []
    for d in dims:
        try: meas.append(round(d.get_measurement() if hasattr(d, 'get_measurement') else d.dxf.actual_measurement, 1))
        except Exception: pass
    print(f' DIMENSION: {len(dims)}; sample measurements:', sorted(set(meas))[:25], '...' if len(set(meas)) > 25 else '')
    txt = []
    for e in msp.query('TEXT MTEXT'):
        t = e.dxf.text if e.dxftype() == 'TEXT' else e.plain_text()
        t = ' '.join(t.split())
        if len(t) > 3: txt.append(t)
    print(f' TEXT/MTEXT: {len(txt)}; unique sample:', sorted(set(txt))[:30])
    s3 = c.get('3DSOLID', 0) + c.get('3DFACE', 0) + c.get('MESH', 0) + c.get('BODY', 0) + c.get('REGION', 0)
    print(' 3D entities (3DSOLID/3DFACE/MESH/BODY/REGION):', s3)
    xs, ys = [], []
    for e in msp.query('LINE'):
        xs += [e.dxf.start.x, e.dxf.end.x]; ys += [e.dxf.start.y, e.dxf.end.y]
    if xs: print(f' LINE extents: x[{min(xs):.0f},{max(xs):.0f}] y[{min(ys):.0f},{max(ys):.0f}]')
