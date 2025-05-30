import { useState } from 'react';
import { commands, page, userEvent } from '@vitest/browser/context';

import { DataGrid, type Column, type ColumnWidth, type ColumnWidths } from '../../../src';
import { resizeHandleClassname } from '../../../src/HeaderCell';
import { getGrid, getHeaderCells, setup } from '../utils';

interface Row {
  readonly col1: number;
  readonly col2: string;
}

function queryResizeHandle(column: Element) {
  return column.querySelector(`.${resizeHandleClassname}`);
}

function getResizeHandle(column: Element) {
  const resizeHandle = column.querySelector(`.${resizeHandleClassname}`);

  if (resizeHandle === null) {
    throw new Error('Resize handle not found');
  }

  return resizeHandle;
}

interface ResizeArgs {
  readonly column: Element;
  readonly resizeBy: number | readonly number[];
}

async function resize({ column, resizeBy }: ResizeArgs) {
  expect(getResizeHandle(column)).toBeInTheDocument();

  // @ts-expect-error
  await commands.resizeColumn(resizeBy);
}

async function autoResize(column: Element) {
  const resizeHandle = getResizeHandle(column);

  await userEvent.dblClick(resizeHandle);
}

const columns: readonly Column<Row>[] = [
  {
    key: 'col1',
    name: 'col1',
    width: 100
  },
  {
    key: 'col2',
    name: 'col2',
    minWidth: 100,
    width: 200,
    maxWidth: 400,
    resizable: true
  }
];

test('cannot resize or auto resize column when resizable is not specified', () => {
  setup<Row, unknown>({ columns, rows: [] });
  const [col1] = getHeaderCells();
  expect(queryResizeHandle(col1)).not.toBeInTheDocument();
});

test('should resize column when dragging the handle', async () => {
  const onColumnResize = vi.fn();
  setup<Row, unknown>({ columns, rows: [], onColumnResize });
  const grid = getGrid();
  expect(onColumnResize).not.toHaveBeenCalled();
  await expect.element(grid).toHaveStyle({ gridTemplateColumns: '100px 200px' });
  const [, col2] = getHeaderCells();
  await resize({ column: col2, resizeBy: -50 });
  await expect.element(grid).toHaveStyle({ gridTemplateColumns: '100px 150px' });
  expect(onColumnResize).toHaveBeenCalledExactlyOnceWith(expect.objectContaining(columns[1]), 150);
});

test('should use the maxWidth if specified when dragging the handle', async () => {
  setup<Row, unknown>({ columns, rows: [] });
  const grid = getGrid();
  await expect.element(grid).toHaveStyle({ gridTemplateColumns: '100px 200px ' });
  const [, col2] = getHeaderCells();
  await resize({ column: col2, resizeBy: 1000 });
  await expect.element(grid).toHaveStyle({ gridTemplateColumns: '100px 400px' });
});

test('should use the minWidth if specified when dragging the handle', async () => {
  setup<Row, unknown>({ columns, rows: [] });
  const grid = getGrid();
  await expect.element(grid).toHaveStyle({ gridTemplateColumns: '100px 200px' });
  const [, col2] = getHeaderCells();
  await resize({ column: col2, resizeBy: -150 });
  await expect.element(grid).toHaveStyle({ gridTemplateColumns: '100px 100px' });
});

test('should resize column using keboard', async () => {
  const onColumnResize = vi.fn();
  setup<Row, unknown>({ columns, rows: [], onColumnResize });
  const grid = getGrid();
  expect(onColumnResize).not.toHaveBeenCalled();
  await expect.element(grid).toHaveStyle({ gridTemplateColumns: '100px 200px' });
  const [, col2] = getHeaderCells();
  await userEvent.click(col2);

  await userEvent.keyboard('{Control>}{ArrowRight}{/Control}');
  await expect.element(grid).toHaveStyle({ gridTemplateColumns: '100px 210px' });
  expect(onColumnResize).toHaveBeenCalledWith(expect.objectContaining(columns[1]), 210);

  await userEvent.keyboard('{Control>}{ArrowLeft}{/Control}');
  await expect.element(grid).toHaveStyle({ gridTemplateColumns: '100px 200px' });
  expect(onColumnResize).toHaveBeenCalledWith(expect.objectContaining(columns[1]), 200);
  expect(onColumnResize).toHaveBeenCalledTimes(2);
});

