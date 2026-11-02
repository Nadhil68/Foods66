export const jsonToCSV = (data) => {
    if (!data || !data.length) {
        return '';
    }
    const headers = Object.keys(data[0]);
    const csvRows = [];
    // Add headers
    csvRows.push(headers.join(','));
    // Add rows
    for (const row of data) {
        const values = headers.map(header => {
            const val = row[header];
            const escaped = ('' + val).replace(/"/g, '""');
            return `"${escaped}"`;
        });
        csvRows.push(values.join(','));
    }
    return csvRows.join('\n');
};
//# sourceMappingURL=exportUtils.js.map