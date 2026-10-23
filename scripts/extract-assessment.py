"""Extract assessment behavior from original OOXML, without changing the workbook.

No Excel formula is executed as code. The 59 guidance formulas use a deliberately
small IF/equality/string grammar. Shared score formulas are inspected structurally.
"""
from pathlib import Path
import hashlib
import json
import re
import zipfile
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "source/CoSN-K-12CVAT-Lite-V4.1-2.xlsx"
NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"


def column_number(name):
    value = 0
    for char in name:
        value = value * 26 + ord(char) - 64
    return value


def column_name(number):
    result = ""
    while number:
        number, remainder = divmod(number - 1, 26)
        result = chr(65 + remainder) + result
    return result


def translate_shared(formula, anchor, destination):
    """Translate relative A1 references, preserving absolute refs and quoted text.

    This resolves source shared followers for inspection, not formula execution.
    The source uses ordinary A1 refs; structured references are not introduced.
    """
    a = re.fullmatch(r"([A-Z]+)(\d+)", anchor)
    d = re.fullmatch(r"([A-Z]+)(\d+)", destination)
    dc, dr = column_number(d[1]) - column_number(a[1]), int(d[2]) - int(a[2])

    def reference(match):
        absolute_column, name, absolute_row, row = match.groups()
        col = column_number(name) + (0 if absolute_column else dc)
        row = int(row) + (0 if absolute_row else dr)
        if col < 1 or row < 1:
            return "#REF!"
        return absolute_column + column_name(col) + absolute_row + str(row)

    # Both string literals and quoted sheet names stay byte-for-byte unchanged.
    parts = re.split(r'("(?:[^"]|"")*"|\'(?:[^\']|\'\')*\')', formula)
    for index in range(0, len(parts), 2):
        parts[index] = re.sub(r"(?<![A-Za-z0-9_])([$]?)([A-Z]{1,3})([$]?)(\d+)(?![A-Za-z0-9_(])", reference, parts[index])
    return "".join(parts)


class FormulaParser:
    def __init__(self, source):
        self.source, self.pos = source, 0

    def space(self):
        while self.pos < len(self.source) and self.source[self.pos].isspace():
            self.pos += 1

    def take(self, value):
        self.space()
        if not self.source.startswith(value, self.pos):
            raise ValueError(f"Expected {value!r} at {self.pos}: {self.source}")
        self.pos += len(value)

    def expression(self):
        self.space()
        if self.source.startswith("IF(", self.pos):
            self.take("IF(")
            condition = self.expression()
            self.take(",")
            yes = self.expression()
            self.space()
            no = False
            if self.source[self.pos] == ",":
                self.take(",")
                no = self.expression()
            self.take(")")
            node = {"if": [condition, yes, no]}
        elif self.source[self.pos] == '"':
            self.pos += 1
            chars = []
            while self.pos < len(self.source):
                char = self.source[self.pos]
                self.pos += 1
                if char == '"':
                    if self.pos < len(self.source) and self.source[self.pos] == '"':
                        chars.append('"')
                        self.pos += 1
                    else:
                        break
                else:
                    chars.append(char)
            else:
                raise ValueError("Unclosed string")
            node = "".join(chars)
        else:
            match = re.match(r"\$?([A-Z]+)\$?(\d+)", self.source[self.pos:])
            if not match:
                raise ValueError(f"Unsupported formula token at {self.pos}")
            self.pos += match.end()
            node = {"cell": match[1] + match[2]}
        self.space()
        if self.pos < len(self.source) and self.source[self.pos] == "=":
            self.pos += 1
            node = {"eq": [node, self.expression()]}
        return node

    def parse(self):
        ast = self.expression()
        self.space()
        if self.pos != len(self.source):
            raise ValueError("Unconsumed formula text")
        return ast


