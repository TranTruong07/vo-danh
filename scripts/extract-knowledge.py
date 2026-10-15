"""Offline only. Preserve DOCX body order, paragraphs, table cells and locators."""
import argparse
import hashlib
import json
import re
import sys
import unicodedata
import zipfile
from pathlib import Path

from docx import Document
from docx.table import Table
from docx.text.paragraph import Paragraph


def normalize_source(text):
    return re.sub(r"\s+", " ", unicodedata.normalize("NFC", text)).strip()


def extract(source):
    source = Path(source)
    if source.stat().st_size > 10 * 1024 * 1024:
        raise ValueError("DOCX vượt 10 MB.")
    with zipfile.ZipFile(source) as archive:
        if sum(entry.file_size for entry in archive.infolist()) > 40 * 1024 * 1024:
            raise ValueError("DOCX giải nén vượt 40 MB.")
    document = Document(source)
    blocks, sections, warnings = [], [], []
    major, section = "PREAMBLE", "PREAMBLE"
    paragraph_index, table_index = 0, 0

    def add(text, kind, path, **locator):
        nonlocal major, section
        text = unicodedata.normalize("NFC", text)
        normalized = normalize_source(text)
        top = re.match(r"^(VIII|VII|VI|V|IV|IX|III|II|I|X)\.\s+(.+)$", normalized)
        sub = re.match(r"^(\d+)\.\s+(.+)$", normalized)
        heading = False
        if kind == "paragraph" and top:
            major = section = top[1]
            sections.append({"sectionId": section, "title": top[2]})
            heading = True
        elif kind == "paragraph" and sub and major != "PREAMBLE":
            section = f"{major}.{sub[1]}"
            # In IX numbered paragraphs are complete historical content, not just headings.
            heading = major != "IX"
        blocks.append({"id": path, "order": len(blocks), "kind": kind,
                       "sectionId": section, "isHeading": heading, "text": text,
                       "normalizedText": normalized, **locator})

    def walk(parent, element, path="body", cell_locator=None):
        nonlocal paragraph_index, table_index
        for offset, child in enumerate(element):
            tag = child.tag.rsplit("}", 1)[-1]
            child_path = f"{path}/{offset}"
            if tag == "p":
                index = paragraph_index
                paragraph_index += 1
                add(Paragraph(child, parent).text, "table_paragraph" if cell_locator else "paragraph",
                    child_path, paragraphIndex=index, **(cell_locator or {}))
            elif tag == "tbl":
                index = table_index
                table_index += 1
                table = Table(child, parent)
                # Iterate physical cells: merged cells must not duplicate their text.
                for row_index, row in enumerate(child.findall("{*}tr")):
                    for cell_index, cell in enumerate(row.findall("{*}tc")):
                        walk(table, cell, f"{child_path}/row/{row_index}/cell/{cell_index}",
                             {"tableIndex": index, "rowIndex": row_index, "cellIndex": cell_index})
            elif tag == "sectPr":
                continue
            else:
                # Surface unsupported source constructs rather than silently losing knowledge.
                warnings.append(f"Cần kiểm tra phần tử {tag} tại {child_path}.")

    walk(document, document.element.body)
    for block in blocks:
        if "Đính chính" in block["text"] or block["sectionId"].startswith("V.2"):
            warnings.append(f"REVIEW_LE_DUAN: đối chiếu {block['id']} với đính chính sau bảng V.5 và IX.4.")
    return {"schemaVersion": 1, "document": source.name,
            "sourceSha256": hashlib.sha256(source.read_bytes()).hexdigest(),
            "locatorConvention": "zero-based; body offsets include tables; paragraphIndex includes table paragraphs",
            "sections": sections, "blocks": blocks, "warnings": warnings,
            "counts": {"paragraphs": paragraph_index, "tables": table_index, "blocks": len(blocks)}}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", default="docs/source/Tong-hop-kien-thuc.docx")
    parser.add_argument("--out", default="knowledge/extraction-manifest.json")
    parser.add_argument("--check", action="store_true", help="Re-extract and compare without writing.")
    args = parser.parse_args()
    output = Path(args.out)
    try:
        data = extract(args.source)
        if args.check:
            if json.loads(output.read_text(encoding="utf-8")) != data:
                raise ValueError("Manifest không khớp DOCX; cần trích xuất và đối chiếu lại bản nháp.")
        else:
            output.parent.mkdir(parents=True, exist_ok=True)
            output.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(json.dumps({"ok": True, "mode": "check" if args.check else "extract", **data["counts"]}))
    except (OSError, ValueError, zipfile.BadZipFile) as error:
        print(f"Không trích xuất được: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
