import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Typography,
    useMediaQuery,
    useTheme,
    Theme
} from '@mui/material';
import { ReactNode } from 'react';
import { formatGermanDateTime } from '@/common/components/dateUtils';

interface ListItem {
    id: string | number;
    [key: string]: any;
}

interface ColumnDefinition<T extends ListItem> {
    key: keyof T;
    label: string;
    width?: string | number;
    minWidth?: string | number;
    maxWidth?: string | number;
    flex?: number;
    align?: 'inherit' | 'left' | 'center' | 'right' | 'justify';
    type?: 'text' | 'date';
    hideOn?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

interface MultiColumnListProps<T extends ListItem> {
    columns: ColumnDefinition<T>[];
    data: T[];
    actionColumn?: boolean | ((item: T) => ReactNode);
    actionWidth?: string | number;
    emptyMessage?: string;
}

function CustomTable<T extends ListItem>({
    columns,
    data,
    actionColumn = true,
    actionWidth = '120px',
    emptyMessage = 'Keine Daten gefunden'
}: MultiColumnListProps<T>) {
    // Get theme for media queries
    const theme: Theme = useTheme();

    // Create media query matches for each breakpoint
    const matches = {
        xs: useMediaQuery(theme.breakpoints.down('xs')),
        sm: useMediaQuery(theme.breakpoints.down('sm')),
        md: useMediaQuery(theme.breakpoints.down('md')),
        lg: useMediaQuery(theme.breakpoints.down('lg')),
        xl: useMediaQuery(theme.breakpoints.down('xl'))
    };

    // Helper function to determine if a column should be hidden
    const isColumnHidden = (column: ColumnDefinition<T>): boolean => {
        if (!column.hideOn) return false;
        return matches[column.hideOn];
    };

    // Helper function to render cell content
    const renderCellContent = (item: T, column: ColumnDefinition<T>) => {
        const value = item[column.key];

        // If it's a date column, format the date
        if (column.type === 'date' && value) {
            return formatGermanDateTime(value);
        }

        // Default rendering
        return value;
    };

    // Helper function to render action column
    const renderActionColumn = (item: T) => {
        if (typeof actionColumn === 'function') {
            return actionColumn(item);
        }
        return null;
    };

    // Filter out hidden columns
    const visibleColumns = columns.filter(column => !isColumnHidden(column));

    return (
        <TableContainer component={Paper} elevation={3}>
            <Table sx={{ tableLayout: 'fixed', width: '100%' }}>
                <TableHead>
                    <TableRow>
                        {visibleColumns.map((column) => (
                            <TableCell
                                key={String(column.key)}
                                align={column.align || 'left'}
                                sx={{
                                    fontWeight: 'bold',
                                    width: column.width,
                                    minWidth: column.minWidth,
                                    maxWidth: column.maxWidth,
                                    flex: column.flex,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                {column.label}
                            </TableCell>
                        ))}
                        {actionColumn && (
                            <TableCell
                                align="right"
                                sx={{
                                    fontWeight: 'bold',
                                    width: actionWidth,
                                    minWidth: actionWidth
                                }}
                            >
                                Aktionen
                            </TableCell>
                        )}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {data.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={visibleColumns.length + (actionColumn ? 1 : 0)}>
                                <Typography
                                    variant="body2"
                                    color="textSecondary"
                                    align="center"
                                >
                                    {emptyMessage}
                                </Typography>
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((item) => (
                            <TableRow key={item.id} hover>
                                {visibleColumns.map((column) => (
                                    <TableCell
                                        key={String(column.key)}
                                        align={column.align || 'left'}
                                        sx={{
                                            width: column.width,
                                            minWidth: column.minWidth,
                                            maxWidth: column.maxWidth,
                                            flex: column.flex,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                        }}
                                    >
                                        {renderCellContent(item, column)}
                                    </TableCell>
                                ))}
                                {actionColumn && (
                                    <TableCell
                                        align="right"
                                        sx={{
                                            width: actionWidth,
                                            minWidth: actionWidth
                                        }}
                                    >
                                        {renderActionColumn(item)}
                                    </TableCell>
                                )}
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </TableContainer>
    );
}

export default CustomTable;