"""Compare the real browser PDF's text positions with its exported SVG.

Run from the repository root with pypdf and fontTools available.
"""
from pathlib import Path
import json
import lzma
import re
from xml.etree import ElementTree as ET

from fontTools.ttLib import TTFont
from pypdf import PdfReader

folder = Path(__file__).parent
pdf = PdfReader(folder / "cursor-centering.pdf")
svg = ET.fromstring(lzma.decompress((folder / "cursor-centering.svg.xz").read_bytes()))
height = float(svg.attrib["height"])
font = TTFont(folder.parents[1] / "src/assets/ScoreFont.ttf")
cmap = font.getBestCmap()
units = font["head"].unitsPerEm
expected = []
for text in svg.findall("{http://www.w3.org/2000/svg}text"):
    x, y = float(text.attrib["x"]), float(text.attrib["y"])
    size = float(text.attrib["font-size"])
    expected.append((x * .75, (height - y) * .75))
    for mark in text:
        if mark.tag.endswith("tspan"):
            advance = sum(font["hmtx"][cmap[ord(char)]][0] for char in (text.text or "")) / units * size
            expected.append(((x + advance) * .75, (height - y - float(mark.attrib["dy"])) * .75))
stream = pdf.pages[0].get_contents().get_data().decode("latin1")
actual = [tuple(map(float, match)) for match in re.findall(r"([-\d.]+) ([-\d.]+) Td", stream)]
assert len(actual) == len(expected), (len(actual), len(expected))
errors = [max(abs(a[0] - e[0]), abs(a[1] - e[1])) for a, e in zip(actual, expected)]
assert max(errors) < .001, max(errors)
result = {
    "pdfPages": len(pdf.pages),
    "svgFirstPageTextOperators": len(expected),
    "pdfFirstPageTextOperators": len(actual),
    "matchedTextCoordinatesIncludingOctaves": len(errors),
    "maxPositionErrorPoints": max(errors),
    "pdfCoordinatesEqualSvg": True,
    "tolerancePoints": .001,
}
(folder / "export-coordinates.json").write_text(json.dumps(result, indent=2) + "\n")
print(json.dumps(result, indent=2))