test('should use the maxWidth if specified when resizing using keyboard', async () => {
  const onColumnResize = vi.fn();
  setup<Row, unknown>({ columns, rows: [], onColumnResize });
  const grid = getGrid();
  await expect.element(grid).toHaveStyle({ gridTemplateColumns: '100px 200px ' });
  const [, col2] = getHeaderCells();
  await userEvent.click(col2);
  await userEvent.keyboard(`{Control>}${'{ArrowRight}'.repeat(22)}{/Control}`);
  await expect.element(grid).toHaveStyle({ gridTemplateColumns: '100px 400px' });
  expect(onColumnResize).toHaveBeenCalledTimes(20);
});

test('should use the minWidth if specified resizing using keyboard', async () => {
  const onColumnResize = vi.fn();
  setup<Row, unknown>({ columns, rows: [], onColumnResize });
  const grid = getGrid();
  await expect.element(grid).toHaveStyle({ gridTemplateColumns: '100px 200px' });
  const [, col2] = getHeaderCells();
  await userEvent.click(col2);
  await userEvent.keyboard(`{Control>}${'{ArrowLeft}'.repeat(12)}{/Control}`);
  await expect.element(grid).toHaveStyle({ gridTemplateColumns: '100px 100px' });
  expect(onColumnResize).toHaveBeenCalledTimes(10);
});

test('should auto resize column when resize handle is double clicked', async () => {
  const onColumnResize = vi.fn();
  setup<Row, unknown>({
    columns,
    rows: [
      {
        col1: 1,
        col2: 'a'.repeat(50)
      }
    ],
    onColumnResize
  });
  const grid = getGrid();
  await expect.element(grid).toHaveStyle({ gridTemplateColumns: '100px 200px' });
  const [, col2] = getHeaderCells();
  await autoResize(col2);
  await expect.element(grid).toHaveStyle({ gridTemplateColumns: '100px 327.703px' });
  expect(onColumnResize).toHaveBeenCalledExactlyOnceWith(
    expect.objectContaining(columns[1]),
    327.703125
  );
});

test('should use the maxWidth if specified on auto resize', async () => {
  setup<Row, unknown>({
    columns,
    rows: [
      {
        col1: 1,
        col2: 'a'.repeat(500)
      }
    ]
  });
  const grid = getGrid();
  await expect.element(grid).toHaveStyle({ gridTemplateColumns: '100px 200px' });
  const [, col2] = getHeaderCells();
  await autoResize(col2);
  await expect.element(grid).toHaveStyle({ gridTemplateColumns: '100px 400px' });
});

test('should use the minWidth if specified on auto resize', async () => {
  setup<Row, unknown>({
    columns,
    rows: [
      {
        col1: 1,
        col2: 'a'
      }
    ]
  });
  const grid = getGrid();
  await expect.element(grid).toHaveStyle({ gridTemplateColumns: '100px 200px' });
  const [, col2] = getHeaderCells();
  await autoResize(col2);
  await expect.element(grid).toHaveStyle({ gridTemplateColumns: '100px 100px' });
});

test('should remeasure flex columns when resizing a column', async () => {
  const onColumnResize = vi.fn();
  setup<
    {
      readonly col1: string;
      readonly col2: string;
      readonly col3: string;
    },
    unknown
  >({
    columns: [
      {
        key: 'col1',
        name: 'col1',
        resizable: true
      },
      {
        key: 'col2',
        name: 'col2',
        resizable: true
      },
      {
        key: 'col3',
        name: 'col3',
        resizable: true
      }
    ],
    rows: [
      {
        col1: 'a'.repeat(10),
        col2: 'a'.repeat(10),
        col3: 'a'.repeat(10)
      }
    ],
    onColumnResize
  });
  const grid = getGrid();
  await expect.element(grid).toHaveStyle({ gridTemplateColumns: '639.328px 639.328px 639.344px' });
  const [col1] = getHeaderCells();
  await autoResize(col1);
  await expect.element(grid).toHaveStyle({ gridTemplateColumns: '79.1406px 919.422px 919.438px' });
  expect(onColumnResize).toHaveBeenCalledOnce();
  // onColumnResize is not called if width is not changed
  await autoResize(col1);
  await expect.element(grid).toHaveStyle({ gridTemplateColumns: '79.1406px 919.422px 919.438px' });
  expect(onColumnResize).toHaveBeenCalledOnce();
});

