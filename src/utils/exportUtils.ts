interface Column {
    key: string
    label: string
    render?: (value: any, row: any) => React.ReactNode
  }
  
  export const exportToCSV = (data: any[], columns: Column[], filename: string) => {
    // Escape a CSV field value per RFC 4180
    const escapeCSVField = (value: any): string => {
      if (value === null || value === undefined) return '';
      const str = String(value);
      // Quote field if it contains comma, newline, or quote
      if (str.includes(',') || str.includes('\n') || str.includes('"')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csvContent = [
      // Header row
      columns.map(col => escapeCSVField(col.label)).join(','),
      // Data rows
      ...data.map(row =>
        columns.map(col => escapeCSVField(row[col.key])).join(',')
      )
    ].join('\n')

    // Validate data not empty
    if (data.length === 0) {
      return; // Silent fail for empty exports
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
  