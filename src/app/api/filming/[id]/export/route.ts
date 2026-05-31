import { requireAuth } from '@/lib/auth-helpers';
import { handleError, apiResponse } from '@/lib/api-response';
import { prisma } from '@/lib/prisma';
import {
  Document, Packer, Paragraph, Table, TableRow, TableCell,
  TextRun, AlignmentType, WidthType, BorderStyle, ShadingType,
  type TableVerticalAlign,
} from 'docx';

const VerticalAlignCenter = 'center' as TableVerticalAlign;

const UZ_MONTHS = [
  'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr',
];

function uzDate(d: Date): string {
  const dd = d.getUTCDate().toString().padStart(2, '0');
  return `${dd} ${UZ_MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()} yil`;
}

function isoDate(d: Date): string {
  const dd = d.getUTCDate().toString().padStart(2, '0');
  const mm = (d.getUTCMonth() + 1).toString().padStart(2, '0');
  return `${d.getUTCFullYear()}-${mm}-${dd}`;
}

const SOLID = { style: BorderStyle.SINGLE, size: 6, color: '000000' };
const NONE  = { style: BorderStyle.NIL, size: 0, color: 'FFFFFF' };

// Column widths in DXA (A4 17cm usable = 9638 twips)
const COL_W = [1446, 1157, 1928, 3181, 1928] as const;

function makeCell(
  runs: TextRun[],
  opts: {
    width?: number;
    span?: number;
    fill?: string;
    align?: typeof AlignmentType[keyof typeof AlignmentType];
    borders?: 'solid' | 'none';
  } = {},
): TableCell {
  return new TableCell({
    columnSpan: opts.span,
    width: opts.width !== undefined ? { size: opts.width, type: WidthType.DXA } : undefined,
    shading: opts.fill ? { type: ShadingType.CLEAR, fill: opts.fill } : undefined,
    verticalAlign: VerticalAlignCenter,
    margins: { top: 80, bottom: 80, left: 100, right: 100 },
    borders: opts.borders === 'none'
      ? { top: NONE, bottom: NONE, left: NONE, right: NONE }
      : { top: SOLID, bottom: SOLID, left: SOLID, right: SOLID },
    children: [
      new Paragraph({
        alignment: opts.align ?? AlignmentType.LEFT,
        spacing: { line: 276 },
        children: runs,
      }),
    ],
  });
}

function run(text: string, opts: { bold?: boolean; color?: string; size?: number } = {}): TextRun {
  return new TextRun({
    text,
    bold: opts.bold ?? false,
    color: opts.color ?? '000000',
    size: opts.size ?? 20,
    font: 'Times New Roman',
  });
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  try {
    await requireAuth();

    const entry = await prisma.filmingEntry.findUnique({
      where: { id: params.id },
      include: { operators: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!entry) return apiResponse.notFound('Jadval topilmadi');

    const dateObj = new Date(entry.date);
    const dateUz  = uzDate(dateObj);
    const dateIso = isoDate(dateObj);

    // ── Header table (borderless, 2 columns) ────────────────────────────
    const headerTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: NONE, bottom: NONE, left: NONE, right: NONE,
        insideHorizontal: NONE, insideVertical: NONE,
      },
      rows: [
        new TableRow({
          children: [
            // Left: title + date
            new TableCell({
              width: { size: 6000, type: WidthType.DXA },
              borders: { top: NONE, bottom: NONE, left: NONE, right: NONE },
              children: [
                new Paragraph({
                  children: [run('Tasvirga olish jadvali', { bold: true, size: 26 })],
                }),
                new Paragraph({
                  spacing: { before: 60 },
                  children: [run(dateUz, { size: 22 })],
                }),
              ],
            }),
            // Right: TASDIQLAYMAN block
            new TableCell({
              width: { size: 3638, type: WidthType.DXA },
              borders: { top: NONE, bottom: NONE, left: NONE, right: NONE },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [run('"TASDIQLAYMAN"', { bold: true, size: 24 })],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { before: 60 },
                  children: [run('"O\'zbekiston 24" ijodiy', { size: 20 })],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [run('birlashmasi" DM direktori', { size: 20 })],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { before: 80 },
                  children: [run(`__________${entry.approvedBy}`, { size: 20 })],
                }),
              ],
            }),
          ],
        }),
      ],
    });

    // ── Warning text ─────────────────────────────────────────────────────
    const warningPara = new Paragraph({
      spacing: { before: 200, after: 200 },
      children: [
        run(
          'Muhim eslatma! Tasvirga olish ishlari yakunlanishi bilan, material tayyorlashga kirishish shart.',
          { bold: true, color: 'FF0000', size: 20 },
        ),
      ],
    });

    // ── Main table ───────────────────────────────────────────────────────
    const headerRow = new TableRow({
      tableHeader: true,
      children: [
        makeCell([run('Kamera raqami', { bold: true })], { width: COL_W[0], fill: 'D3D3D3', align: AlignmentType.CENTER }),
        makeCell([run('Chiqish vaqti', { bold: true })], { width: COL_W[1], fill: 'D3D3D3', align: AlignmentType.CENTER }),
        makeCell([run('Operator va texnik xodim', { bold: true })], { width: COL_W[2], fill: 'D3D3D3', align: AlignmentType.CENTER }),
        makeCell([run("Tadbir o'tkazilish joyi va tadbir mavzusi", { bold: true })], { width: COL_W[3], fill: 'D3D3D3', align: AlignmentType.CENTER }),
        makeCell([run('Muxbirlar', { bold: true })], { width: COL_W[4], fill: 'D3D3D3', align: AlignmentType.CENTER }),
      ],
    });

    const dataRows = entry.operators.flatMap((op) => {
      const operatorText = op.operatorNames.join('\n') || '—';
      const locationText = op.eventDescription
        ? `${op.eventLocation}\n${op.eventDescription}`
        : op.eventLocation;
      const reporterText = op.reporterNames.join('\n') || '—';

      const dataRow = new TableRow({
        children: [
          makeCell([run(op.cameraNumber)], { width: COL_W[0], align: AlignmentType.CENTER }),
          makeCell([run(op.exitTime)], { width: COL_W[1], align: AlignmentType.CENTER }),
          makeCell([run(operatorText)], { width: COL_W[2] }),
          makeCell([run(locationText)], { width: COL_W[3] }),
          makeCell([run(reporterText)], { width: COL_W[4] }),
        ],
      });

      const equipRow = new TableRow({
        children: [
          new TableCell({
            columnSpan: 5,
            shading: { type: ShadingType.CLEAR, fill: 'BDD7EE' },
            verticalAlign: VerticalAlignCenter,
            margins: { top: 80, bottom: 80, left: 100, right: 100 },
            borders: { top: SOLID, bottom: SOLID, left: SOLID, right: SOLID },
            children: [
              new Paragraph({
                children: [
                  run('Kerakli jihoz va texnika:   ', { bold: true, size: 20 }),
                  run(op.equipment, { size: 20 }),
                ],
              }),
            ],
          }),
        ],
      });

      return [dataRow, equipRow];
    });

    const mainTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: SOLID, bottom: SOLID, left: SOLID, right: SOLID,
        insideHorizontal: SOLID, insideVertical: SOLID,
      },
      rows: [headerRow, ...dataRows],
    });

    // ── Build document ───────────────────────────────────────────────────
    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              size: { width: 11906, height: 16838 },
              margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 },
            },
          },
          children: [
            headerTable,
            new Paragraph({ text: '' }),
            warningPara,
            mainTable,
          ],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);

    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="tasvirga-olish-jadvali-${dateIso}.docx"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (e) {
    return handleError(e);
  }
}
