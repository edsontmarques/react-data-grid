import { useMemo } from 'react';
import { createLazyFileRoute } from '@tanstack/react-router';

import DataGrid from '../../src';
import type { Column } from '../../src';
import { renderCoordinates } from '../renderers';
import { useDirection } from '../directionContext';

export const Route = createLazyFileRoute('/MillionCells')({
  component: MillionCells
});

type Row = number;
const rows: readonly Row[] = [...Array(1000).keys()];

function MillionCells() {
  const direction = useDirection();

  const columns = useMemo((): readonly Column<Row>[] => {
    const columns: Column<Row>[] = [];

    for (let i = 0; i < 1000; i++) {
      const key = String(i);
      columns.push({
        key,
        name: key,
        frozen: i < 5,
        width: 80,
        resizable: true,
        renderCell: renderCoordinates
      });
    }

    return columns;
  }, []);

  return (
    <DataGrid
      columns={columns}
      rows={rows}
      rowHeight={22}
      className="fill-grid"
      direction={direction}
    />
  );
}
