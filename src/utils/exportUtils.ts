interface Column {
    key: string
    label: string
    render?: (value: any, row: any) => React.ReactNode
  }
  
  export const exportToCSV = (data: any[], columns: Column[], filename: string) => {
    const csvContent = [
      // Header row
      columns.map(col => col.label).join(','),
      // Data rows
      ...data.map(row =>
        columns.map(col => {
          const value = row[col.key]
          // Escape commas and quotes in CSV
          return typeof value === 'string' && (value.includes(',') || value.includes('"'))
            ? `"${value.replace(/"/g, '""')}"`
            : value
        }).join(',')
      )
    ].join('\n')
  
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
  