import {
  Document, Packer, Paragraph, Table, TableRow, TableCell,
  TextRun, AlignmentType, WidthType, BorderStyle, ShadingType,
  HeadingLevel, VerticalAlign,
} from 'docx';
import { saveAs } from 'file-saver';

export interface FilmingEntry {
  camera: number;
  startTime: string;
  operator: string;
  location: string;
  reporters: string;
}

export interface WeekScheduleEntry {
  date: string;
  groupName: string;
  workers: string[];
  startTime: string;
  endTime: string;
  note: string;
}

function cell(text: string, opts: { bold?: boolean; color?: string; shading?: string; span?: number } = {}): TableCell {
  return new TableCell({
    columnSpan: opts.span,
    shading: opts.shading ? { type: ShadingType.CLEAR, fill: opts.shading } : undefined,
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text,
            bold: opts.bold ?? false,
            color: opts.color ?? '000000',
            size: 20,
            font: 'Times New Roman',
          }),
        ],
      }),
    ],
  });
}

function border() {
  return { style: BorderStyle.SINGLE, size: 6, color: '000000' };
}

export async function exportFilmingScheduleWord(
  entries: FilmingEntry[],
  date: string,
) {
  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      cell('Kamera raqami', { bold: true, shading: 'D0E8FF' }),
      cell('Chiqish vaqti', { bold: true, shading: 'D0E8FF' }),
      cell('Operator va texnik xodim', { bold: true, shading: 'D0E8FF' }),
      cell("Tadbir o'tkazilish joyi va tadbir mavzusi", { bold: true, shading: 'D0E8FF' }),
      cell('Muxbirlar', { bold: true, shading: 'D0E8FF' }),
    ],
  });

  const dataRows = entries.map(
    (e) =>
      new TableRow({
        children: [
          cell(String(e.camera)),
          cell(e.startTime),
          cell(e.operator),
          cell(e.location || '—'),
          cell(e.reporters || '—'),
        ],
      }),
  );

  const equipRow = new TableRow({
    children: [
      new TableCell({
        columnSpan: 5,
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: "Kerakli jihoz va texnika: ", bold: true, size: 20, font: 'Times New Roman' }),
              new TextRun({ text: '_'.repeat(60), size: 20, font: 'Times New Roman' }),
            ],
          }),
        ],
      }),
    ],
  });

  const mainTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: border(), bottom: border(), left: border(), right: border(),
      insideHorizontal: border(), insideVertical: border(),
    },
    rows: [headerRow, ...dataRows, equipRow],
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: { margin: { top: 720, bottom: 720, left: 1080, right: 720 } },
        },
        children: [
          // Title row: left title, right TASDIQLAYMAN
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
              bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
              left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
              right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
              insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
              insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 65, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ text: "TASVIRGA OLISH JADVALI", bold: true, size: 28, font: 'Times New Roman' }),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: `Sana: ${date}`, size: 22, font: 'Times New Roman' }),
                        ],
                      }),
                    ],
                  }),
                  new TableCell({
                    width: { size: 35, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: 'TASDIQLAYMAN', bold: true, size: 22, font: 'Times New Roman' })],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: "O'zbekiston 24 telekanali", size: 20, font: 'Times New Roman' })],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: 'Direktor _______________', size: 20, font: 'Times New Roman' })],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: `"___" ____________ ${new Date().getFullYear()} y.`, size: 20, font: 'Times New Roman' })],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          new Paragraph({ text: '' }),

          mainTable,

          new Paragraph({ text: '' }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Muhim eslatma! Tasvirga olish ishlari yakunlanishi bilan, material tayyorlashga kirishish shart.",
                bold: true,
                color: 'FF0000',
                size: 20,
                font: 'Times New Roman',
              }),
            ],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `tasvirga_olish_jadvali_${date.replace(/\./g, '_')}.docx`);
}

export async function exportWeekScheduleWord(
  groups: WeekScheduleEntry[],
  dateRange: string,
) {
  const rows = groups.flatMap((g) => [
    new TableRow({
      children: [
        new TableCell({
          columnSpan: 4,
          shading: { type: ShadingType.CLEAR, fill: 'EFF6FF' },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: `${g.date} — ${g.groupName}`, bold: true, size: 20, font: 'Times New Roman' }),
              ],
            }),
          ],
        }),
      ],
    }),
    new TableRow({
      children: [
        cell('Xodim ismi', { bold: true, shading: 'DBEAFE' }),
        cell('Boshlanish', { bold: true, shading: 'DBEAFE' }),
        cell('Tugash', { bold: true, shading: 'DBEAFE' }),
        cell('Izoh', { bold: true, shading: 'DBEAFE' }),
      ],
    }),
    ...g.workers.map(
      (w) =>
        new TableRow({
          children: [cell(w), cell(g.startTime), cell(g.endTime), cell(g.note || '—')],
        }),
    ),
    new TableRow({
      children: [
        new TableCell({
          columnSpan: 4,
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: 'Kerakli jihoz va texnika: ', bold: true, size: 20, font: 'Times New Roman' }),
                new TextRun({ text: '_'.repeat(50), size: 20, font: 'Times New Roman' }),
              ],
            }),
          ],
        }),
      ],
    }),
  ]);

  const doc = new Document({
    sections: [
      {
        properties: {
          page: { margin: { top: 720, bottom: 720, left: 1080, right: 720 } },
        },
        children: [
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [new TextRun({ text: 'ISH JADVALI', bold: true, size: 28, font: 'Times New Roman' })],
          }),
          new Paragraph({
            children: [new TextRun({ text: `Sana: ${dateRange}`, size: 22, font: 'Times New Roman' })],
          }),
          new Paragraph({ text: '' }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: border(), bottom: border(), left: border(), right: border(),
              insideHorizontal: border(), insideVertical: border(),
            },
            rows,
          }),
          new Paragraph({ text: '' }),
          new Paragraph({
            children: [
              new TextRun({
                text: "Muhim eslatma! Tasvirga olish ishlari yakunlanishi bilan, material tayyorlashga kirishish shart.",
                bold: true, color: 'FF0000', size: 20, font: 'Times New Roman',
              }),
            ],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `ish_jadvali_${dateRange.replace(/[.\s—]/g, '_')}.docx`);
}