test('should use columnWidths and onColumnWidthsChange props when provided', async () => {
  const onColumnWidthsChangeSpy = vi.fn();
  const onColumnResizeSpy = vi.fn();

  function TestGrid() {
    const [columnWidths, setColumnWidths] = useState(
      (): ColumnWidths =>
        new Map<string, ColumnWidth>([
          ['col1', { width: 101, type: 'measured' }],
          ['col2', { width: 201, type: 'measured' }]
        ])
    );

    function onColumnWidthsChange(newColumnWidths: ColumnWidths) {
      setColumnWidths(newColumnWidths);
      onColumnWidthsChangeSpy(newColumnWidths);
    }

    function changedColumnWidths() {
      setColumnWidths(
        new Map<string, ColumnWidth>([
          ['col1', { width: 120, type: 'measured' }],
          ['col2', { width: 120, type: 'measured' }]
        ])
      );
    }

    return (
      <>
        <button type="button" onClick={changedColumnWidths}>
          Change widths
        </button>
        <DataGrid<Row>
          columns={columns}
          rows={[]}
          columnWidths={columnWidths}
          onColumnWidthsChange={onColumnWidthsChange}
          onColumnResize={onColumnResizeSpy}
        />
      </>
    );
  }

  page.render(<TestGrid />);

  const grid = getGrid();
  await expect.element(grid).toHaveStyle({ gridTemplateColumns: '101px 201px' });
  const [, col2] = getHeaderCells();
  await autoResize(col2);
  expect(onColumnWidthsChangeSpy).toHaveBeenCalledExactlyOnceWith(
    new Map([
      ['col1', { width: 101, type: 'measured' }],
      ['col2', { width: 100, type: 'resized' }]
    ])
  );
  expect(onColumnResizeSpy).toHaveBeenCalledExactlyOnceWith(
    expect.objectContaining(columns[1]),
    100
  );
  onColumnWidthsChangeSpy.mockClear();
  onColumnResizeSpy.mockClear();

  await resize({ column: col2, resizeBy: [5, 5, 5] });
  expect(onColumnWidthsChangeSpy).toHaveBeenCalledExactlyOnceWith(
    new Map([
      ['col1', { width: 101, type: 'measured' }],
      ['col2', { width: 115, type: 'resized' }]
    ])
  );
  expect(onColumnResizeSpy).toHaveBeenCalledTimes(3);
  expect(onColumnResizeSpy).toHaveBeenNthCalledWith(1, expect.objectContaining(columns[1]), 105);
  expect(onColumnResizeSpy).toHaveBeenNthCalledWith(2, expect.objectContaining(columns[1]), 110);
  expect(onColumnResizeSpy).toHaveBeenNthCalledWith(3, expect.objectContaining(columns[1]), 115);
  onColumnWidthsChangeSpy.mockClear();
  onColumnResizeSpy.mockClear();

  await userEvent.click(page.getByRole('button', { name: 'Change widths' }));
  expect(onColumnWidthsChangeSpy).not.toHaveBeenCalled();
  expect(onColumnResizeSpy).not.toHaveBeenCalled();
  await expect.element(grid).toHaveStyle({ gridTemplateColumns: '120px 120px' });
  await resize({ column: col2, resizeBy: [5, 5] });
  expect(onColumnWidthsChangeSpy).toHaveBeenCalledExactlyOnceWith(
    new Map([
      ['col1', { width: 120, type: 'measured' }],
      ['col2', { width: 130, type: 'resized' }]
    ])
  );
});
