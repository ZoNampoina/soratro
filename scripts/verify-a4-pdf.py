"""Compare real PDF/SVG operators with the shared score document. Requires pypdf."""
import json
import math
import sys
import xml.etree.ElementTree as ET
from pathlib import Path
from pypdf import PdfReader
from pypdf.generic import ContentStream

folder = Path(sys.argv[1] if len(sys.argv) > 1 else 'tmp/a4-export')
reports = []
for orientation in ('portrait', 'landscape'):
    doc = json.loads((folder / f'{orientation}.json').read_text())
    pdf = PdfReader(folder / f'{orientation}.pdf')
    assert len(pdf.pages) == len(doc['pages'])
    checked_text = checked_vectors = 0
    max_error = 0
    for page, expected in zip(pdf.pages, doc['pages']):
        assert abs(float(page.mediabox.width) - expected['widthMm'] * 72 / 25.4) < .001
        assert abs(float(page.mediabox.height) - expected['heightMm'] * 72 / 25.4) < .001
        text, moves, curves = [], [], []
        for args, op in ContentStream(page['/Contents'], pdf).operations:
            if op == b'BT':
                x = y = 0
            elif op == b'Tf':
                size = float(args[1])
            elif op == b'Td':
                x += float(args[0])
                y += float(args[1])
            elif op == b'Tj':
                text.append((x, y, size))
            elif op == b'm':
                moves.append(tuple(map(float, args)))
            elif op == b'c':
                curves.append(tuple(map(float, args)))
        base_text = [o for o in expected['ops'] if o['kind'] == 'text']
        assert len(text) == sum(1 + bool(o.get('octave')) for o in base_text)
        at = 0
        for op in base_text:
            want = (op['x'] * .75, (expected['height'] - op['y']) * .75, op['size'] * .75)
            error = max(abs(a-b) for a, b in zip(text[at], want))
            assert error < .0002, (text[at], want)
            max_error = max(max_error, error)
            checked_text += 1
            at += 1 + bool(op.get('octave'))
        for op in (o for o in expected['ops'] if o.get('role') == 'rhythm'):
            if op['kind'] == 'circle':
                want = ((op['x'] + op['radius']) * .75, (expected['height'] - op['y']) * .75)
                assert any(math.dist(want, point) < .0003 for point in moves)
                checked_vectors += 1
            elif op['kind'] == 'curve':
                want = tuple(v for x, y in ((op['cx1'], op['cy1']), (op['cx2'], op['cy2']), (op['x2'], op['y2'])) for v in (x * .75, (expected['height']-y) * .75))
                assert any(max(abs(a-b) for a, b in zip(want, c)) < .0002 for c in curves)
                checked_vectors += 1
    svg = ET.parse(folder / f'{orientation}.svg').getroot()
    nodes = svg.findall('{http://www.w3.org/2000/svg}text')
    first = [o for o in doc['pages'][0]['ops'] if o['kind'] == 'text']
    assert len(nodes) == len(first)
    for node, op in zip(nodes, first):
        for key in ('x', 'y'):
            assert abs(float(node.attrib[key]) - op[key]) <= .00051
        assert float(node.attrib['font-size']) == op['size']
    reports.append({'orientation': orientation, 'pages': len(pdf.pages), 'textOperatorsChecked': checked_text, 'punctuationVectorsChecked': checked_vectors, 'maximumPdfCoordinateErrorPt': round(max_error, 7), 'svgMatchesDocument': True})
(folder / 'coordinates.json').write_text(json.dumps(reports, indent=2)+'\n')
print(json.dumps(reports, indent=2))