def main():
    archive = zipfile.ZipFile(SOURCE)
    strings = ["".join(item.itertext()) for item in ET.fromstring(archive.read("xl/sharedStrings.xml"))]
    workbook = ET.fromstring(archive.read("xl/workbook.xml"))
    relationships = {r.get("Id"): r.get("Target") for r in ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))}
    sheets, inventory = {}, []
    for sheet in workbook.find("m:sheets", NS):
        target = relationships[sheet.get("{" + REL + "}id")]
        target = target.lstrip("/") if target.startswith("/") else "xl/" + target
        xml = ET.fromstring(archive.read(target))
        cells, shared_anchors = {}, {}
        for cell in xml.findall(".//m:sheetData/m:row/m:c", NS):
            value = cell.find("m:v", NS)
            value = value.text if value is not None and value.text is not None else ""
            if cell.get("t") == "s":
                value = strings[int(value)]
            elif cell.get("t") == "inlineStr":
                value = "".join(cell.find("m:is", NS).itertext())
            formula = cell.find("m:f", NS)
            address = cell.get("r")
            cells[address] = {"value": value, "formula": formula.text if formula is not None else None, "hasFormula": formula is not None, "formulaAttributes": dict(formula.attrib) if formula is not None else {}}
            if formula is not None and formula.get("t") == "shared" and formula.text:
                shared_anchors[formula.get("si")] = (address, formula.text)
        for address, cell in cells.items():
            attrs = cell["formulaAttributes"]
            if attrs.get("t") == "shared":
                anchor, formula = shared_anchors[attrs["si"]]
                cell["sharedAnchor"] = anchor
                if not cell["formula"]:
                    cell["formula"] = translate_shared(formula, anchor, address)
        sheets[sheet.get("name")] = cells
        inventory.append({"name": sheet.get("name"), "visibility": sheet.get("state", "visible"), "formulaElements": len(xml.findall(".//m:f", NS)), "sharedFormulaElements": sum(c["formulaAttributes"].get("t") == "shared" for c in cells.values()), "sharedFormulaAnchors": len(shared_anchors), "hiddenRows": [r.get("r") for r in xml.findall(".//m:row", NS) if r.get("hidden") == "1"], "hiddenColumns": [c.attrib for c in xml.findall(".//m:col", NS) if c.get("hidden") == "1"]})
    questions = json.loads((ROOT / "dist/questions.json").read_text())["questions"]
    main_sheet, score_sheet = sheets["CoSN K-12CVAT"], sheets["Questions"]
    score_rows = {score_sheet[f"B{row}"]["value"]: row for row in range(2, 64)}
    records = {}
    for q in questions:
        guidance_cell = "E" + str(q["row"])
        cell = main_sheet.get(guidance_cell, {})
        formula = cell.get("formula")
        guidance = {"source": f"CoSN K-12CVAT!{guidance_cell}", "inputCell": "C" + str(q["row"]), "formula": formula, "ast": FormulaParser(formula).parse() if formula else None, "static": cell.get("value", "")}
        row = score_rows.get(q["id"])
        score = None
        if row:
            score = {"source": f"Questions!B{row}:R{row}", "row": row, "weight": float(score_sheet.get(f"K{row}", {}).get("value") or 0), "favorableAnswer": score_sheet.get(f"H{row}", {}).get("value", ""), "vendorLookupPresent": score_sheet.get(f"I{row}", {}).get("hasFormula", False), "vendorLookupFormula": score_sheet.get(f"I{row}", {}).get("formula"), "highRisk": float(score_sheet.get(f"K{row}", {}).get("value") or 0) > 20, "inOriginalPivotRange": row <= 62, "complianceFormula": score_sheet.get(f"J{row}", {}).get("formula"), "weightedScoreFormula": score_sheet.get(f"L{row}", {}).get("formula")}
        records[q["id"]] = {"id": q["id"], "section": q["section"], "mainRow": q["row"], "kind": q["kind"], "guidance": guidance, "score": score, "crosswalk": q["crosswalk"]}
    categories = []
    for row in range(2, 25):
        label = score_sheet.get(f"S{row}", {}).get("value", "")
        if not label:
            continue
        formula = score_sheet.get(f"T{row}", {}).get("formula", "")
        match = re.search(r'"([A-Z]{4})\*"', formula)
        if not match:
            raise ValueError("Unexpected category formula: " + formula)
        prefix = match[1]
        section = next(q["section"] for q in questions if q["id"].startswith(prefix + "-"))
        categories.append({"prefix": prefix, "section": section, "label": label, "sourceRow": row, "source": f"Questions!S{row}:X{row}", "maxScore": sum(r["score"]["weight"] for r in records.values() if r["id"].startswith(prefix + "-") and r["score"] is not None)})
    frameworks = [sheets["Standards Crosswalk"][col + "22"]["value"] for col in "CDEFGH"]
    dictionary = []
    detail = sheets["Crosswalk Detail"]
    for address, cell in detail.items():
        if not re.fullmatch(r"A\d+", address) or not cell["value"]:
            continue
        row = re.sub(r"\D", "", address)
        description = detail.get("B" + row, {}).get("value", "")
        if description:
            dictionary.append({"code": cell["value"], "description": description, "source": "Crosswalk Detail!A" + row + ":B" + row})
    result = {"schema": "cosn-cvat-assessment-source", "schemaVersion": 1, "version": "4.1", "sourceURL": "https://www.cosn.org/wp-content/uploads/2022/11/CoSN-K-12CVAT-Lite-V4.1-2.xlsx", "sourceSHA256": hashlib.sha256(SOURCE.read_bytes()).hexdigest(), "guidanceFormulaCount": sum(r["guidance"]["ast"] is not None for r in records.values()), "frameworks": frameworks, "questions": records, "categories": categories, "dictionary": dictionary, "qualitative": [{"id": id, "row": row, "complianceCell": f"Analyst Report!G{row}", "scoreCell": f"Analyst Report!H{row}"} for id, row in [("COMP-01", 33), ("COMP-02", 34), ("COMP-09", 35)]], "overall": {"formula": score_sheet["X25"]["formula"], "gradeFormula": score_sheet["W25"]["formula"], "source": "Questions!W25:X25", "method": "Arithmetic mean of the 15 category fractions; not a single weighted fraction across all questions."}, "adjustedCompany": {"formula": sheets["Analyst Report"]["H36"]["formula"], "source": "Analyst Report!H36", "method": "Company category raw score plus H33:H35; displayed separately from aggregate overall score."}, "inventory": inventory, "corrections": [{"id": "missing-company-lookups", "source": "Questions!I14:I15", "description": "Corrected mode reads the actual COMP-07 and COMP-08 vendor responses instead of the missing source lookups."}, {"id": "final-pivot-question", "source": "xl/pivotCache/pivotCacheDefinition1.xml worksheetSource A1:R62", "description": "Corrected high-risk list includes HLVU-03 at row63, which the original pivot range excludes."}, {"id": "applicability", "source": "Independent adaptation; CoSN usage guidance pp2–3", "description": "Corrected mode excludes explicitly inapplicable items/categories only with analyst reasons; source-compatible mode retains original denominators."}], "ambiguities": [{"id": "COMP-05", "source": "Questions!H12", "description": "Original favorable answer is Yes for a question about a security event. Both modes retain Yes unless the district explicitly records a corrected-mode interpretation override with a reason."}], "instructionCells": {address: cell["value"] for address, cell in sheets["Instructions"].items() if cell["value"]}}
    assert result["guidanceFormulaCount"] == 59
    assert len(categories) == 15
    assert len(records) == 76
    (ROOT / "dist/assessment-data.json").write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n")
    print(f"Extracted {len(records)} fields, 59 guidance formulas, 15 score categories, 6 frameworks, {len(dictionary)} historical control definitions; source unchanged.")


if __name__ == "__main__":
    main()
